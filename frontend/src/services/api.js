/**
 * API service — communicates with the Express backend.
 */

import axios from "axios";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({ baseURL: API, timeout: 15000 });

// ── Dashboard ───────────────────────────────────────────
export const fetchDashboardSummary = () =>
  api.get("/api/dashboard/summary").then((r) => r.data);

// ── Machines ────────────────────────────────────────────
export const fetchMachines = () =>
  api.get("/api/machines").then((r) => r.data);

export const fetchMachine = (id) =>
  api.get(`/api/machines/${id}`).then((r) => r.data);

// ── Sensors ─────────────────────────────────────────────
export const fetchReadings = (machineId, limit = 50) => {
  const params = { limit };
  if (machineId) params.machine_id = machineId;
  return api.get("/api/sensors/readings", { params }).then((r) => r.data);
};

export const fetchLatestReading = (machineId) =>
  api.get(`/api/sensors/readings/${machineId}/latest`).then((r) => r.data);

export const fetchAnomalies = (limit = 50) =>
  api.get("/api/sensors/anomalies", { params: { limit } }).then((r) => r.data);

export const simulateAll = () =>
  api.post("/api/sensors/simulate").then((r) => r.data);

export const simulateOne = (machineId) =>
  api.post(`/api/sensors/simulate/${machineId}`).then((r) => r.data);

// ── Alerts ──────────────────────────────────────────────
export const fetchAlerts = (params = {}) =>
  api.get("/api/alerts", { params }).then((r) => r.data);

export const fetchUnresolvedAlerts = () =>
  api.get("/api/alerts/unresolved").then((r) => r.data);

export const resolveAlert = (id) =>
  api.patch(`/api/alerts/${id}/resolve`).then((r) => r.data);

// ── Predict ─────────────────────────────────────────────
export const predict = (data) =>
  api.post("/api/predict", data).then((r) => r.data);

export default api;
