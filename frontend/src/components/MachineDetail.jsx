import { useState, useEffect } from "react";
import { FiX, FiThermometer, FiActivity, FiClock, FiZap, FiVolume2 } from "react-icons/fi";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { fetchReadings, simulateOne } from "../services/api";
import { n, fmtDate, riskColor, riskBg } from "../utils/helpers";
import RiskGauge from "./RiskGauge";

export default function MachineDetail({ machine, onClose, onDataChange }) {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => { load(); }, [machine.id]);

  async function load() {
    setLoading(true);
    try {
      const d = await fetchReadings(machine.id, 30);
      setReadings(d.reverse());
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function handleSim() {
    setBusy(true);
    try { await simulateOne(machine.id); await load(); onDataChange?.(); }
    catch { /* ignore */ }
    setBusy(false);
  }

  const latest = readings.at(-1);
  const chart = readings.map((r, i) => ({
    i: i + 1,
    temperature: r.temperature,
    vibration: r.vibration,
    failProb: r.failure_probability,
  }));

  return (
    <div className="overlay" onClick={onClose}>
      <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="detail-hdr">
          <div>
            <h2 className="detail-title">{machine.name}</h2>
            <p className="detail-sub">{machine.type} &middot; {machine.location}</p>
          </div>
          <div className="detail-actions">
            <button className={`btn btn-sm btn-primary${busy ? " btn-busy" : ""}`} onClick={handleSim} disabled={busy}>
              {busy ? "Simulating…" : "New Reading"}
            </button>
            <button className="btn btn-sm btn-ghost" onClick={onClose}><FiX size={18} /></button>
          </div>
        </div>

        {/* Body */}
        <div className="detail-body">
          <div className="detail-top">
            <RiskGauge probability={machine.failure_probability} riskLevel={machine.risk_level} />
            {latest && (
              <div className="sensor-grid">
                <SensorCard icon={<FiThermometer />} color="#ef4444" value={`${n(latest.temperature)}°C`} label="Temperature" />
                <SensorCard icon={<FiActivity />}     color="#8b5cf6" value={`${n(latest.vibration, 2)} mm/s`} label="Vibration" />
                <SensorCard icon={<FiClock />}         color="#3b82f6" value={`${n(latest.usage_hours, 0)}h`} label="Usage Hours" />
                <SensorCard icon={<FiZap />}           color="#f59e0b" value={`${n(latest.power_consumption)} kW`} label="Power" />
                <SensorCard icon={<FiVolume2 />}       color="#06b6d4" value={`${n(latest.noise_level)} dB`} label="Noise" />
                <div className="sensor-card">
                  <span className="risk-badge" style={{ color: riskColor(machine.risk_level), backgroundColor: riskBg(machine.risk_level), fontSize: ".75rem" }}>
                    {machine.risk_level?.toUpperCase()} RISK
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Chart */}
          <h3 className="chart-heading">Sensor Trends</h3>
          {loading ? <div className="loading-inline">Loading chart…</div> : chart.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
                <XAxis dataKey="i" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, color: "#e2e8f0" }} />
                <Legend />
                <Line type="monotone" dataKey="temperature" stroke="#ef4444" strokeWidth={2} dot={false} name="Temp (°C)" />
                <Line type="monotone" dataKey="vibration"   stroke="#8b5cf6" strokeWidth={2} dot={false} name="Vibration (mm/s)" />
                <Line type="monotone" dataKey="failProb"    stroke="#f59e0b" strokeWidth={2} dot={false} name="Failure %" />
              </LineChart>
            </ResponsiveContainer>
          ) : <div className="empty">No readings yet.</div>}
        </div>
      </div>
    </div>
  );
}

function SensorCard({ icon, color, value, label }) {
  return (
    <div className="sensor-card">
      <span className="sensor-icon" style={{ color }}>{icon}</span>
      <div>
        <span className="sensor-val">{value}</span>
        <span className="sensor-lbl">{label}</span>
      </div>
    </div>
  );
}
