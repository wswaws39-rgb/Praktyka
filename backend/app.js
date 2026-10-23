"use strict";

const path = require("node:path");
const express = require("express");

const STATUSES = new Set(["new", "in_progress", "done"]);
const TASK_FIELDS = new Set(["title", "description", "status"]);
const RETURNED_FIELDS = "id, title, description, status, created_at";

function taskData(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  if (Object.keys(body).some((key) => !TASK_FIELDS.has(key))) return null;
  if (typeof body.title !== "string" || !body.title.trim() || body.title.trim().length > 200) return null;
  if (!STATUSES.has(body.status)) return null;
  if (body.description != null && typeof body.description !== "string") return null;

  return {
    title: body.title.trim(),
    description: (body.description ?? "").trim(),
    status: body.status
  };
}

function createApp({ pool, userId, onError = (error) => console.error("Błąd API:", error.code || error.name) }) {
  if (!Number.isInteger(userId) || userId < 1) throw new Error("Brak prawidłowego użytkownika aplikacji.");

  const app = express();
  app.disable("x-powered-by");

  // Ten etap to aplikacja lokalna dla jednego użytkownika, bez logowania.
  // Serwer przyjmuje tylko lokalny Host; zapytania z innych stron są odrzucane.
  app.use((req, res, next) => {
    if (!["localhost", "127.0.0.1", "[::1]"].includes(req.hostname)) {
      return res.status(403).json({ error: "Niedozwolony adres serwera." });
    }
    const origin = req.get("Origin");
    if (origin) {
      const localOrigins = [
        "http://127.0.0.1:" + req.socket.localPort,
        "http://localhost:" + req.socket.localPort
      ];
      if (!localOrigins.includes(origin)) {
        return res.status(403).json({ error: "Niedozwolone pochodzenie zapytania." });
      }
    }
    res.set("X-Content-Type-Options", "nosniff");
    res.set("Content-Security-Policy", "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
    next();
  });

  app.use("/api", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });
  app.use(express.json({ limit: "64kb" }));

  app.param("id", (req, res, next, value) => {
    const id = Number(value);
    if (!/^[1-9]\d*$/.test(value) || !Number.isInteger(id) || id > 2147483647) {
      return res.status(400).json({ error: "Nieprawidłowy identyfikator zadania." });
    }
    req.taskId = id;
    next();
  });

  function validateTask(req, res, next) {
    req.taskData = taskData(req.body);
    if (!req.taskData) {
      return res.status(400).json({ error: "Podaj tytuł (1–200 znaków), opis tekstowy i prawidłowy status." });
    }
    next();
  }

  app.get("/api/tasks", async (req, res) => {
    // Parametry $1, $2 itd. oddzielają dane od kodu SQL.
    const result = await pool.query(
      "SELECT " + RETURNED_FIELDS + " FROM tasks WHERE user_id = $1 ORDER BY id DESC",
      [userId]
    );
    res.json(result.rows);
  });

  app.post("/api/tasks", validateTask, async (req, res) => {
    const { title, description, status } = req.taskData;
    const result = await pool.query(
      "INSERT INTO tasks (title, description, status, user_id) VALUES ($1, $2, $3, $4) RETURNING " + RETURNED_FIELDS,
      [title, description, status, userId]
    );
    res.status(201).json(result.rows[0]);
  });

  app.put("/api/tasks/:id", validateTask, async (req, res) => {
    const { title, description, status } = req.taskData;
    const result = await pool.query(
      "UPDATE tasks SET title = $1, description = $2, status = $3 WHERE id = $4 AND user_id = $5 RETURNING " + RETURNED_FIELDS,
      [title, description, status, req.taskId, userId]
    );
    if (!result.rowCount) return res.status(404).json({ error: "Nie znaleziono zadania." });
    res.json(result.rows[0]);
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    const result = await pool.query(
      "DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.taskId, userId]
    );
    if (!result.rowCount) return res.status(404).json({ error: "Nie znaleziono zadania." });
    res.status(204).end();
  });

  app.use("/api", (req, res) => {
    res.status(404).json({ error: "Nie znaleziono adresu API." });
  });

  // Udostępniamy wyłącznie frontend, bez plików .env, SQL i kodu serwera.
  app.use(express.static(path.join(__dirname, "../frontend"), { dotfiles: "deny" }));
  app.use((req, res) => res.status(404).type("text").send("Nie znaleziono strony."));

  // Express 5 przekazuje tutaj również błędy z funkcji async.
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error.type === "entity.parse.failed") {
      return res.status(400).json({ error: "Nieprawidłowy JSON." });
    }
    if (error.type === "entity.too.large") {
      return res.status(413).json({ error: "Przesłane dane są za duże (limit 64 KiB)." });
    }
    onError(error);
    res.status(500).json({ error: "Błąd serwera. Spróbuj ponownie później." });
  });

  return app;
}

module.exports = { createApp };
