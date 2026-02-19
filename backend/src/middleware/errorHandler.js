/**
 * Global Express error handler.
 */

export function notFoundHandler(req, res) {
  res.status(404).json({ error: "Not found", path: req.originalUrl });
}

export function errorHandler(err, req, res, _next) {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}
