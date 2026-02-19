# Predictive Maintenance AI

A full-stack application that simulates predictive maintenance risk scoring for industrial equipment. Enter sensor readings and get an instant risk assessment.

## Project Structure

```
predictive-maintenance-ai/
├── backend/
│   ├── package.json
│   └── server.js          # Express API with POST /predict endpoint
├── frontend/
│   ├── package.json
│   ├── vite.config.js      # Vite config with API proxy
│   ├── index.html
│   └── src/
│       ├── main.jsx        # React entry point
│       └── App.jsx         # Dashboard UI
└── README.md
```

## Getting Started

### Prerequisites

- **Node.js** v18 or later
- **npm** (comes with Node.js)

### 1. Install & Start the Backend

```bash
cd backend
npm install
npm start
```

The API server starts on **http://localhost:3001**.

### 2. Install & Start the Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The dashboard opens on **http://localhost:5173**.  
The Vite dev server proxies `/predict` requests to the backend automatically.

## API Reference

### `POST /predict`

Accepts sensor readings and returns a risk score.

**Request body** (JSON):

| Field           | Type   | Default | Description                |
| --------------- | ------ | ------- | -------------------------- |
| `temperature`   | number | 60      | Current temperature (°C)   |
| `vibration`     | number | 2       | Vibration level (mm/s)     |
| `runtime_hours` | number | 500     | Cumulative runtime (hours) |
| `pressure`      | number | 30      | Operating pressure (psi)   |

**Example request:**

```bash
curl -X POST http://localhost:3001/predict \
  -H "Content-Type: application/json" \
  -d '{"temperature": 85, "vibration": 6, "runtime_hours": 7200, "pressure": 45}'
```

**Example response:**

```json
{
  "score": 52,
  "risk_level": "Medium",
  "timestamp": "2026-02-14T12:00:00.000Z",
  "inputs": {
    "temperature": 85,
    "vibration": 6,
    "runtime_hours": 7200,
    "pressure": 45
  }
}
```

### `GET /health`

Returns server status and uptime.

## Risk Scoring Logic

The scoring algorithm computes a weighted deviation from ideal operating values:

| Factor        | Weight | Ideal Value |
| ------------- | ------ | ----------- |
| Temperature   | 30%    | 55 °C       |
| Vibration     | 30%    | 1.5 mm/s    |
| Runtime Hours | 25%    | 0 (linear)  |
| Pressure      | 15%    | 30 psi      |

**Risk levels:**

| Score Range | Level    |
| ----------- | -------- |
| 0 – 30      | Low      |
| 31 – 60     | Medium   |
| 61 – 80     | High     |
| 81 – 100    | Critical |

## Tech Stack

- **Backend:** Node.js, Express, CORS
- **Frontend:** React 18, Vite
- **Styling:** Inline CSS-in-JS (no external UI library)
