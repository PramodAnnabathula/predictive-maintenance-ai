import dotenv from "dotenv";
dotenv.config();

const config = {
  port: parseInt(process.env.PORT || "8000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  dbPath: process.env.DB_PATH || "./maintenance.db",
};

export default config;
