/**
 * SQLite database connection and schema initialization using better-sqlite3.
 */

import Database from "better-sqlite3";
import config from "../config.js";

let db;

export function getDb() {
  if (!db) {
    db = new Database(config.dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
  }
  return db;
}

export function initDb() {
  const conn = getDb();

  conn.exec(`
    CREATE TABLE IF NOT EXISTS machines (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      type        TEXT    NOT NULL,
      location    TEXT    NOT NULL,
      status      TEXT    NOT NULL DEFAULT 'operational',
      install_date     TEXT,
      last_maintenance TEXT,
      failure_probability REAL DEFAULT 0,
      risk_level  TEXT DEFAULT 'low',
      created_at  TEXT DEFAULT (datetime('now')),
      updated_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sensor_readings (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      machine_id    INTEGER NOT NULL REFERENCES machines(id),
      temperature   REAL NOT NULL,
      vibration     REAL NOT NULL,
      usage_hours   REAL NOT NULL,
      power_consumption REAL,
      noise_level   REAL,
      failure_probability REAL NOT NULL DEFAULT 0,
      risk_level    TEXT NOT NULL DEFAULT 'low',
      is_anomaly    INTEGER NOT NULL DEFAULT 0,
      recorded_at   TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      machine_id    INTEGER NOT NULL REFERENCES machines(id),
      severity      TEXT NOT NULL,
      title         TEXT NOT NULL,
      message       TEXT NOT NULL,
      recommendation TEXT,
      failure_probability REAL,
      is_resolved   INTEGER NOT NULL DEFAULT 0,
      created_at    TEXT DEFAULT (datetime('now')),
      resolved_at   TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_readings_machine   ON sensor_readings(machine_id);
    CREATE INDEX IF NOT EXISTS idx_readings_recorded   ON sensor_readings(recorded_at);
    CREATE INDEX IF NOT EXISTS idx_alerts_machine      ON alerts(machine_id);
    CREATE INDEX IF NOT EXISTS idx_alerts_created      ON alerts(created_at);
  `);

  console.log("✓ Database initialized");
}

export function closeDb() {
  if (db) {
    db.close();
    db = undefined;
  }
}
