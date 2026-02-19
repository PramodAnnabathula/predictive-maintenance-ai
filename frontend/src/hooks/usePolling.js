/**
 * Custom hook — fetches data on mount and re-fetches on an interval.
 */

import { useState, useEffect, useCallback } from "react";

export default function usePolling(fetchFn, intervalMs = 30000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const execute = useCallback(async () => {
    try {
      setError(null);
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    execute();
    const id = setInterval(execute, intervalMs);
    return () => clearInterval(id);
  }, [execute, intervalMs]);

  return { data, loading, error, refresh: execute };
}
