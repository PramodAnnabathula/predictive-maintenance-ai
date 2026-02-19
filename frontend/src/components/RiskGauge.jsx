import { riskColor } from "../utils/helpers";

export default function RiskGauge({ probability, riskLevel }) {
  const color = riskColor(riskLevel);
  const C = 2 * Math.PI * 54;
  const offset = C - (probability / 100) * C;

  return (
    <div className="gauge">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r="54" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="12" />
        <circle cx="70" cy="70" r="54" fill="none" stroke={color} strokeWidth="12"
          strokeDasharray={C} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-90 70 70)" style={{ transition: "stroke-dashoffset .8s ease" }} />
      </svg>
      <div className="gauge-txt">
        <span className="gauge-val" style={{ color }}>{probability?.toFixed(1)}%</span>
        <span className="gauge-lbl">Failure Risk</span>
      </div>
    </div>
  );
}
