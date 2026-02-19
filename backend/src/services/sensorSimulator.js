/**
 * Sensor Data Simulator
 *
 * Generates realistic simulated sensor readings for each machine.
 * Different machine types have distinct baseline profiles.
 * Occasionally injects anomalies to exercise the detection system.
 */

import { getDb } from "../db/database.js";
import { computeFailureProbability } from "./aiEngine.js";

// ── Machine-type baseline profiles ────────────────────────
const PROFILES = {
  "CNC Mill":        { tempBase: 45, tempStd: 8,  vibBase: 2.5, vibStd: 1.0, usageBase: 5000, usageInc: [1, 5], powerBase: 25, powerStd: 5, noiseBase: 72, noiseStd: 4 },
  "Conveyor Belt":   { tempBase: 35, tempStd: 5,  vibBase: 1.8, vibStd: 0.8, usageBase: 7000, usageInc: [2, 8], powerBase: 15, powerStd: 3, noiseBase: 65, noiseStd: 3 },
  "Hydraulic Press": { tempBase: 55, tempStd: 10, vibBase: 3.0, vibStd: 1.2, usageBase: 4000, usageInc: [1, 4], powerBase: 40, powerStd: 8, noiseBase: 80, noiseStd: 5 },
  "Industrial Robot":{ tempBase: 40, tempStd: 6,  vibBase: 1.5, vibStd: 0.6, usageBase: 6000, usageInc: [2, 6], powerBase: 20, powerStd: 4, noiseBase: 55, noiseStd: 3 },
  "Compressor":      { tempBase: 60, tempStd: 12, vibBase: 3.5, vibStd: 1.5, usageBase: 9000, usageInc: [3, 10], powerBase: 35, powerStd: 7, noiseBase: 85, noiseStd: 5 },
};

const DEFAULT_PROFILE = { tempBase: 45, tempStd: 8, vibBase: 2.0, vibStd: 1.0, usageBase: 5000, usageInc: [1, 5], powerBase: 20, powerStd: 5, noiseBase: 70, noiseStd: 4 };

const ANOMALY_CHANCE = 0.12;

// ── Helpers ───────────────────────────────────────────────
function randNormal(mean, std) {
  const u1 = Math.random();
  const u2 = Math.random();
  return mean + std * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function round(v, d = 2) {
  const f = 10 ** d;
  return Math.round(v * f) / f;
}

// ── Generate a single reading ────────────────────────────
export function generateReadingForMachine(machine) {
  const db = getDb();
  const profile = PROFILES[machine.type] || DEFAULT_PROFILE;

  // Last reading for cumulative usage
  const lastReading = db
    .prepare("SELECT usage_hours FROM sensor_readings WHERE machine_id = ? ORDER BY recorded_at DESC LIMIT 1")
    .get(machine.id);

  const lastUsage = lastReading ? lastReading.usage_hours : profile.usageBase;

  // Base values
  let temperature      = Math.max(15, randNormal(profile.tempBase, profile.tempStd));
  let vibration        = Math.max(0.1, randNormal(profile.vibBase, profile.vibStd));
  const usageHours     = lastUsage + randInt(...profile.usageInc);
  const powerConsumption = Math.max(1, randNormal(profile.powerBase, profile.powerStd));
  const noiseLevel     = Math.max(30, randNormal(profile.noiseBase, profile.noiseStd));

  // Inject anomaly occasionally
  if (Math.random() < ANOMALY_CHANCE) {
    const kind = ["temperature", "vibration", "both"][randInt(0, 2)];
    if (kind === "temperature" || kind === "both") temperature = randFloat(80, 110);
    if (kind === "vibration"   || kind === "both") vibration   = randFloat(6, 15);
  }

  temperature      = round(temperature);
  vibration        = round(vibration);
  const power      = round(powerConsumption);
  const noise      = round(noiseLevel);
  const usage      = round(usageHours, 1);

  // Run AI scoring
  const prediction = computeFailureProbability({
    temperature,
    vibration,
    usageHours: usage,
    powerConsumption: power,
    noiseLevel: noise,
  });

  // Insert reading
  const insertReading = db.prepare(`
    INSERT INTO sensor_readings
      (machine_id, temperature, vibration, usage_hours, power_consumption, noise_level,
       failure_probability, risk_level, is_anomaly, recorded_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  const info = insertReading.run(
    machine.id,
    temperature,
    vibration,
    usage,
    power,
    noise,
    prediction.failureProbability,
    prediction.riskLevel,
    prediction.isAnomaly ? 1 : 0,
  );

  // Update machine status
  let machineStatus;
  if (prediction.riskLevel === "high") machineStatus = "critical";
  else if (prediction.riskLevel === "medium") machineStatus = "warning";
  else machineStatus = "operational";

  db.prepare(`
    UPDATE machines
    SET failure_probability = ?, risk_level = ?, status = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(prediction.failureProbability, prediction.riskLevel, machineStatus, machine.id);

  // Create alert if anomaly
  if (prediction.isAnomaly) {
    const severity = prediction.failureProbability >= 70 ? "critical" : "high";
    db.prepare(`
      INSERT INTO alerts (machine_id, severity, title, message, recommendation, failure_probability, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      machine.id,
      severity,
      `Anomaly detected on ${machine.name}`,
      prediction.anomalyDetails.join("; "),
      prediction.recommendations.join("; "),
      prediction.failureProbability,
    );
  }

  // Return the newly inserted reading
  return db.prepare("SELECT * FROM sensor_readings WHERE id = ?").get(info.lastInsertRowid);
}

// ── Generate readings for ALL machines ───────────────────
export function generateAllReadings() {
  const db = getDb();
  const machines = db.prepare("SELECT * FROM machines ORDER BY id").all();
  return machines.map((m) => generateReadingForMachine(m));
}
