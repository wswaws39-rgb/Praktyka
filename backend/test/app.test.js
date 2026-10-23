"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { createApp } = require("../app");
const { readConfig } = require("../server");

async function serve(t, query = async () => ({ rows: [], rowCount: 0 })) {
  const errors = [];
  let queries = 0;
  const app = createApp({
    pool: { query: async (...args) => { queries++; return query(...args); } },
    userId: 2,
    onError: (error) => errors.push(error)
  });
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return {
    url: "http://127.0.0.1:" + server.address().port,
    errors,
    get queries() { return queries; }
  };
}

test("invalid task bodies never reach the database", async (t) => {
  const api = await serve(t);
  const invalidBodies = [
    {}, null, [],
    { title: "   ", status: "new" },
    { title: "x".repeat(201), status: "new" },
    { title: 123, status: "new" },
    { title: "Task", status: "unknown" },
    { title: "Task", status: "__proto__" },
    { title: "Task", status: "new", description: {} },
    { title: "Task", status: "new", user_id: 999 }
  ];
  for (const method of ["POST", "PUT"]) {
    for (const body of invalidBodies) {
      const response = await fetch(api.url + "/api/tasks" + (method === "PUT" ? "/1" : ""), {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
      });
      assert.equal(response.status, 400, method + " " + JSON.stringify(body));
      assert.equal(typeof (await response.json()).error, "string");
    }
  }
  assert.equal(api.queries, 0);
});

test("malformed JSON and oversized requests have clear HTTP statuses", async (t) => {
  const api = await serve(t);
  for (const [body, expectedStatus] of [["{broken", 400], [JSON.stringify({ title: "Task", status: "new", description: "x".repeat(70000) }), 413]]) {
    const response = await fetch(api.url + "/api/tasks", {
      method: "POST", headers: { "Content-Type": "application/json" }, body
    });
    assert.equal(response.status, expectedStatus);
    assert.equal(typeof (await response.json()).error, "string");
  }
  assert.equal(api.queries, 0);
});

test("invalid identifiers are rejected before querying PostgreSQL", async (t) => {
  const api = await serve(t);
  for (const id of ["0", "-1", "01", "abc", "1e3", "2147483648"]) {
    const response = await fetch(api.url + "/api/tasks/" + id, { method: "DELETE" });
    assert.equal(response.status, 400, id);
  }
  assert.equal(api.queries, 0);
});

test("unknown API addresses return JSON and requests are not cached", async (t) => {
  const api = await serve(t);
  const response = await fetch(api.url + "/api/missing");
  assert.equal(response.status, 404);
  assert.equal(typeof (await response.json()).error, "string");
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("local server rejects foreign origins and Host headers", async (t) => {
  const api = await serve(t);
  const foreignOrigin = await fetch(api.url + "/api/tasks", { headers: { Origin: "https://example.org" } });
  assert.equal(foreignOrigin.status, 403);
  const foreignHostStatus = await new Promise((resolve, reject) => {
    http.get(api.url + "/api/tasks", { headers: { Host: "example.org" } }, (response) => {
      response.resume();
      response.once("end", () => resolve(response.statusCode));
    }).once("error", reject);
  });
  assert.equal(foreignHostStatus, 403);
  assert.equal(api.queries, 0);
  const sameOrigin = await fetch(api.url + "/api/tasks", { headers: { Origin: api.url } });
  assert.equal(sameOrigin.status, 200);
});

test("database failure returns 500 without disclosing database details", async (t) => {
  const api = await serve(t, async () => { throw Object.assign(new Error("private database details"), { code: "ECONNREFUSED" }); });
  const response = await fetch(api.url + "/api/tasks");
  assert.equal(response.status, 500);
  const body = await response.text();
  assert.ok(!body.includes("private"));
  assert.ok(!body.includes("ECONNREFUSED"));
  assert.equal(api.errors.length, 1);
});

test("server serves the frontend while keeping backend and configuration private", async (t) => {
  const api = await serve(t);
  for (const resource of ["/", "/css/style.css", "/js/app.js"]) {
    const response = await fetch(api.url + resource);
    assert.equal(response.status, 200, resource);
  }
  const html = await (await fetch(api.url)).text();
  assert.ok(html.includes("Moje zadania"));
  for (const resource of ["/.env", "/.env.example", "/backend/server.js", "/database/01_schema.sql", "/package.json"]) {
    assert.equal((await fetch(api.url + resource)).status, 404, resource);
  }
});

test("startup validates configuration without returning or logging passwords", () => {
  const env = {
    PGHOST: "127.0.0.1", PGDATABASE: "task_manager", PGUSER: "task_app",
    PGPASSWORD: "example-for-test", APP_USER_LOGIN: "anna"
  };
  const config = readConfig(env);
  assert.equal(config.port, 3000);
  assert.equal(config.database.port, 5432);
  assert.equal(config.login, "anna");
  assert.throws(() => readConfig({ ...env, PGPASSWORD: "TU_WPISZ_HASLO" }), /PGPASSWORD/);
  assert.throws(() => readConfig({ ...env, PGDATABASE: "" }), /PGDATABASE/);
  for (const value of ["0", "-1", "text", "65536", "3.5"]) {
    assert.throws(() => readConfig({ ...env, PORT: value }), /PORT/);
  }
});
