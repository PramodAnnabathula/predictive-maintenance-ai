export default function LoadingSpinner({ message = "Loading…" }) {
  return (
    <div className="loading-full">
      <div className="spinner" />
      <p className="loading-txt">{message}</p>
    </div>
  );
}
