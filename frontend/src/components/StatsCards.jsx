import { FiCpu, FiCheckCircle, FiAlertTriangle, FiAlertOctagon } from "react-icons/fi";

const cards = (s) => [
  { label: "Total Machines",  value: s.total_machines,    icon: <FiCpu size={22} />,            color: "#6366f1", bg: "rgba(99,102,241,.1)"  },
  { label: "Operational",     value: s.operational_count, icon: <FiCheckCircle size={22} />,     color: "#22c55e", bg: "rgba(34,197,94,.1)"   },
  { label: "Warning",         value: s.warning_count,     icon: <FiAlertTriangle size={22} />,   color: "#f59e0b", bg: "rgba(245,158,11,.1)"  },
  { label: "Critical",        value: s.critical_count,    icon: <FiAlertOctagon size={22} />,    color: "#ef4444", bg: "rgba(239,68,68,.1)"   },
];

export default function StatsCards({ summary }) {
  if (!summary) return null;
  return (
    <div className="stats-grid">
      {cards(summary).map((c) => (
        <div className="stat-card" key={c.label}>
          <div className="stat-icon" style={{ color: c.color, backgroundColor: c.bg }}>{c.icon}</div>
          <div className="stat-info">
            <span className="stat-val">{c.value}</span>
            <span className="stat-lbl">{c.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
