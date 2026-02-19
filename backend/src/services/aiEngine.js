/**
 * AI Predictive Maintenance Engine
 *
 * Simulated risk-scoring and anomaly-detection logic.
 * Uses a weighted multi-factor model with non-linear thresholds.
 *
 * In production this would be replaced by a trained ML model
 * (e.g. Random Forest, LSTM, Isolation Forest).
 */

// ── Thresholds ────────────────────────────────────────────
const TEMP_NORMAL_MAX = 75;
const TEMP_WARNING    = 85;
const TEMP_CRITICAL   = 95;

const VIB_NORMAL_MAX  = 4.5;   // mm/s
const VIB_WARNING     = 7.0;
const VIB_CRITICAL    = 10.0;

const USAGE_WARNING   = 8000;  // hours
const USAGE_CRITICAL  = 12000;

// ── Helpers ───────────────────────────────────────────────
function clamp(val, min = 0, max = 100) {
  return Math.max(min, Math.min(val, max));
}

function gaussianNoise(mean = 0, std = 1) {
  // Box–Muller transform
  const u1 = Math.random();
  const u2 = Math.random();
  return mean + std * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// ── Main scoring function ─────────────────────────────────
export function computeFailureProbability({
  temperature,
  vibration,
  usageHours,
  powerConsumption = null,
  noiseLevel = null,
}) {
  const anomalyDetails  = [];
  const recommendations = [];

  // — Temperature score (weight 35 %) —
  let tempScore;
  if (temperature <= TEMP_NORMAL_MAX) {
    tempScore = ((temperature - 20) / (TEMP_NORMAL_MAX - 20)) * 30;
  } else if (temperature <= TEMP_WARNING) {
    tempScore = 30 + ((temperature - TEMP_NORMAL_MAX) / (TEMP_WARNING - TEMP_NORMAL_MAX)) * 35;
  } else if (temperature <= TEMP_CRITICAL) {
    tempScore = 65 + ((temperature - TEMP_WARNING) / (TEMP_CRITICAL - TEMP_WARNING)) * 25;
  } else {
    tempScore = 90 + Math.min(((temperature - TEMP_CRITICAL) / 10) * 10, 10);
  }
  tempScore = clamp(tempScore);

  // — Vibration score (weight 35 %) —
  let vibScore;
  if (vibration <= VIB_NORMAL_MAX) {
    vibScore = (vibration / VIB_NORMAL_MAX) * 25;
  } else if (vibration <= VIB_WARNING) {
    vibScore = 25 + ((vibration - VIB_NORMAL_MAX) / (VIB_WARNING - VIB_NORMAL_MAX)) * 40;
  } else if (vibration <= VIB_CRITICAL) {
    vibScore = 65 + ((vibration - VIB_WARNING) / (VIB_CRITICAL - VIB_WARNING)) * 25;
  } else {
    vibScore = 90 + Math.min(((vibration - VIB_CRITICAL) / 5) * 10, 10);
  }
  vibScore = clamp(vibScore);

  // — Usage hours score (weight 20 %) —
  let usageScore;
  if (usageHours <= USAGE_WARNING) {
    usageScore = (usageHours / USAGE_WARNING) * 40;
  } else if (usageHours <= USAGE_CRITICAL) {
    usageScore = 40 + ((usageHours - USAGE_WARNING) / (USAGE_CRITICAL - USAGE_WARNING)) * 40;
  } else {
    usageScore = 80 + Math.min(((usageHours - USAGE_CRITICAL) / 4000) * 20, 20);
  }
  usageScore = clamp(usageScore);

  // — Optional sensors bonus (weight 10 %) —
  let bonusScore = 0;
  if (powerConsumption !== null && powerConsumption > 50) {
    bonusScore += Math.min(((powerConsumption - 50) / 50) * 50, 50);
  }
  if (noiseLevel !== null && noiseLevel > 85) {
    bonusScore += Math.min(((noiseLevel - 85) / 30) * 50, 50);
  }
  bonusScore = clamp(bonusScore);

  // — Weighted combination —
  const raw =
    tempScore  * 0.35 +
    vibScore   * 0.35 +
    usageScore * 0.20 +
    bonusScore * 0.10;

  const noise = gaussianNoise(0, 1);
  const failureProbability = +clamp(raw + noise).toFixed(1);

  // — Anomaly detection —
  let isAnomaly = false;

  if (temperature > TEMP_WARNING) {
    isAnomaly = true;
    anomalyDetails.push(`Temperature critically high: ${temperature.toFixed(1)}°C (threshold: ${TEMP_WARNING}°C)`);
    recommendations.push("Immediate inspection required. Check cooling system and lubrication.");
  } else if (temperature > TEMP_NORMAL_MAX) {
    anomalyDetails.push(`Temperature elevated: ${temperature.toFixed(1)}°C (normal max: ${TEMP_NORMAL_MAX}°C)`);
    recommendations.push("Schedule cooling system inspection within 48 hours.");
  }

  if (vibration > VIB_WARNING) {
    isAnomaly = true;
    anomalyDetails.push(`Vibration critically high: ${vibration.toFixed(2)} mm/s (threshold: ${VIB_WARNING} mm/s)`);
    recommendations.push("Check bearing alignment and balance. Immediate maintenance recommended.");
  } else if (vibration > VIB_NORMAL_MAX) {
    anomalyDetails.push(`Vibration elevated: ${vibration.toFixed(2)} mm/s (normal max: ${VIB_NORMAL_MAX} mm/s)`);
    recommendations.push("Monitor vibration trends. Schedule bearing inspection.");
  }

  if (usageHours > USAGE_CRITICAL) {
    isAnomaly = true;
    anomalyDetails.push(`Usage hours excessive: ${usageHours.toFixed(0)}h (critical: ${USAGE_CRITICAL}h)`);
    recommendations.push("Machine overdue for major overhaul. Plan replacement parts procurement.");
  } else if (usageHours > USAGE_WARNING) {
    anomalyDetails.push(`Usage hours high: ${usageHours.toFixed(0)}h (warning: ${USAGE_WARNING}h)`);
    recommendations.push("Schedule preventive maintenance. Review wear components.");
  }

  if (failureProbability >= 60 && anomalyDetails.length === 0) {
    recommendations.push("Elevated risk from combined sensor patterns. Schedule general inspection.");
  }

  if (recommendations.length === 0) {
    recommendations.push("All readings within normal parameters. Continue routine monitoring.");
  }

  // — Risk level —
  let riskLevel;
  if (failureProbability >= 70) riskLevel = "high";
  else if (failureProbability >= 40) riskLevel = "medium";
  else riskLevel = "low";

  return {
    failureProbability,
    riskLevel,
    isAnomaly,
    anomalyDetails,
    recommendations,
  };
}

/**
 * Classify a raw probability into a risk level string.
 */
export function classifyRisk(probability) {
  if (probability >= 70) return "high";
  if (probability >= 40) return "medium";
  return "low";
}
