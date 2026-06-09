from __future__ import annotations

from io import BytesIO
from typing import Any

import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from .ml_service import ID_COLUMN, TARGET, service
from .schemas import PredictionInput, PredictionResponse


app = FastAPI(
    title="ChurnFlow AI API",
    description="Production-style customer churn scoring, analytics, explainability, and reporting.",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def risk_level(probability: float) -> str:
    if probability >= 0.75:
        return "Critical"
    if probability >= 0.55:
        return "High"
    if probability >= 0.3:
        return "Medium"
    return "Low"


def strategy(probability: float, payload: dict[str, Any]) -> str:
    if probability >= 0.75:
        if payload.get("contract") == "Month-to-month":
            return "Offer a 15-20% loyalty incentive tied to an annual contract and schedule priority outreach within 24 hours."
        return "Assign a retention specialist, resolve service friction, and provide a personalized loyalty credit."
    if probability >= 0.55:
        return "Launch a proactive service check-in and offer a targeted loyalty or support bundle."
    if probability >= 0.3:
        return "Add the customer to a nurture journey with product education and milestone rewards."
    return "Maintain regular engagement and recognize the next loyalty milestone."


@app.on_event("startup")
def load_model() -> None:
    service.train()


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "healthy", "model": service.model_name}


@app.get("/api/dashboard")
def dashboard() -> dict[str, Any]:
    frame = service.data.copy()
    churned = int(frame[TARGET].sum())
    total = len(frame)
    active = total - churned
    revenue_at_risk = float(frame.loc[frame[TARGET] == 1, "monthly_charges"].sum())
    probabilities = service.predict(frame[service.features])
    return {
        "kpis": {
            "total_customers": total,
            "active_customers": active,
            "churned_customers": churned,
            "churn_rate": round(churned / total * 100, 2),
            "revenue_at_risk": round(revenue_at_risk, 2),
            "customer_lifetime_value": round(float(frame["total_charges"].mean()), 2),
        },
        "risk_distribution": {
            "critical": int((probabilities >= 0.75).sum()),
            "high": int(((probabilities >= 0.55) & (probabilities < 0.75)).sum()),
            "medium": int(((probabilities >= 0.3) & (probabilities < 0.55)).sum()),
            "low": int((probabilities < 0.3).sum()),
        },
        "model": service.model_name,
        "model_metrics": service.metrics,
    }


@app.get("/api/customers")
def customers(limit: int = 100, risk: str | None = None, search: str | None = None) -> dict[str, Any]:
    frame = service.data.copy()
    frame["churn_probability"] = service.predict(frame[service.features])
    frame["risk_level"] = frame["churn_probability"].apply(risk_level)
    if risk:
        frame = frame[frame["risk_level"].str.lower() == risk.lower()]
    if search:
        frame = frame[frame[ID_COLUMN].str.contains(search, case=False, na=False)]
    frame = frame.sort_values("churn_probability", ascending=False).head(min(limit, 500))
    return {"customers": frame.to_dict(orient="records"), "count": len(frame)}


@app.post("/api/predict", response_model=PredictionResponse)
def predict(payload: PredictionInput) -> dict[str, Any]:
    row = payload.model_dump()
    probability = float(service.predict(pd.DataFrame([row]))[0])
    return {
        "churn_probability": round(probability, 4),
        "risk_level": risk_level(probability),
        "confidence_score": round(max(probability, 1 - probability), 4),
        "prediction": "Likely to churn" if probability >= 0.5 else "Likely to stay",
        "strategy": strategy(probability, row),
        "explanation": service.explain(row),
    }


@app.post("/api/predict/batch")
async def batch_predict(file: UploadFile = File(...)) -> dict[str, Any]:
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="A CSV file is required.")
    try:
        frame = pd.read_csv(file.file)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not parse CSV: {exc}") from exc
    missing = [feature for feature in service.features if feature not in frame.columns]
    if missing:
        raise HTTPException(status_code=422, detail={"missing_columns": missing})
    probability = service.predict(frame)
    result = frame.copy()
    result["churn_probability"] = probability.round(4)
    result["risk_level"] = [risk_level(value) for value in probability]
    result["recommended_action"] = [strategy(value, row) for value, row in zip(probability, frame.to_dict("records"))]
    return {"predictions": result.head(1000).to_dict(orient="records"), "count": len(result)}


@app.post("/api/models/retrain")
def retrain() -> dict[str, Any]:
    metrics = service.train(force=True)
    return {"champion": service.model_name, "metrics": metrics}


@app.get("/api/reports/executive.pdf")
def executive_report() -> StreamingResponse:
    frame = service.data
    total = len(frame)
    churned = int(frame[TARGET].sum())
    buffer = BytesIO()
    document = SimpleDocTemplate(buffer, pagesize=A4, title="ChurnFlow AI Executive Summary")
    styles = getSampleStyleSheet()
    story = [
        Paragraph("ChurnFlow AI - Executive Summary", styles["Title"]),
        Paragraph("Customer retention intelligence and model performance report", styles["Normal"]),
        Spacer(1, 18),
        Table(
            [
                ["Metric", "Value"],
                ["Total customers", f"{total:,}"],
                ["Churned customers", f"{churned:,}"],
                ["Churn rate", f"{churned / total * 100:.2f}%"],
                ["Revenue at risk", f"${frame.loc[frame[TARGET] == 1, 'monthly_charges'].sum():,.0f}/month"],
                ["Champion model", service.model_name],
            ],
            colWidths=[220, 220],
            style=TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#7655DD")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5DFF0")),
                    ("PADDING", (0, 0), (-1, -1), 10),
                ]
            ),
        ),
        Spacer(1, 20),
        Paragraph(
            "Recommended focus: prioritize short-tenure month-to-month customers using electronic checks, "
            "then pair annual-contract incentives with proactive technical support.",
            styles["BodyText"],
        ),
    ]
    document.build(story)
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="churnflow-executive-summary.pdf"'},
    )
