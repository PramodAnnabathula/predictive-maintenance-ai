import { FiAlertCircle, FiRefreshCw } from "react-icons/fi";

export default function ErrorBanner({ message, onRetry }) {
  return (
    <div className="error-banner">
      <FiAlertCircle size={20} />
      <span>{message}</span>
      {onRetry && (
        <button className="btn btn-sm btn-ghost" onClick={onRetry}>
          <FiRefreshCw size={14} /> Retry
        </button>
      )}
    </div>
  );
}
