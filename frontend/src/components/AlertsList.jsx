import { FiCheckCircle, FiAlertTriangle } from "react-icons/fi";
import { fmtDate, sevIcon } from "../utils/helpers";

export default function AlertsList({ alerts, onResolve }) {
  if (!alerts?.length) {
    return (
      <div className="card">
        <div className="card-hdr"><h2 className="card-title">Active Alerts</h2></div>
        <div className="empty">
          <FiCheckCircle size={32} style={{ color: "#22c55e", marginBottom: 8 }} />
          <p>No active alerts. All systems normal.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-hdr">
        <h2 className="card-title">Active Alerts</h2>
        <span className="badge badge-danger">{alerts.length} unresolved</span>
      </div>
      <div className="alert-list">
        {alerts.map((a) => (
          <div key={a.id} className={`alert-item sev-${a.severity}`}>
            <div className="alert-left">
              <span className="alert-sev-icon">{sevIcon(a.severity)}</span>
              <div>
                <div className="alert-title">{a.title}</div>
                <div className="alert-msg">{a.message}</div>
                {a.recommendation && (
                  <div className="alert-rec"><FiAlertTriangle size={12} /><span>{a.recommendation}</span></div>
                )}
                <div className="alert-meta">{fmtDate(a.created_at)} &middot; Failure: {a.failure_probability?.toFixed(1)}%</div>
              </div>
            </div>
            <button className="btn btn-sm btn-ghost" onClick={() => onResolve(a.id)} title="Mark resolved">
              <FiCheckCircle size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
