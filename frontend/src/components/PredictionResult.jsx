function buildSignals(indicators) {
  if (!indicators) return [];
  const signals = [];

  if (indicators.rsi != null) {
    if (indicators.rsi < 30) signals.push({ label: "RSI", value: `${indicators.rsi.toFixed(1)} — oversold` });
    else if (indicators.rsi > 70) signals.push({ label: "RSI", value: `${indicators.rsi.toFixed(1)} — overbought` });
    else signals.push({ label: "RSI", value: `${indicators.rsi.toFixed(1)} — neutral` });
  }

  if (indicators.sma_10 && indicators.sma_50) {
    const cross = indicators.sma_10 > indicators.sma_50;
    signals.push({ label: "SMA Cross", value: cross ? "Bullish (10 > 50)" : "Bearish (10 < 50)" });
  }

  if (indicators.daily_return != null) {
    const pct = (indicators.daily_return * 100).toFixed(2);
    signals.push({ label: "Today's Move", value: `${pct > 0 ? "+" : ""}${pct}%` });
  }

  if (indicators.momentum_5 != null) {
    const pct = (indicators.momentum_5 * 100).toFixed(2);
    signals.push({ label: "5d Momentum", value: `${pct > 0 ? "+" : ""}${pct}%` });
  }

  return signals;
}

const rowStyle = {
  display: "flex",
  justifyContent: "space-between",
  padding: "8px 0",
  borderBottom: "1px solid #eeeeee",
  fontSize: "0.85rem",
};

export default function PredictionResult({ result, indicators }) {
  if (!result) {
    return (
      <div style={{ textAlign: "center", padding: "32px 0", color: "#888888", fontSize: "0.9rem" }}>
        Run a prediction to see results.
      </div>
    );
  }

  const isUp = result.prediction === "Up";
  const confidence = typeof result.prob_up === "number" ? (result.prob_up * 100).toFixed(1) : null;
  const signals = buildSignals(indicators);

  return (
    <div>
      {/* Result */}
      <div style={{ textAlign: "center", padding: "24px 0 20px", borderBottom: "1px solid #eeeeee", marginBottom: "20px" }}>
        <p style={{ fontSize: "2.5rem", fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.02em" }}>
          {isUp ? "↑ UP" : "↓ DOWN"}
        </p>
        <p style={{ fontSize: "0.8rem", color: "#888888", margin: 0 }}>
          {isUp ? "Bullish signal" : "Bearish signal"} · educational use only
        </p>
      </div>

      {/* Confidence */}
      {confidence && (
        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#555555", marginBottom: "6px" }}>
            <span>Model confidence</span>
            <span style={{ fontWeight: 600, color: "#111111" }}>{confidence}%</span>
          </div>
          <div style={{ height: "4px", backgroundColor: "#eeeeee", borderRadius: "2px" }}>
            <div style={{ height: "4px", backgroundColor: "#111111", borderRadius: "2px", width: `${confidence}%`, transition: "width 0.6s ease" }} />
          </div>
        </div>
      )}

      {/* Signal breakdown */}
      {signals.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#888888", marginBottom: "8px" }}>
            Signals
          </p>
          {signals.map((s) => (
            <div key={s.label} style={rowStyle}>
              <span style={{ color: "#555555" }}>{s.label}</span>
              <span style={{ fontWeight: 500 }}>{s.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Live indicators grid */}
      {indicators && (
        <div>
          <p style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#888888", margin: "0 0 10px" }}>
            Live data — SPY ${indicators.price} as of {indicators.as_of}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {[
              { label: "SMA 10", value: indicators.sma_10?.toFixed(2) },
              { label: "SMA 50", value: indicators.sma_50?.toFixed(2) },
              { label: "Daily Return", value: `${(indicators.daily_return * 100).toFixed(3)}%` },
              { label: "RSI", value: indicators.rsi?.toFixed(1) },
              { label: "BB Width", value: `${(indicators.bb_width * 100).toFixed(2)}%` },
              { label: "Volatility", value: `${(indicators.volatility_20 * 100).toFixed(2)}%` },
            ].map(({ label, value }) => (
              <div key={label} style={{ border: "1px solid #eeeeee", borderRadius: "6px", padding: "10px 12px" }}>
                <p style={{ fontSize: "0.7rem", color: "#888888", margin: "0 0 2px" }}>{label}</p>
                <p style={{ fontSize: "0.9rem", fontWeight: 600, margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
