export default function PredictionResult({ result }) {
  if (!result) return null;
  const isUp = result.prediction === "Up" || result.trend_prediction === "Up";
  const prob = typeof result.prob_up === "number" ? result.prob_up : result.probability;
  const color = isUp ? "#16a34a" : "#dc2626";
  const icon = isUp ? "📈" : "📉";
  return (
    <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: "#fff", boxShadow: "0 4px 18px rgba(0,0,0,.06)" }}>
      <div style={{ fontSize: 18, fontWeight: 700, color }}>
        {icon} {isUp ? "Up" : "Down"}
      </div>
      {typeof prob === "number" && (
        <div style={{ marginTop: 6, color: "#555" }}>Probability Up: {(prob * 100).toFixed(2)}%</div>
      )}
    </div>
  );
}
