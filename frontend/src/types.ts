export type View = "overview" | "analytics" | "customers" | "prediction" | "model" | "reports";

export interface Customer {
  customer_id: string;
  gender: string;
  senior_citizen: number;
  tenure: number;
  contract: string;
  payment_method: string;
  monthly_charges: number;
  total_charges: number;
  internet_service: string;
  tech_support: string;
  churn_probability: number;
  risk_level: "Critical" | "High" | "Medium" | "Low";
  churn?: number;
}

export interface PredictionInput {
  gender: string;
  senior_citizen: number;
  tenure: number;
  contract: string;
  payment_method: string;
  monthly_charges: number;
  total_charges: number;
  internet_service: string;
  tech_support: string;
  online_security: string;
  paperless_billing: string;
}

export interface PredictionResult {
  churn_probability: number;
  risk_level: string;
  confidence_score: number;
  prediction: string;
  strategy: string;
  explanation: { feature: string; impact: number; direction: string }[];
}
