# ChurnFlow AI

A premium full-stack customer churn intelligence platform. ChurnFlow combines an enterprise-style React dashboard, deep interactive analytics, real-time customer scoring, explainable model signals, retention recommendations, and PDF reporting.

## Highlights

- Executive dashboard with churn, revenue risk, CLV, customer health, and monthly trends
- Advanced analysis for tenure, contracts, charges, payments, demographics, segments, and correlations
- Customer risk command center with search, filtering, risk bands, and retention actions
- Real-time manual prediction and CSV batch prediction
- Automatic comparison of Logistic Regression, Random Forest, Gradient Boosting, and XGBoost
- Explainability through feature counterfactuals with a SHAP-ready pipeline
- Model metrics, confusion matrix, ROC curves, feature importance, and champion selection
- Executive PDF reporting, dark mode, responsive layouts, loading states, and notifications
- Docker deployment with Nginx reverse proxy

## Architecture

```text
.
├── frontend/                 React + TypeScript + Vite
│   ├── src/
│   │   ├── App.tsx          Product views and interactions
│   │   ├── api.ts           Typed API client
│   │   ├── data.ts          Demo analytical series
│   │   ├── styles.css       Responsive glassmorphism design system
│   │   └── types.ts         Shared frontend interfaces
│   └── Dockerfile
├── backend/                  FastAPI + scikit-learn
│   ├── app/
│   │   ├── main.py          API routes and reports
│   │   ├── ml_service.py    Training, comparison, prediction, explanation
│   │   ├── data.py          Reproducible synthetic data generator
│   │   └── schemas.py       Pydantic contracts
│   ├── data/                Sample customer CSV
│   └── requirements.txt
└── docker-compose.yml
```

## Local Installation

### Backend

Python 3.11 is recommended.

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The first launch creates a 2,400-row reproducible dataset, trains all available models, selects the best by ROC-AUC and F1 score, and stores the champion artifact under `backend/models/`.

### Frontend

Node.js 20 or newer is recommended.

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` to `http://localhost:8000`.

## Docker Deployment

```bash
docker compose up --build
```

- Web application: `http://localhost:3000`
- FastAPI: `http://localhost:8000`
- Swagger documentation: `http://localhost:8000/api/docs`

For production, place the containers behind TLS, restrict CORS origins, use a managed PostgreSQL instance for saved scoring history, and mount durable model storage.

## API

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | Service and champion model health |
| `GET` | `/api/dashboard` | KPIs, risk distribution, and model summary |
| `GET` | `/api/customers` | Scored customer list with risk filtering |
| `POST` | `/api/predict` | Single-customer churn score and explanation |
| `POST` | `/api/predict/batch` | CSV batch scoring |
| `POST` | `/api/models/retrain` | Retrain and reselect the champion |
| `GET` | `/api/reports/executive.pdf` | Download an executive PDF |

Example:

```bash
curl -X POST http://localhost:8000/api/predict \
  -H "Content-Type: application/json" \
  -d "{\"gender\":\"Female\",\"senior_citizen\":0,\"tenure\":8,\"contract\":\"Month-to-month\",\"payment_method\":\"Electronic check\",\"monthly_charges\":89.5,\"total_charges\":716,\"internet_service\":\"Fiber optic\",\"tech_support\":\"No\",\"online_security\":\"No\",\"paperless_billing\":\"Yes\"}"
```

## ML Workflow

`Data collection -> validation -> missing-value imputation -> categorical encoding -> scaling -> stratified split -> multi-model training -> evaluation -> champion selection -> prediction -> explanation -> retention recommendation`

The service uses a scikit-learn `Pipeline` and `ColumnTransformer`, preventing training-serving skew. The synthetic dataset intentionally models realistic churn drivers without containing personal data.

## CSV Schema

Required batch fields:

`gender`, `senior_citizen`, `tenure`, `contract`, `payment_method`, `monthly_charges`, `total_charges`, `internet_service`, `tech_support`, `online_security`, `paperless_billing`

## Portfolio Notes

The frontend works in a polished demo mode even when the API is offline. When FastAPI is available, predictions use the trained champion model. Replace the generated CSV with an organization dataset using the same target and feature schema, retrain, and connect authentication plus persistent scoring history for a live deployment.
