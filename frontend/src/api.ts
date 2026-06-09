import type { PredictionInput, PredictionResult } from "./types";

const API = import.meta.env.VITE_API_URL || "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${path}`, options);
  if (!response.ok) throw new Error(`API request failed: ${response.status}`);
  return response.json() as Promise<T>;
}

export const api = {
  health: () => request<{ status: string }>("/health"),
  dashboard: () => request<Record<string, unknown>>("/dashboard"),
  customers: () => request<{ customers: unknown[] }>("/customers"),
  predict: (input: PredictionInput) =>
    request<PredictionResult>("/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    }),
  batchPredict: (file: File) => {
    const body = new FormData();
    body.append("file", file);
    return request<{ predictions: unknown[] }>("/predict/batch", { method: "POST", body });
  }
};
