import { fmtDate, n, riskColor, riskBg } from "../utils/helpers";

export default function AnomaliesPanel({ anomalies }) {
  if (!anomalies?.length) {
    return (
      <div className="card">
        <div className="card-hdr"><h2 className="card-title">Recent Anomalies</h2></div>
        <div className="empty"><p>No anomalies detected recently.</p></div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-hdr">
        <h2 className="card-title">Recent Anomalies</h2>
        <span className="badge badge-warning">{anomalies.length} detected</span>
      </div>
      <div className="anom-list">
        {anomalies.slice(0, 15).map((a) => (
          <div key={a.id} className="anom-item">
            <div className="anom-row">
              <span className="fw600">Machine #{a.machine_id}</span>
              <span className="risk-badge" style={{ color: riskColor(a.risk_level), backgroundColor: riskBg(a.risk_level) }}>
                {a.risk_level?.toUpperCase()}
              </span>
            </div>
            <div className="anom-sensors">
              <span>Temp: {n(a.temperature)}°C</span>
              <span>Vib: {n(a.vibration, 2)} mm/s</span>
              <span>Fail: {n(a.failure_probability)}%</span>
            </div>
            <div className="anom-time">{fmtDate(a.recorded_at)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
