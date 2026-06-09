from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from .data import load_data

try:
    from xgboost import XGBClassifier
except ImportError:  # pragma: no cover
    XGBClassifier = None


TARGET = "churn"
ID_COLUMN = "customer_id"
MODEL_DIR = Path(__file__).resolve().parents[1] / "models"
MODEL_PATH = MODEL_DIR / "champion.joblib"


@dataclass
class ModelResult:
    name: str
    accuracy: float
    precision: float
    recall: float
    f1: float
    auc: float

    def as_dict(self) -> dict[str, Any]:
        return {
            "model": self.name,
            "accuracy": round(self.accuracy * 100, 2),
            "precision": round(self.precision * 100, 2),
            "recall": round(self.recall * 100, 2),
            "f1": round(self.f1 * 100, 2),
            "auc": round(self.auc * 100, 2),
        }


class ChurnModelService:
    def __init__(self) -> None:
        self.pipeline: Pipeline | None = None
        self.model_name = "Not trained"
        self.metrics: list[dict[str, Any]] = []
        self.feature_names: list[str] = []
        self.shap_background: np.ndarray | None = None
        self.data = load_data()

    @property
    def features(self) -> list[str]:
        return [column for column in self.data.columns if column not in {TARGET, ID_COLUMN}]

    def _preprocessor(self, frame: pd.DataFrame) -> ColumnTransformer:
        categorical = frame.select_dtypes(include=["object", "category"]).columns.tolist()
        numeric = frame.select_dtypes(include=[np.number]).columns.tolist()
        return ColumnTransformer(
            [
                (
                    "numeric",
                    Pipeline([("imputer", SimpleImputer(strategy="median")), ("scaler", StandardScaler())]),
                    numeric,
                ),
                (
                    "categorical",
                    Pipeline(
                        [
                            ("imputer", SimpleImputer(strategy="most_frequent")),
                            ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
                        ]
                    ),
                    categorical,
                ),
            ]
        )

    def train(self, force: bool = False) -> list[dict[str, Any]]:
        if MODEL_PATH.exists() and not force:
            artifact = joblib.load(MODEL_PATH)
            self.pipeline = artifact["pipeline"]
            self.model_name = artifact["model_name"]
            self.metrics = artifact["metrics"]
            self.shap_background = artifact.get("shap_background")
            return self.metrics

        x = self.data[self.features].copy()
        y = self.data[TARGET].astype(int)
        x_train, x_test, y_train, y_test = train_test_split(
            x, y, test_size=0.2, random_state=42, stratify=y
        )
        models: dict[str, Any] = {
            "Logistic Regression": LogisticRegression(max_iter=1200, class_weight="balanced"),
            "Random Forest": RandomForestClassifier(
                n_estimators=260, max_depth=10, min_samples_leaf=3, class_weight="balanced", random_state=42
            ),
            "Gradient Boosting": GradientBoostingClassifier(n_estimators=180, learning_rate=0.04, random_state=42),
        }
        if XGBClassifier is not None:
            models["XGBoost"] = XGBClassifier(
                n_estimators=260,
                max_depth=4,
                learning_rate=0.035,
                subsample=0.85,
                colsample_bytree=0.85,
                eval_metric="logloss",
                random_state=42,
            )

        candidates: list[tuple[ModelResult, Pipeline]] = []
        for name, model in models.items():
            pipeline = Pipeline([("preprocessor", self._preprocessor(x_train)), ("model", model)])
            try:
                pipeline.fit(x_train, y_train)
                probability = pipeline.predict_proba(x_test)[:, 1]
            except (AttributeError, TypeError, ValueError):
                # Keep the service available when an optional estimator is
                # incompatible with the locally installed scikit-learn build.
                continue
            prediction = (probability >= 0.5).astype(int)
            result = ModelResult(
                name=name,
                accuracy=accuracy_score(y_test, prediction),
                precision=precision_score(y_test, prediction, zero_division=0),
                recall=recall_score(y_test, prediction, zero_division=0),
                f1=f1_score(y_test, prediction, zero_division=0),
                auc=roc_auc_score(y_test, probability),
            )
            candidates.append((result, pipeline))

        if not candidates:
            raise RuntimeError("No churn model could be trained with the installed dependencies.")
        candidates.sort(key=lambda item: (item[0].auc, item[0].f1), reverse=True)
        champion, self.pipeline = candidates[0]
        self.model_name = champion.name
        self.metrics = [result.as_dict() for result, _ in candidates]
        preprocessor = self.pipeline.named_steps["preprocessor"]
        self.shap_background = preprocessor.transform(x_train.sample(min(80, len(x_train)), random_state=42))
        MODEL_DIR.mkdir(parents=True, exist_ok=True)
        joblib.dump(
            {
                "pipeline": self.pipeline,
                "model_name": self.model_name,
                "metrics": self.metrics,
                "shap_background": self.shap_background,
            },
            MODEL_PATH,
        )
        return self.metrics

    def ensure_ready(self) -> None:
        if self.pipeline is None:
            self.train()

    def predict(self, frame: pd.DataFrame) -> np.ndarray:
        self.ensure_ready()
        normalized = frame.reindex(columns=self.features)
        return self.pipeline.predict_proba(normalized)[:, 1]  # type: ignore[union-attr]

    def explain(self, row: dict[str, Any]) -> list[dict[str, Any]]:
        self.ensure_ready()
        try:
            import shap

            preprocessor = self.pipeline.named_steps["preprocessor"]  # type: ignore[union-attr]
            model = self.pipeline.named_steps["model"]  # type: ignore[union-attr]
            transformed = preprocessor.transform(pd.DataFrame([row]).reindex(columns=self.features))
            feature_names = preprocessor.get_feature_names_out()
            explainer = shap.Explainer(model, self.shap_background, feature_names=feature_names)
            values = np.asarray(explainer(transformed).values)
            if values.ndim == 3:
                values = values[:, :, -1]
            impacts = sorted(
                zip(feature_names, values[0]),
                key=lambda item: abs(float(item[1])),
                reverse=True,
            )[:5]
            return [
                {
                    "feature": str(name).split("__", 1)[-1].replace("_", " ").title(),
                    "impact": round(float(impact), 4),
                    "direction": "increases risk" if float(impact) >= 0 else "reduces risk",
                }
                for name, impact in impacts
            ]
        except Exception:
            return self._counterfactual_explain(row)

    def _counterfactual_explain(self, row: dict[str, Any]) -> list[dict[str, Any]]:
        baseline = dict(row)
        base_score = float(self.predict(pd.DataFrame([baseline]))[0])
        reference = {
            "contract": "Two year",
            "tenure": 48,
            "monthly_charges": 55.0,
            "tech_support": "Yes",
            "online_security": "Yes",
            "payment_method": "Credit card",
            "internet_service": "DSL",
        }
        labels = {
            "contract": "Contract type",
            "tenure": "Customer tenure",
            "monthly_charges": "Monthly charges",
            "tech_support": "Tech support",
            "online_security": "Online security",
            "payment_method": "Payment method",
            "internet_service": "Internet service",
        }
        impacts = []
        for feature, neutral_value in reference.items():
            counterfactual = dict(baseline)
            counterfactual[feature] = neutral_value
            neutral_score = float(self.predict(pd.DataFrame([counterfactual]))[0])
            impact = float(np.clip(base_score - neutral_score, -0.5, 0.5))
            impacts.append(
                {
                    "feature": labels[feature],
                    "impact": round(impact, 4),
                    "direction": "increases risk" if impact >= 0 else "reduces risk",
                }
            )
        return sorted(impacts, key=lambda item: abs(item["impact"]), reverse=True)[:5]


service = ChurnModelService()
