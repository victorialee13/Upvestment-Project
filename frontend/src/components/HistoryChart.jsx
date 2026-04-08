export default function HistoryChart({ data, loading, error }) {
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "32px 0", fontSize: "0.85rem", color: "#888888" }}>
        Loading backtest data...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "24px 0", fontSize: "0.85rem", color: "#555555" }}>
        {error}
      </div>
    );
  }

  if (!data) return null;

  const { results, accuracy, correct, total } = data;
  const accuracyPct = (accuracy * 100).toFixed(1);

  return (
    <div>
      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "30-Day Accuracy", value: `${accuracyPct}%` },
          { label: "Correct", value: correct },
          { label: "Total Days", value: total },
        ].map(({ label, value }) => (
          <div key={label} style={{ border: "1px solid #dddddd", borderRadius: "6px", padding: "16px", textAlign: "center" }}>
            <p style={{ fontSize: "0.7rem", color: "#888888", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
              {label}
            </p>
            <p style={{ fontSize: "1.6rem", fontWeight: 700, margin: 0 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ border: "1px solid #dddddd", borderRadius: "6px", overflow: "hidden" }}>
        <div style={{ maxHeight: "280px", overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #dddddd", backgroundColor: "#f7f7f7" }}>
                {["Date", "Price", "Predicted", "Actual", "Result"].map((h, i) => (
                  <th key={h} style={{
                    padding: "10px 12px",
                    textAlign: i === 0 ? "left" : "center",
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    color: "#555555",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...results].reverse().map((row, i) => (
                <tr key={row.date} style={{ borderBottom: "1px solid #eeeeee", backgroundColor: i % 2 === 0 ? "#ffffff" : "#fafafa" }}>
                  <td style={{ padding: "9px 12px", color: "#555555" }}>{row.date}</td>
                  <td style={{ padding: "9px 12px", textAlign: "center", fontWeight: 500 }}>${row.price}</td>
                  <td style={{ padding: "9px 12px", textAlign: "center" }}>
                    {row.prediction === "Up" ? "↑ Up" : "↓ Down"}
                  </td>
                  <td style={{ padding: "9px 12px", textAlign: "center", color: "#555555" }}>
                    {row.actual === "Up" ? "↑ Up" : "↓ Down"}
                  </td>
                  <td style={{ padding: "9px 12px", textAlign: "center", fontWeight: 600 }}>
                    {row.correct ? "✓" : "✗"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p style={{ fontSize: "0.72rem", color: "#aaaaaa", marginTop: "10px", textAlign: "center" }}>
        Model run on historical SPY data. Not forward-looking.
      </p>
    </div>
  );
}
