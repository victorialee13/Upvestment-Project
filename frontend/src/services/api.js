// Create API service for UPvestment
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export async function predictTrend(payload) {
  const resp = await fetch(`${API_BASE_URL}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    throw new Error(`API error ${resp.status}: ${errText}`);
  }
  return resp.json();
}
