/**
 * /api/sensors — Sensor readings and simulation endpoints.
 */

import { Router } from "express";
import { getDb } from "../db/database.js";
import { generateAllReadings, generateReadingForMachine } from "../services/sensorSimulator.js";

const router = Router();

// GET /api/sensors/readings — list readings (optional ?machine_id=&limit=)
router.get("/readings", (req, res) => {
  const { machine_id, limit = 50 } = req.query;
  const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 500));

  let sql = "SELECT * FROM sensor_readings";
  const params = [];

  if (machine_id) {
    sql += " WHERE machine_id = ?";
    params.push(machine_id);
  }

  sql += " ORDER BY recorded_at DESC LIMIT ?";
  params.push(safeLimit);

  const rows = getDb().prepare(sql).all(...params);
  res.json(rows);
});

// GET /api/sensors/readings/:machineId/latest
router.get("/readings/:machineId/latest", (req, res) => {
  const row = getDb()
    .prepare("SELECT * FROM sensor_readings WHERE machine_id = ? ORDER BY recorded_at DESC LIMIT 1")
    .get(req.params.machineId);
  if (!row) return res.status(404).json({ error: "No readings found for this machine" });
  res.json(row);
});

// GET /api/sensors/anomalies
router.get("/anomalies", (req, res) => {
  const limit = Math.max(1, Math.min(Number(req.query.limit) || 50, 200));
  const rows = getDb()
    .prepare("SELECT * FROM sensor_readings WHERE is_anomaly = 1 ORDER BY recorded_at DESC LIMIT ?")
    .all(limit);
  res.json(rows);
});

// POST /api/sensors/simulate — generate new readings for ALL machines
router.post("/simulate", (req, res) => {
  const readings = generateAllReadings();
  res.json(readings);
});

// POST /api/sensors/simulate/:machineId — generate reading for ONE machine
router.post("/simulate/:machineId", (req, res) => {
  const machine = getDb()
    .prepare("SELECT * FROM machines WHERE id = ?")
    .get(req.params.machineId);
  if (!machine) return res.status(404).json({ error: "Machine not found" });
  const reading = generateReadingForMachine(machine);
  res.json(reading);
});

export default router;
