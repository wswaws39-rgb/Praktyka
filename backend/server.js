"use strict";

const http = require("node:http");
const { Pool } = require("pg");
const { createApp } = require("./app");

function readConfig(env) {
  const required = ["PGHOST", "PGDATABASE", "PGUSER", "PGPASSWORD", "APP_USER_LOGIN"];
  for (const key of required) {
    if (!env[key]?.trim() || env[key].startsWith("TU_WPISZ_")) {
      throw new Error("Uzupełnij " + key + " w pliku backend/.env.");
    }
  }

  function port(value, fallback, name) {
    const text = value || String(fallback);
    const number = Number(text);
    if (!/^\d+$/.test(text) || !Number.isInteger(number) || number < 1 || number > 65535) {
      throw new Error("Nieprawidłowy " + name + " w pliku backend/.env.");
    }
    return number;
  }

  return {
    port: port(env.PORT, 3000, "PORT"),
    login: env.APP_USER_LOGIN.trim(),
    database: {
      host: env.PGHOST.trim(),
      port: port(env.PGPORT, 5432, "PGPORT"),
      database: env.PGDATABASE.trim(),
      user: env.PGUSER.trim(),
      password: env.PGPASSWORD,
      connectionTimeoutMillis: 5000,
      statement_timeout: 8000,
      idleTimeoutMillis: 30000,
      max: 5
    }
  };
}

async function start(env = process.env) {
  const config = readConfig(env);
  const pool = new Pool(config.database);
  pool.on("error", (error) => console.error("Błąd połączenia PostgreSQL:", error.code || error.name));

  try {
    // Login aplikacji jest odrębny od PGUSER, czyli konta połączenia z bazą.
    const user = await pool.query("SELECT id FROM users WHERE login = $1", [config.login]);
    if (!user.rowCount) {
      throw new Error("Nie znaleziono APP_USER_LOGIN w tabeli users. Sprawdź .env i dane w bazie.");
    }
    const app = createApp({ pool, userId: user.rows[0].id });
    const server = http.createServer(app);
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(config.port, "127.0.0.1", resolve);
    });
    return { server, pool };
  } catch (error) {
    await pool.end();
    throw error;
  }
}

if (require.main === module) {
  start().then(({ server, pool }) => {
    console.log("Moje zadania: http://127.0.0.1:" + server.address().port);
    console.log("Zatrzymanie serwera: Ctrl+C.");

    let closing = false;
    function close() {
      if (closing) return;
      closing = true;
      server.close(async () => {
        await pool.end();
      });
    }
    process.on("SIGINT", close);
    process.on("SIGTERM", close);
  }).catch((error) => {
    const messages = {
      "28P01": "Błędny login lub hasło roli PostgreSQL. Sprawdź PGUSER i PGPASSWORD w .env.",
      "3D000": "Nie znaleziono bazy danych. Sprawdź PGDATABASE w .env.",
      "42P01": "Brak tabel aplikacji. Sprawdź bazę oraz database/01_schema.sql.",
      "42501": "Rola PostgreSQL nie ma wymaganych uprawnień. Sprawdź database/04_roles.sql i 05_app_permissions.sql.",
      ECONNREFUSED: "PostgreSQL nie odpowiada. Sprawdź usługę, PGHOST i PGPORT.",
      EADDRINUSE: "Port serwera jest zajęty. Zmień PORT w .env lub zatrzymaj poprzedni serwer."
    };
    console.error(messages[error.code] || (error.code ? "Nie udało się uruchomić serwera (" + error.code + "). Sprawdź backend/.env." : error.message));
    process.exitCode = 1;
  });
}

module.exports = { readConfig, start };
