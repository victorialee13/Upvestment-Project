// Create API service for UPvestment
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function handleResponse(resp) {
  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    throw new Error(`API error ${resp.status}: ${errText}`);
  }
  return resp.json();
}

export async function predictTrend(payload) {
  const resp = await fetch(`${API_BASE_URL}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(resp);
}

export async function fetchLiveIndicators() {
  const resp = await fetch(`${API_BASE_URL}/live-indicators`);
  return handleResponse(resp);
}

export async function fetchFeatureImportance() {
  const resp = await fetch(`${API_BASE_URL}/feature-importance`);
  return handleResponse(resp);
}

export async function fetchBacktest(days = 30) {
  const resp = await fetch(`${API_BASE_URL}/backtest?days=${days}`);
  return handleResponse(resp);
}
