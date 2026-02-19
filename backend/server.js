const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = process.env.PORT || 3001;

/* ---------------------------------------------------------
   SECURITY: Helmet — sets secure HTTP headers
   (X-Content-Type-Options, X-Frame-Options, Referrer-Policy,
    Strict-Transport-Security, CSP, and more)
   Also removes X-Powered-By automatically.
---------------------------------------------------------- */
app.use(helmet());

/* ---------------------------------------------------------
   SECURITY: Disable X-Powered-By explicitly as a fallback
   (helmet already does this, belt-and-suspenders)
---------------------------------------------------------- */
app.disable("x-powered-by");

/* ---------------------------------------------------------
   SECURITY: CORS — restrict to allowed origin(s) only
   Reads CORS_ORIGIN from env; defaults to localhost:5173
   in development. Set to your real domain in production.
---------------------------------------------------------- */
const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";
app.use(
  cors({
    origin: ALLOWED_ORIGIN,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

/* ---------------------------------------------------------
   SECURITY: Rate limiting — prevent abuse / DoS
   100 requests per IP per 15-minute window.
---------------------------------------------------------- */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // limit each IP
  standardHeaders: true,     // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,      // Disable X-RateLimit-* headers
  message: { error: "Too many requests — please try again later." },
});
app.use(limiter);

/* ---------------------------------------------------------
   SECURITY: Explicit JSON body size limit (10 KB)
   Prevents oversized payloads from consuming memory.
---------------------------------------------------------- */
app.use(express.json({ limit: "10kb" }));

/* ---------------------------------------------------------
   ROOT ROUTE (Fixes "Cannot GET /")
---------------------------------------------------------- */
app.get("/", (_req, res) => {
  res.send("Predictive Maintenance API is running.");
});

/* ---------------------------------------------------------
   Simulated Risk Scoring Logic
---------------------------------------------------------- */

// Allowed ranges for each sensor input (server-side enforcement)
const INPUT_BOUNDS = {
  temperature:   { min: -50,  max: 500   },
  vibration:     { min: 0,    max: 100   },
  runtime_hours: { min: 0,    max: 100000 },
  pressure:      { min: 0,    max: 500   },
};

function computeRiskScore({
  temperature = 60,
  vibration = 2,
  runtime_hours = 500,
  pressure = 30
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
   HEALTH CHECK (sanitised — no internal details leaked)
---------------------------------------------------------- */
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

/* ---------------------------------------------------------
   GET /predict (demo endpoint for browser testing)
---------------------------------------------------------- */
app.get("/predict", (_req, res) => {
  const { score, risk_level } = computeRiskScore({});
  res.json({
    score,
    risk_level,
    timestamp: new Date().toISOString(),
    demo: true
  });
});

/* ---------------------------------------------------------
   POST /predict (for frontend integration)
   SECURITY: validates type, finiteness, AND range bounds
---------------------------------------------------------- */
app.post("/predict", (req, res) => {
  try {
    const { temperature, vibration, runtime_hours, pressure } = req.body;

    const inputs = {
      temperature: temperature !== undefined ? Number(temperature) : undefined,
      vibration: vibration !== undefined ? Number(vibration) : undefined,
      runtime_hours: runtime_hours !== undefined ? Number(runtime_hours) : undefined,
      pressure: pressure !== undefined ? Number(pressure) : undefined,
    };

    // Validate type — must be a finite number
    for (const [key, val] of Object.entries(inputs)) {
      if (val !== undefined && !Number.isFinite(val)) {
        return res.status(400).json({
          error: `Invalid value for "${key}": must be a number.`
        });
      }
    }

    // Validate range — must be within allowed bounds
    for (const [key, val] of Object.entries(inputs)) {
      if (val !== undefined && key in INPUT_BOUNDS) {
        const { min, max } = INPUT_BOUNDS[key];
        if (val < min || val > max) {
          return res.status(400).json({
            error: `"${key}" must be between ${min} and ${max}. Received: ${val}`
          });
        }
      }
    }

    const { score, risk_level } = computeRiskScore(inputs);

    res.json({
      score,
      risk_level,
      timestamp: new Date().toISOString(),
      inputs
    });

  } catch (err) {
    console.error("Prediction error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ---------------------------------------------------------
   404 — Catch-all for undefined routes
---------------------------------------------------------- */
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

/* ---------------------------------------------------------
   Global error-handling middleware
   (must have 4 parameters so Express treats it as an
    error handler, not a regular middleware)
---------------------------------------------------------- */
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  // Malformed JSON bodies from express.json()
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Malformed JSON in request body" });
  }

  // Payload too large (exceeds 10kb limit)
  if (err.type === "entity.too.large") {
    return res.status(413).json({ error: "Request body too large" });
  }

  console.error("Unhandled error:", err.stack || err);

  // Never leak internal details in production
  res.status(err.status || 500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message || "Internal server error",
  });
});

/* ---------------------------------------------------------
   Process-level safety nets
   Prevent unhandled exceptions / rejections from crashing
   the server.  In production you'd want a process manager
   (pm2, systemd, etc.) to restart on truly fatal errors.
---------------------------------------------------------- */
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception — keeping server alive:", err.stack || err);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection — keeping server alive:", reason);
});

/* ---------------------------------------------------------
   START SERVER
---------------------------------------------------------- */
app.listen(PORT, () => {
  console.log(`Predictive Maintenance API running on http://localhost:${PORT}`);
});
