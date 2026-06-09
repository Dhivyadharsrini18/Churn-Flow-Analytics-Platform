from pydantic import BaseModel, Field


class PredictionInput(BaseModel):
    gender: str = "Female"
    senior_citizen: int = Field(default=0, ge=0, le=1)
    tenure: int = Field(default=12, ge=0, le=120)
    contract: str = "Month-to-month"
    payment_method: str = "Electronic check"
    monthly_charges: float = Field(default=70.0, ge=0)
    total_charges: float = Field(default=840.0, ge=0)
    internet_service: str = "Fiber optic"
    tech_support: str = "No"
    online_security: str = "No"
    paperless_billing: str = "Yes"


class FeatureImpact(BaseModel):
    feature: str
    impact: float
    direction: str


class PredictionResponse(BaseModel):
    churn_probability: float
    risk_level: str
    confidence_score: float
    prediction: str
    strategy: str
    explanation: list[FeatureImpact]
