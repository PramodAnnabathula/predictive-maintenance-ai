const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

/* ---------------------------------------------------------
   SECURITY: Helmet
---------------------------------------------------------- */
app.use(helmet());
app.disable("x-powered-by");

/* ---------------------------------------------------------
   SECURITY: CORS
---------------------------------------------------------- */
const ALLOWED_ORIGIN =
  process.env.CORS_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: ALLOWED_ORIGIN,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

/* ---------------------------------------------------------
   SECURITY: Rate limiting
---------------------------------------------------------- */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests — please try again later." },
});
app.use(limiter);

/* ---------------------------------------------------------
   SECURITY: JSON body limit
---------------------------------------------------------- */
app.use(express.json({ limit: "10kb" }));

/* ---------------------------------------------------------
   Simulated Risk Scoring Logic
---------------------------------------------------------- */

const INPUT_BOUNDS = {
  temperature: { min: -50, max: 500 },
  vibration: { min: 0, max: 100 },
  runtime_hours: { min: 0, max: 100000 },
  pressure: { min: 0, max: 500 },
};

function computeRiskScore({
  temperature = 60,
  vibration = 2,
  runtime_hours = 500,
  pressure = 30,
}) {
  const IDEAL_TEMP = 55;
  const IDEAL_VIBRATION = 1.5;
  const MAX_RUNTIME = 10000;
  const IDEAL_PRESSURE = 30;

  const tempFactor = Math.max(0, (temperature - IDEAL_TEMP) / 40);
  const vibFactor = Math.max(0, (vibration - IDEAL_VIBRATION) / 8);
  const runtimeFactor = Math.min(1, runtime_hours / MAX_RUNTIME);
  const pressureFactor = Math.abs(pressure - IDEAL_PRESSURE) / 50;

  const raw =
    tempFactor * 30 +
    vibFactor * 30 +
    runtimeFactor * 25 +
    pressureFactor * 15;

  const score = Math.round(Math.min(100, Math.max(0, raw)));

  let risk_level;
  if (score <= 30) risk_level = "Low";
  else if (score <= 60) risk_level = "Medium";
  else if (score <= 80) risk_level = "High";
  else risk_level = "Critical";

  return { score, risk_level };
}

/* ---------------------------------------------------------
   API ROUTES
---------------------------------------------------------- */

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/predict", (_req, res) => {
  const { score, risk_level } = computeRiskScore({});
  res.json({
    score,
    risk_level,
    timestamp: new Date().toISOString(),
    demo: true,
  });
});

app.post("/predict", (req, res) => {
  try {
    const { temperature, vibration, runtime_hours, pressure } = req.body;

    const inputs = {
      temperature:
        temperature !== undefined ? Number(temperature) : undefined,
      vibration:
        vibration !== undefined ? Number(vibration) : undefined,
      runtime_hours:
        runtime_hours !== undefined ? Number(runtime_hours) : undefined,
      pressure: pressure !== undefined ? Number(pressure) : undefined,
    };

    for (const [key, val] of Object.entries(inputs)) {
      if (val !== undefined && !Number.isFinite(val)) {
        return res.status(400).json({
          error: `Invalid value for "${key}": must be a number.`,
        });
      }
    }

    for (const [key, val] of Object.entries(inputs)) {
      if (val !== undefined && key in INPUT_BOUNDS) {
        const { min, max } = INPUT_BOUNDS[key];
        if (val < min || val > max) {
          return res.status(400).json({
            error: `"${key}" must be between ${min} and ${max}. Received: ${val}`,
          });
        }
      }
    }

    const { score, risk_level } = computeRiskScore(inputs);

    res.json({
      score,
      risk_level,
      timestamp: new Date().toISOString(),
      inputs,
    });
  } catch (err) {
    console.error("Prediction error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ---------------------------------------------------------
   SERVE FRONTEND (VITE BUILD)
---------------------------------------------------------- */

const frontendPath = path.join(__dirname, "dist");

app.use(express.static(frontendPath));

app.get("*", (req, res, next) => {
  // If request starts with /predict or /health, skip
  if (req.path.startsWith("/predict") || req.path.startsWith("/health")) {
    return next();
  }

  res.sendFile(path.join(frontendPath, "index.html"));
});

/* ---------------------------------------------------------
   GLOBAL ERROR HANDLER
---------------------------------------------------------- */
app.use((err, _req, res, _next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Malformed JSON in request body" });
  }

  if (err.type === "entity.too.large") {
    return res.status(413).json({ error: "Request body too large" });
  }

  console.error("Unhandled error:", err.stack || err);

  res.status(err.status || 500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message || "Internal server error",
  });
});

/* ---------------------------------------------------------
   PROCESS SAFETY NETS
---------------------------------------------------------- */
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err.stack || err);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

/* ---------------------------------------------------------
   START SERVER
---------------------------------------------------------- */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
