from pathlib import Path

import numpy as np
import pandas as pd


DATA_DIR = Path(__file__).resolve().parents[1] / "data"
DATA_PATH = DATA_DIR / "sample_customers.csv"


def generate_dataset(rows: int = 2400, seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    tenure = rng.integers(0, 73, rows)
    contract = rng.choice(["Month-to-month", "One year", "Two year"], rows, p=[0.55, 0.24, 0.21])
    internet = rng.choice(["Fiber optic", "DSL", "No"], rows, p=[0.44, 0.39, 0.17])
    support = rng.choice(["Yes", "No"], rows, p=[0.43, 0.57])
    security = rng.choice(["Yes", "No"], rows, p=[0.45, 0.55])
    payment = rng.choice(
        ["Electronic check", "Mailed check", "Bank transfer", "Credit card"],
        rows,
        p=[0.34, 0.23, 0.22, 0.21],
    )
    monthly = np.clip(
        23
        + (internet == "DSL") * 24
        + (internet == "Fiber optic") * 55
        + (support == "Yes") * 7
        + rng.normal(0, 9, rows),
        18,
        120,
    ).round(2)
    total = np.clip(monthly * np.maximum(tenure, 1) * rng.normal(0.99, 0.06, rows), 18, None).round(2)
    senior = rng.choice([0, 1], rows, p=[0.83, 0.17])
    paperless = rng.choice(["Yes", "No"], rows, p=[0.59, 0.41])

    logit = (
        -2.25
        + (contract == "Month-to-month") * 1.45
        - (contract == "Two year") * 1.1
        + (tenure < 12) * 0.9
        - tenure * 0.018
        + (internet == "Fiber optic") * 0.55
        + (support == "No") * 0.45
        + (security == "No") * 0.32
        + (payment == "Electronic check") * 0.54
        + senior * 0.34
        + (monthly > 85) * 0.4
        + (paperless == "Yes") * 0.18
        + rng.normal(0, 0.55, rows)
    )
    probability = 1 / (1 + np.exp(-logit))
    churn = rng.binomial(1, probability)
    frame = pd.DataFrame(
        {
            "customer_id": [f"CF-{10000 + i}" for i in range(rows)],
            "gender": rng.choice(["Female", "Male"], rows),
            "senior_citizen": senior,
            "tenure": tenure,
            "contract": contract,
            "payment_method": payment,
            "monthly_charges": monthly,
            "total_charges": total,
            "internet_service": internet,
            "tech_support": support,
            "online_security": security,
            "paperless_billing": paperless,
            "churn": churn,
        }
    )
    return frame


def load_data() -> pd.DataFrame:
    if DATA_PATH.exists():
        frame = pd.read_csv(DATA_PATH)
        if len(frame) >= 500:
            return frame
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    frame = generate_dataset()
    frame.to_csv(DATA_PATH, index=False)
    return frame


if __name__ == "__main__":
    data = load_data()
    print(f"Wrote {len(data):,} sample customers to {DATA_PATH}")
