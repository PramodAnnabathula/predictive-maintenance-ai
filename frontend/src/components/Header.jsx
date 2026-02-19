import { FiActivity, FiRefreshCw } from "react-icons/fi";

export default function Header({ onSimulate, busy }) {
  return (
    <header className="header">
      <div className="header-left">
        <div className="header-icon"><FiActivity size={24} /></div>
        <div>
          <h1 className="header-title">AI Predictive Maintenance</h1>
          <p className="header-sub">Real-time machine health monitoring</p>
        </div>
      </div>
      <button className={`btn btn-primary ${busy ? "btn-busy" : ""}`} onClick={onSimulate} disabled={busy}>
        <FiRefreshCw size={16} className={busy ? "spin" : ""} />
        {busy ? "Simulating…" : "Simulate New Data"}
      </button>
    </header>
  );
}
