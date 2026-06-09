import type { Customer, PredictionInput } from "./types";

export const monthlyTrend = [
  { month: "Jan", churn: 24.8, retained: 75.2, revenue: 168 },
  { month: "Feb", churn: 23.1, retained: 76.9, revenue: 157 },
  { month: "Mar", churn: 25.6, retained: 74.4, revenue: 174 },
  { month: "Apr", churn: 22.4, retained: 77.6, revenue: 149 },
  { month: "May", churn: 21.8, retained: 78.2, revenue: 143 },
  { month: "Jun", churn: 19.7, retained: 80.3, revenue: 128 },
  { month: "Jul", churn: 20.5, retained: 79.5, revenue: 136 },
  { month: "Aug", churn: 18.9, retained: 81.1, revenue: 121 },
  { month: "Sep", churn: 18.2, retained: 81.8, revenue: 116 },
  { month: "Oct", churn: 17.6, retained: 82.4, revenue: 110 },
  { month: "Nov", churn: 16.4, retained: 83.6, revenue: 102 },
  { month: "Dec", churn: 15.2, retained: 84.8, revenue: 94 }
];

export const contractData = [
  { name: "Month-to-month", churned: 42.7, retained: 57.3, customers: 3875 },
  { name: "One year", churned: 11.3, retained: 88.7, customers: 1473 },
  { name: "Two year", churned: 2.9, retained: 97.1, customers: 1695 }
];

export const paymentData = [
  { name: "Electronic check", value: 45.3, count: 2365 },
  { name: "Mailed check", value: 19.1, count: 1612 },
  { name: "Bank transfer", value: 16.7, count: 1544 },
  { name: "Credit card", value: 18.9, count: 1522 }
];

export const tenureData = [
  { range: "0-6", churn: 53, customers: 1172 },
  { range: "7-12", churn: 35, customers: 814 },
  { range: "13-24", churn: 26, customers: 1024 },
  { range: "25-36", churn: 20, customers: 832 },
  { range: "37-48", churn: 15, customers: 762 },
  { range: "49-60", churn: 10, customers: 795 },
  { range: "61-72", churn: 6, customers: 1644 }
];

export const chargeBands = [
  { range: "$0-25", churned: 96, retained: 654 },
  { range: "$26-50", churned: 228, retained: 948 },
  { range: "$51-75", churned: 514, retained: 1210 },
  { range: "$76-100", churned: 702, retained: 1434 },
  { range: "$100+", churned: 329, retained: 928 }
];

export const serviceData = [
  { service: "Fiber optic", churn: 41.9, retained: 58.1, revenue: 89 },
  { service: "DSL", churn: 19.0, retained: 81.0, revenue: 43 },
  { service: "No internet", churn: 7.4, retained: 92.6, revenue: 12 }
];

export const supportData = [
  { name: "No tech support", churn: 42.6, customers: 3473 },
  { name: "Tech support", churn: 15.2, customers: 2044 },
  { name: "Online security", churn: 14.6, customers: 2019 },
  { name: "No security", churn: 38.8, customers: 3498 }
];

export const revenueOpportunity = [
  { segment: "Critical", risk: 94, revenue: 42, saveRate: 31 },
  { segment: "High", risk: 72, revenue: 34, saveRate: 38 },
  { segment: "Medium", risk: 43, revenue: 25, saveRate: 51 },
  { segment: "Low", risk: 14, revenue: 8, saveRate: 68 }
];

export const cohortMatrix = [
  { cohort: "New", low: 14, medium: 27, high: 32, critical: 27 },
  { cohort: "Growing", low: 31, medium: 29, high: 24, critical: 16 },
  { cohort: "Mature", low: 58, medium: 22, high: 13, critical: 7 },
  { cohort: "Loyal", low: 78, medium: 13, high: 6, critical: 3 }
];

export const featureImportance = [
  { feature: "Contract type", value: 0.89, impact: "high" },
  { feature: "Tenure", value: 0.81, impact: "high" },
  { feature: "Monthly charges", value: 0.72, impact: "high" },
  { feature: "Tech support", value: 0.61, impact: "medium" },
  { feature: "Internet service", value: 0.54, impact: "medium" },
  { feature: "Payment method", value: 0.47, impact: "medium" },
  { feature: "Online security", value: 0.39, impact: "low" }
];

export const segments = [
  { name: "Loyal Champions", value: 31, color: "#8dcdf8", detail: "Long tenure, high value" },
  { name: "At-Risk Premium", value: 18, color: "#f5a7c7", detail: "High spend, high churn" },
  { name: "New Explorers", value: 27, color: "#b8dfff", detail: "Low tenure, developing" },
  { name: "Value Seekers", value: 24, color: "#ffd6e8", detail: "Price-sensitive users" }
];

export const modelMetrics = [
  { model: "XGBoost", accuracy: 87.4, precision: 84.8, recall: 81.9, f1: 83.3, auc: 91.6 },
  { model: "Random Forest", accuracy: 84.9, precision: 82.3, recall: 77.8, f1: 79.9, auc: 88.7 },
  { model: "Gradient Boost", accuracy: 83.7, precision: 80.1, recall: 78.4, f1: 79.2, auc: 87.9 },
  { model: "Logistic Reg.", accuracy: 80.6, precision: 76.5, recall: 74.2, f1: 75.3, auc: 84.3 }
];

export const rocData = Array.from({ length: 11 }, (_, i) => {
  const x = i / 10;
  return { fpr: x, xgb: Math.min(1, Math.pow(x, 0.28)), rf: Math.min(1, Math.pow(x, 0.36)), baseline: x };
});

export const customers: Customer[] = [
  { customer_id: "CF-10482", gender: "Female", senior_citizen: 0, tenure: 2, contract: "Month-to-month", payment_method: "Electronic check", monthly_charges: 96.7, total_charges: 193.4, internet_service: "Fiber optic", tech_support: "No", churn_probability: 0.94, risk_level: "Critical" },
  { customer_id: "CF-10319", gender: "Male", senior_citizen: 1, tenure: 8, contract: "Month-to-month", payment_method: "Electronic check", monthly_charges: 88.2, total_charges: 705.6, internet_service: "Fiber optic", tech_support: "No", churn_probability: 0.87, risk_level: "Critical" },
  { customer_id: "CF-10991", gender: "Female", senior_citizen: 0, tenure: 14, contract: "Month-to-month", payment_method: "Mailed check", monthly_charges: 79.5, total_charges: 1113, internet_service: "Fiber optic", tech_support: "No", churn_probability: 0.78, risk_level: "High" },
  { customer_id: "CF-10172", gender: "Male", senior_citizen: 0, tenure: 23, contract: "One year", payment_method: "Credit card", monthly_charges: 74.1, total_charges: 1704.3, internet_service: "DSL", tech_support: "Yes", churn_probability: 0.52, risk_level: "Medium" },
  { customer_id: "CF-10834", gender: "Female", senior_citizen: 0, tenure: 48, contract: "Two year", payment_method: "Bank transfer", monthly_charges: 61.4, total_charges: 2947.2, internet_service: "DSL", tech_support: "Yes", churn_probability: 0.12, risk_level: "Low" },
  { customer_id: "CF-10627", gender: "Male", senior_citizen: 0, tenure: 67, contract: "Two year", payment_method: "Credit card", monthly_charges: 105.2, total_charges: 7048.4, internet_service: "Fiber optic", tech_support: "Yes", churn_probability: 0.08, risk_level: "Low" }
];

export const predictionDefaults: PredictionInput = {
  gender: "Female",
  senior_citizen: 0,
  tenure: 8,
  contract: "Month-to-month",
  payment_method: "Electronic check",
  monthly_charges: 89.5,
  total_charges: 716,
  internet_service: "Fiber optic",
  tech_support: "No",
  online_security: "No",
  paperless_billing: "Yes"
};
