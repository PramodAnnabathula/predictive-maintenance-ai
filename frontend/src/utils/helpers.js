/* colour + formatting helpers */

export const riskColor = (r) =>
  ({ high: "#ef4444", medium: "#f59e0b", low: "#22c55e" })[r] || "#6b7280";

export const riskBg = (r) =>
  ({ high: "rgba(239,68,68,.1)", medium: "rgba(245,158,11,.1)", low: "rgba(34,197,94,.1)" })[r] || "rgba(107,114,128,.1)";

export const statusColor = (s) =>
  ({ operational: "#22c55e", warning: "#f59e0b", critical: "#ef4444", offline: "#6b7280" })[s] || "#6b7280";

export const sevIcon = (s) =>
  ({ critical: "🔴", high: "🟠", medium: "🟡", low: "🟢" })[s] || "⚪";

export function fmtDate(d) {
  if (!d) return "N/A";
  return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export const n = (v, d = 1) => (v == null ? "N/A" : Number(v).toFixed(d));
