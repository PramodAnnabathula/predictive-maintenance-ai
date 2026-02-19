/**
 * /api/predict — On-demand risk prediction endpoint.
 *
 * POST body: { temperature, vibration, usageHours, powerConsumption?, noiseLevel? }
 * Returns:   { failureProbability, riskLevel, isAnomaly, anomalyDetails, recommendations }
 */

import { Router } from "express";
import { computeFailureProbability } from "../services/aiEngine.js";

const router = Router();

router.post("/", (req, res) => {
  const { temperature, vibration, usageHours, powerConsumption, noiseLevel } = req.body;

  // Validation
  if (temperature == null || vibration == null || usageHours == null) {
    return res.status(400).json({
      error: "Missing required fields: temperature, vibration, usageHours",
    });
  }

  if (typeof temperature !== "number" || typeof vibration !== "number" || typeof usageHours !== "number") {
    return res.status(400).json({
      error: "temperature, vibration, and usageHours must be numbers",
    });
  }

  const result = computeFailureProbability({
    temperature,
    vibration,
    usageHours,
    powerConsumption: powerConsumption ?? null,
    noiseLevel: noiseLevel ?? null,
  });

  res.json(result);
});

export default router;
