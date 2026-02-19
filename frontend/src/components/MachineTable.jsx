import { riskColor, riskBg, statusColor, n, fmtDate } from "../utils/helpers";

export default function MachineTable({ machines, selectedId, onSelect }) {
  if (!machines?.length) return <div className="empty">No machines found.</div>;

  return (
    <div className="card">
      <div className="card-hdr">
        <h2 className="card-title">Machine Fleet</h2>
        <span className="badge badge-info">{machines.length} machines</span>
      </div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Machine</th><th>Type</th><th>Location</th><th>Status</th>
              <th>Failure Prob.</th><th>Risk</th><th>Last Maint.</th>
            </tr>
          </thead>
          <tbody>
            {machines.map((m) => (
              <tr key={m.id} className={`tbl-row clickable${selectedId === m.id ? " selected" : ""}`} onClick={() => onSelect(m)}>
                <td className="fw600">{m.name}</td>
                <td>{m.type}</td>
                <td className="muted">{m.location}</td>
                <td>
                  <span className="dot" style={{ backgroundColor: statusColor(m.status) }} />
                  <span style={{ textTransform: "capitalize" }}>{m.status}</span>
                </td>
                <td><span className="mono">{n(m.failure_probability)}%</span></td>
                <td>
                  <span className="risk-badge" style={{ color: riskColor(m.risk_level), backgroundColor: riskBg(m.risk_level) }}>
                    {m.risk_level?.toUpperCase()}
                  </span>
                </td>
                <td className="muted">{fmtDate(m.last_maintenance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
