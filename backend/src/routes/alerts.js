/**
 * /api/alerts — Alert management endpoints.
 */

import { Router } from "express";
import { getDb } from "../db/database.js";

const router = Router();

// GET /api/alerts — list alerts (optional ?severity=&resolved=&limit=)
router.get("/", (req, res) => {
  const { severity, resolved, limit = 50 } = req.query;
  const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 200));

  let sql = "SELECT * FROM alerts WHERE 1=1";
  const params = [];

  if (severity) {
    sql += " AND severity = ?";
    params.push(severity);
  }
  if (resolved !== undefined) {
    sql += " AND is_resolved = ?";
    params.push(resolved === "true" ? 1 : 0);
  }

  sql += " ORDER BY created_at DESC LIMIT ?";
  params.push(safeLimit);

  res.json(getDb().prepare(sql).all(...params));
});

// GET /api/alerts/unresolved
router.get("/unresolved", (req, res) => {
  const limit = Math.max(1, Math.min(Number(req.query.limit) || 50, 200));
  const rows = getDb()
    .prepare("SELECT * FROM alerts WHERE is_resolved = 0 ORDER BY created_at DESC LIMIT ?")
    .all(limit);
  res.json(rows);
});

// PATCH /api/alerts/:id/resolve
router.patch("/:id/resolve", (req, res) => {
  const db = getDb();
  const alert = db.prepare("SELECT * FROM alerts WHERE id = ?").get(req.params.id);
  if (!alert) return res.status(404).json({ error: "Alert not found" });

  db.prepare("UPDATE alerts SET is_resolved = 1, resolved_at = datetime('now') WHERE id = ?")
    .run(req.params.id);

  const updated = db.prepare("SELECT * FROM alerts WHERE id = ?").get(req.params.id);
  res.json(updated);
});

export default router;
