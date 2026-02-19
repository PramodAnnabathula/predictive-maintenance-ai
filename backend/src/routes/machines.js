/**
 * /api/machines — Machine fleet endpoints.
 */

import { Router } from "express";
import { getDb } from "../db/database.js";

const router = Router();

// GET /api/machines — list all machines
router.get("/", (req, res) => {
  const machines = getDb()
    .prepare("SELECT * FROM machines ORDER BY name")
    .all();
  res.json(machines);
});

// GET /api/machines/:id — single machine
router.get("/:id", (req, res) => {
  const machine = getDb()
    .prepare("SELECT * FROM machines WHERE id = ?")
    .get(req.params.id);
  if (!machine) return res.status(404).json({ error: "Machine not found" });
  res.json(machine);
});

export default router;
