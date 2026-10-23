"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const { randomBytes } = require("node:crypto");
const { Pool } = require("pg");
const { createApp } = require("../app");

test("HTTP CRUD persists in PostgreSQL using a restricted database role", async (t) => {
  assert.ok(process.env.TEST_DATABASE_URL, "Ustaw TEST_DATABASE_URL na oddzielną bazę testową.");
  const url = new URL(process.env.TEST_DATABASE_URL);
  const database = decodeURIComponent(url.pathname.slice(1));
  assert.match(database, /^[a-zA-Z0-9_]+_test$/, "Nazwa bazy testowej musi kończyć się na _test.");

  // Każde uruchomienie otrzymuje własny schemat i rolę, bez zmieniania public.
  const suffix = randomBytes(6).toString("hex");
  const schema = "tm_test_" + suffix;
  const role = "tm_app_" + suffix;
  const rolePassword = randomBytes(20).toString("hex");
  const admin = new Pool({ connectionString: url.href, connectionTimeoutMillis: 5000 });
  let schemaCreated = false;
  let roleCreated = false;
  let appPool;
  let server;

  t.after(async () => {
    try {
      if (server) await new Promise((resolve) => server.close(resolve));
      if (appPool) await appPool.end();
      if (schemaCreated) await admin.query('DROP SCHEMA "' + schema + '" CASCADE');
      if (roleCreated) {
        await admin.query('REVOKE CONNECT ON DATABASE "' + database + '" FROM "' + role + '"');
        await admin.query('DROP ROLE "' + role + '"');
      }
    } finally {
      await admin.end();
    }
  });

  await admin.query('CREATE SCHEMA "' + schema + '"');
  schemaCreated = true;
  const setup = await admin.connect();
  try {
    await setup.query('SET search_path TO "' + schema + '"');
    for (const filename of ["01_schema.sql", "02_seed.sql"]) {
      const sql = await fs.readFile(path.join(__dirname, "../../database", filename), "utf8");
      await setup.query(sql);
    }
  } finally {
    await setup.query("RESET search_path");
    setup.release();
  }

  // Nazwy i hasło pochodzą wyłącznie z randomBytes, nie z żądania HTTP.
  await admin.query('CREATE ROLE "' + role + '" LOGIN PASSWORD \'' + rolePassword + '\' NOSUPERUSER NOCREATEDB NOCREATEROLE');
  roleCreated = true;
  await admin.query('GRANT CONNECT ON DATABASE "' + database + '" TO "' + role + '"');
  await admin.query('GRANT USAGE ON SCHEMA "' + schema + '" TO "' + role + '"');
  await admin.query('GRANT SELECT ON "' + schema + '".users TO "' + role + '"');
  await admin.query('GRANT SELECT, INSERT, UPDATE, DELETE ON "' + schema + '".tasks TO "' + role + '"');
  const sequenceGrants = (await fs.readFile(path.join(__dirname, "../../database/05_app_permissions.sql"), "utf8"))
    .replaceAll("public.", '"' + schema + '".')
    .replaceAll("task_app", role);
  await admin.query(sequenceGrants);

  const appUrl = new URL(url);
  appUrl.username = role;
  appUrl.password = rolePassword;
  appPool = new Pool({ connectionString: appUrl.href, options: "-c search_path=" + schema, connectionTimeoutMillis: 5000 });
  const identity = await appPool.query("SELECT current_user");
  assert.equal(identity.rows[0].current_user, role);
  const user = await appPool.query("SELECT id FROM users WHERE login = $1", ["anna"]);
  const userId = user.rows[0].id;
  server = http.createServer(createApp({ pool: appPool, userId }));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const baseUrl = "http://127.0.0.1:" + server.address().port;
  const request = (method, endpoint = "/api/tasks", data) => fetch(baseUrl + endpoint, {
    method,
    headers: data === undefined ? {} : { "Content-Type": "application/json" },
    body: data === undefined ? undefined : JSON.stringify(data)
  });

  let createdId;
  await t.test("GET returns only the configured user's tasks", async () => {
    const response = await request("GET");
    assert.equal(response.status, 200);
    const tasks = await response.json();
    assert.equal(tasks.length, 2);
    assert.deepEqual(tasks.map((task) => task.title).sort(), ["Przygotować makietę", "Utworzyć tabele"]);
  });

  await t.test("POST creates a row with the configured owner and generated ID", async () => {
    const response = await request("POST", "/api/tasks", { title: "  Nowe zadanie  ", description: "Opis", status: "new" });
    assert.equal(response.status, 201);
    const task = await response.json();
    createdId = task.id;
    assert.equal(task.title, "Nowe zadanie");
    const stored = await admin.query('SELECT title, user_id FROM "' + schema + '".tasks WHERE id = $1', [createdId]);
    assert.deepEqual(stored.rows[0], { title: "Nowe zadanie", user_id: userId });
  });

  await t.test("PUT persists the title, description and status", async () => {
    const response = await request("PUT", "/api/tasks/" + createdId, { title: "Edytowane zadanie", description: "Nowy opis", status: "done" });
    assert.equal(response.status, 200);
    const stored = await admin.query('SELECT title, description, status FROM "' + schema + '".tasks WHERE id = $1', [createdId]);
    assert.deepEqual(stored.rows[0], { title: "Edytowane zadanie", description: "Nowy opis", status: "done" });
  });

  await t.test("client cannot write another user's task or supply user_id", async () => {
    const foreign = await admin.query('SELECT id FROM "' + schema + '".tasks WHERE user_id <> $1 LIMIT 1', [userId]);
    const id = foreign.rows[0].id;
    const payload = { title: "Unauthorized", status: "new" };
    assert.equal((await request("PUT", "/api/tasks/" + id, payload)).status, 404);
    assert.equal((await request("DELETE", "/api/tasks/" + id)).status, 404);
    assert.equal((await request("POST", "/api/tasks", { ...payload, user_id: 1 })).status, 400);
    const stored = await admin.query('SELECT count(*)::int AS count FROM "' + schema + '".tasks WHERE id = $1', [id]);
    assert.equal(stored.rows[0].count, 1);
  });

  await t.test("SQL-like title is saved as data and does not execute", async () => {
    const title = "'; DROP TABLE users; --";
    const response = await request("POST", "/api/tasks", { title, status: "new" });
    assert.equal(response.status, 201);
    assert.equal((await response.json()).title, title);
    const users = await admin.query('SELECT count(*)::int AS count FROM "' + schema + '".users');
    assert.equal(users.rows[0].count, 5);
  });

  await t.test("DELETE removes a row; repeat operations return 404", async () => {
    assert.equal((await request("DELETE", "/api/tasks/" + createdId)).status, 204);
    const stored = await admin.query('SELECT count(*)::int AS count FROM "' + schema + '".tasks WHERE id = $1', [createdId]);
    assert.equal(stored.rows[0].count, 0);
    assert.equal((await request("DELETE", "/api/tasks/" + createdId)).status, 404);
    assert.equal((await request("PUT", "/api/tasks/" + createdId, { title: "Missing", status: "new" })).status, 404);
  });

  await t.test("deleting a seeded task also removes its dependent comment", async () => {
    const task = await admin.query('SELECT id FROM "' + schema + '".tasks WHERE title = $1', ["Przygotować makietę"]);
    const id = task.rows[0].id;
    const before = await admin.query('SELECT count(*)::int AS count FROM "' + schema + '".comment WHERE task_id = $1', [id]);
    assert.equal(before.rows[0].count, 1);
    assert.equal((await request("DELETE", "/api/tasks/" + id)).status, 204);
    const after = await admin.query('SELECT count(*)::int AS count FROM "' + schema + '".comment WHERE task_id = $1', [id]);
    assert.equal(after.rows[0].count, 0);
  });
});
