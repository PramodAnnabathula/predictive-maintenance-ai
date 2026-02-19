import { useState } from "react";

const API_URL = "/predict";

const defaultInputs = {
  temperature: 70,
  vibration: 3.5,
  runtime_hours: 4500,
  pressure: 35,
};

/* ------------------------------------------------------------------ */
/*  Colour helpers                                                     */
/* ------------------------------------------------------------------ */
function riskColor(level) {
  switch (level) {
    case "Low":
      return "#22c55e";
    case "Medium":
      return "#eab308";
    case "High":
      return "#f97316";
    case "Critical":
      return "#ef4444";
    default:
      return "#94a3b8";
  }
}

function scoreGradient(score) {
  if (score <= 30) return "linear-gradient(135deg, #22c55e, #4ade80)";
  if (score <= 60) return "linear-gradient(135deg, #eab308, #facc15)";
  if (score <= 80) return "linear-gradient(135deg, #f97316, #fb923c)";
  return "linear-gradient(135deg, #ef4444, #f87171)";
}

/* ------------------------------------------------------------------ */
/*  Main App                                                           */
/* ------------------------------------------------------------------ */
export default function App() {
  const [inputs, setInputs] = useState(defaultInputs);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          temperature: Number(inputs.temperature),
          vibration: Number(inputs.vibration),
          runtime_hours: Number(inputs.runtime_hours),
          pressure: Number(inputs.pressure),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Request failed");
      }

      const data = await res.json();
      setResult(data);
      setHistory((prev) => [data, ...prev].slice(0, 10));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* ------- Header ------- */}
      <header style={styles.header}>
        <h1 style={styles.title}>Predictive Maintenance Dashboard</h1>
        <p style={styles.subtitle}>
          Enter sensor readings to assess equipment risk in real time.
        </p>
      </header>

      <div style={styles.grid}>
        {/* ------- Input Form ------- */}
        <form onSubmit={handleSubmit} style={styles.card}>
          <h2 style={styles.cardTitle}>Sensor Inputs</h2>

          {[
            { label: "Temperature (°C)", name: "temperature", min: 0, max: 200 },
            { label: "Vibration (mm/s)", name: "vibration", min: 0, max: 20, step: 0.1 },
            { label: "Runtime Hours", name: "runtime_hours", min: 0, max: 50000 },
            { label: "Pressure (psi)", name: "pressure", min: 0, max: 200 },
          ].map((field) => (
            <div key={field.name} style={styles.field}>
              <label style={styles.label}>{field.label}</label>
              <input
                type="number"
                name={field.name}
                value={inputs[field.name]}
                onChange={handleChange}
                min={field.min}
                max={field.max}
                step={field.step || 1}
                style={styles.input}
                required
              />
              <input
                type="range"
                name={field.name}
                value={inputs[field.name]}
                onChange={handleChange}
                min={field.min}
                max={field.max}
                step={field.step || 1}
                style={styles.slider}
              />
            </div>
          ))}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Analysing…" : "Run Prediction"}
          </button>

          {error && <p style={styles.error}>{error}</p>}
        </form>

        {/* ------- Result Panel ------- */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Risk Assessment</h2>

          {result ? (
            <div style={styles.resultBox}>
              <div
                style={{
                  ...styles.scoreCircle,
                  background: scoreGradient(result.score),
                }}
              >
                <span style={styles.scoreNumber}>{result.score}</span>
                <span style={styles.scoreLabel}>/ 100</span>
              </div>

              <span
                style={{
                  ...styles.badge,
                  backgroundColor: riskColor(result.risk_level),
                }}
              >
                {result.risk_level} Risk
              </span>

              <p style={styles.timestamp}>
                Assessed at{" "}
                {new Date(result.timestamp).toLocaleTimeString()}
              </p>
            </div>
          ) : (
            <p style={styles.placeholder}>
              Submit sensor data to see the risk score.
            </p>
          )}

          {/* ------- History ------- */}
          {history.length > 0 && (
            <>
              <h3 style={{ ...styles.cardTitle, fontSize: "1rem", marginTop: 32 }}>
                Recent Predictions
              </h3>
              <div style={styles.historyList}>
                {history.map((h, i) => (
                  <div key={i} style={styles.historyItem}>
                    <span
                      style={{
                        ...styles.historyDot,
                        backgroundColor: riskColor(h.risk_level),
                      }}
                    />
                    <span style={styles.historyScore}>Score {h.score}</span>
                    <span style={styles.historyLevel}>{h.risk_level}</span>
                    <span style={styles.historyTime}>
                      {new Date(h.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Inline styles                                                      */
/* ------------------------------------------------------------------ */
const styles = {
  page: {
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    minHeight: "100vh",
    margin: 0,
    padding: "2rem",
    background: "linear-gradient(160deg, #0f172a 0%, #1e293b 100%)",
    color: "#e2e8f0",
    boxSizing: "border-box",
  },
  header: {
    textAlign: "center",
    marginBottom: "2.5rem",
  },
  title: {
    fontSize: "2rem",
    fontWeight: 700,
    margin: 0,
    background: "linear-gradient(90deg, #38bdf8, #818cf8)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    color: "#94a3b8",
    marginTop: 8,
    fontSize: "1.05rem",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "2rem",
    maxWidth: 960,
    margin: "0 auto",
  },
  card: {
    background: "rgba(30, 41, 59, 0.7)",
    backdropFilter: "blur(12px)",
    borderRadius: 16,
    padding: "2rem",
    border: "1px solid rgba(148, 163, 184, 0.12)",
  },
  cardTitle: {
    fontSize: "1.15rem",
    fontWeight: 600,
    marginTop: 0,
    marginBottom: 20,
    color: "#f1f5f9",
  },
  field: {
    marginBottom: 18,
  },
  label: {
    display: "block",
    marginBottom: 6,
    fontSize: "0.85rem",
    fontWeight: 500,
    color: "#94a3b8",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid rgba(148, 163, 184, 0.25)",
    background: "rgba(15, 23, 42, 0.6)",
    color: "#e2e8f0",
    fontSize: "0.95rem",
    outline: "none",
    boxSizing: "border-box",
  },
  slider: {
    width: "100%",
    marginTop: 6,
    accentColor: "#818cf8",
  },
  button: {
    width: "100%",
    padding: "12px 0",
    marginTop: 8,
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg, #6366f1, #818cf8)",
    color: "#fff",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "opacity 0.2s",
  },
  error: {
    color: "#f87171",
    marginTop: 12,
    fontSize: "0.9rem",
  },
  resultBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
    padding: "1.5rem 0",
  },
  scoreCircle: {
    width: 140,
    height: 140,
    borderRadius: "50%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
  },
  scoreNumber: {
    fontSize: "2.5rem",
    fontWeight: 700,
    color: "#fff",
    lineHeight: 1,
  },
  scoreLabel: {
    fontSize: "0.85rem",
    color: "rgba(255,255,255,0.7)",
  },
  badge: {
    padding: "6px 18px",
    borderRadius: 999,
    fontWeight: 600,
    fontSize: "0.9rem",
    color: "#fff",
  },
  timestamp: {
    color: "#64748b",
    fontSize: "0.8rem",
    marginTop: 4,
  },
  placeholder: {
    color: "#64748b",
    textAlign: "center",
    padding: "3rem 0",
    fontSize: "0.95rem",
  },
  historyList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  historyItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 12px",
    borderRadius: 8,
    background: "rgba(15, 23, 42, 0.5)",
    fontSize: "0.85rem",
  },
  historyDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    flexShrink: 0,
  },
  historyScore: {
    fontWeight: 600,
    color: "#e2e8f0",
  },
  historyLevel: {
    color: "#94a3b8",
  },
  historyTime: {
    marginLeft: "auto",
    color: "#64748b",
    fontSize: "0.8rem",
  },
};
