/**
 * /api/dashboard — Dashboard summary endpoint.
 */

import { Router } from "express";
import { getDb } from "../db/database.js";

const router = Router();

// GET /api/dashboard/summary
router.get("/summary", (req, res) => {
  const db = getDb();

  const machines = db.prepare("SELECT * FROM machines ORDER BY name").all();
  const total = machines.length;

  const operational = machines.filter((m) => m.status === "operational").length;
  const warning     = machines.filter((m) => m.status === "warning").length;
  const critical    = machines.filter((m) => m.status === "critical").length;
  const offline     = machines.filter((m) => m.status === "offline").length;

  const avgProb = total > 0
    ? +(machines.reduce((s, m) => s + m.failure_probability, 0) / total).toFixed(1)
    : 0;

  const highRiskMachines = machines.filter((m) => m.risk_level === "high");

  const recentAlerts = db
    .prepare("SELECT * FROM alerts WHERE is_resolved = 0 ORDER BY created_at DESC LIMIT 10")
    .all();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const anomaliesToday = db
    .prepare("SELECT COUNT(*) AS cnt FROM sensor_readings WHERE is_anomaly = 1 AND recorded_at >= ?")
    .get(todayStart.toISOString())
    .cnt;

  res.json({
    total_machines: total,
    operational_count: operational,
    warning_count: warning,
    critical_count: critical,
    offline_count: offline,
    average_failure_probability: avgProb,
    high_risk_machines: highRiskMachines,
    recent_alerts: recentAlerts,
    total_anomalies_today: anomaliesToday,
  });
});

export default router;
