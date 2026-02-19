/**
 * AI Predictive Maintenance Platform — Express Server
 */

import express from "express";
import cors from "cors";

import config from "./config.js";
import { initDb } from "./db/database.js";
import { seedMachines } from "./db/seed.js";
import { generateAllReadings } from "./services/sensorSimulator.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";

import dashboardRouter from "./routes/dashboard.js";
import machinesRouter  from "./routes/machines.js";
import sensorsRouter   from "./routes/sensors.js";
import alertsRouter    from "./routes/alerts.js";
import predictRouter   from "./routes/predict.js";

// ── Bootstrap ─────────────────────────────────────────────
const app = express();

// Middleware
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());

// Routes
app.get("/api/health", (_req, res) => {
  res.json({ status: "healthy", service: "predictive-maintenance-api" });
});

app.use("/api/dashboard", dashboardRouter);
app.use("/api/machines",  machinesRouter);
app.use("/api/sensors",   sensorsRouter);
app.use("/api/alerts",    alertsRouter);
app.use("/api/predict",   predictRouter);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────
function start() {
  // Initialize database & seed
  initDb();
  seedMachines();

  // Generate first batch of sensor data
  console.log("✓ Generating initial sensor readings …");
  generateAllReadings();
  console.log("✓ Initial data ready");

  app.listen(config.port, () => {
    console.log(`\n🚀  Server running → http://localhost:${config.port}`);
    console.log(`📖  Health check  → http://localhost:${config.port}/api/health`);
    console.log(`🔮  Predict API   → POST http://localhost:${config.port}/api/predict\n`);
  });
}

start();
