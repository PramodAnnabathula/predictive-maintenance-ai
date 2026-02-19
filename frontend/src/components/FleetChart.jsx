import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { riskColor } from "../utils/helpers";

export default function FleetChart({ machines }) {
  if (!machines?.length) return null;

  const data = machines.map((m) => ({
    name: m.name.length > 18 ? m.name.slice(0, 16) + "…" : m.name,
    prob: m.failure_probability,
    risk: m.risk_level,
  }));

  return (
    <div className="card">
      <div className="card-hdr"><h2 className="card-title">Fleet Risk Overview</h2></div>
      <div style={{ padding: "0 16px 16px" }}>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 40, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
            <XAxis dataKey="name" stroke="#6b7280" fontSize={11} angle={-35} textAnchor="end" interval={0} height={60} />
            <YAxis stroke="#6b7280" fontSize={12} domain={[0, 100]} unit="%" />
            <Tooltip
              contentStyle={{ backgroundColor: "#1e293b", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, color: "#e2e8f0" }}
              formatter={(v) => [`${v.toFixed(1)}%`, "Failure Probability"]}
            />
            <Bar dataKey="prob" radius={[4, 4, 0, 0]} maxBarSize={48}>
              {data.map((e, i) => <Cell key={i} fill={riskColor(e.risk)} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
