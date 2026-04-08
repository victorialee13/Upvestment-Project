import { useState } from "react";

const FIELDS = [
  { name: "sma_10_ratio", label: "SMA 10 Ratio", placeholder: "e.g. 0.003", hint: "Price deviation from 10-day SMA: (close / sma_10) − 1" },
  { name: "sma_50_ratio", label: "SMA 50 Ratio", placeholder: "e.g. 0.012", hint: "Price deviation from 50-day SMA: (close / sma_50) − 1" },
  { name: "daily_return", label: "Daily Return", placeholder: "e.g. 0.0031", hint: "Today's price change as a decimal: (today − yesterday) / yesterday" },
  { name: "rsi", label: "RSI", placeholder: "0 – 100", hint: "14-day Relative Strength Index. Below 30 = oversold, above 70 = overbought" },
  { name: "macd_pct", label: "MACD %", placeholder: "e.g. -0.0001", hint: "MACD line as a fraction of price: macd / close" },
  { name: "macd_signal_pct", label: "MACD Signal %", placeholder: "e.g. -0.00008", hint: "MACD signal line as a fraction of price: macd_signal / close" },
  { name: "bb_width", label: "Bollinger Band Width", placeholder: "e.g. 0.045", hint: "Bollinger Band width normalised by mid band: (upper − lower) / mid" },
  { name: "volatility_20", label: "20d Volatility", placeholder: "e.g. 0.009", hint: "20-day rolling standard deviation of daily returns" },
  { name: "momentum_5", label: "5d Momentum", placeholder: "e.g. 0.018", hint: "5-day price momentum: (close − close_5d_ago) / close_5d_ago" },
];

const EMPTY_FORM = Object.fromEntries(FIELDS.map((f) => [f.name, ""]));

const inputStyle = {
  display: "block",
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #dddddd",
  borderRadius: "6px",
  fontSize: "0.9rem",
  color: "#111111",
  backgroundColor: "#f7f7f7",
  outline: "none",
  boxSizing: "border-box",
};

export default function InputForm({ onSubmit, loading, onLoadLive, liveLoading, liveData }) {
  const [form, setForm] = useState(EMPTY_FORM);

  const handleLoadLive = async () => {
    const data = await onLoadLive?.();
    if (data) {
      setForm({
        sma_10_ratio: String(data.sma_10_ratio ?? ""),
        sma_50_ratio: String(data.sma_50_ratio ?? ""),
        daily_return: String(data.daily_return ?? ""),
        rsi: String(data.rsi ?? ""),
        macd_pct: String(data.macd_pct ?? ""),
        macd_signal_pct: String(data.macd_signal_pct ?? ""),
        bb_width: String(data.bb_width ?? ""),
        volatility_20: String(data.volatility_20 ?? ""),
        momentum_5: String(data.momentum_5 ?? ""),
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(Object.fromEntries(FIELDS.map((f) => [f.name, parseFloat(form[f.name])])));
  };

  return (
    <form onSubmit={handleSubmit}>
      <button
        type="button"
        onClick={handleLoadLive}
        disabled={liveLoading}
        style={{
          display: "block",
          width: "100%",
          padding: "10px",
          border: "1px solid #dddddd",
          borderRadius: "6px",
          backgroundColor: "#ffffff",
          fontSize: "0.85rem",
          color: liveLoading ? "#aaaaaa" : "#111111",
          cursor: liveLoading ? "not-allowed" : "pointer",
          marginBottom: "8px",
        }}
      >
        {liveLoading ? "Fetching..." : "Use Live SPY Data"}
      </button>

      {liveData && (
        <p style={{ fontSize: "0.75rem", color: "#888888", textAlign: "center", marginBottom: "16px" }}>
          Data as of {liveData.as_of} · SPY ${liveData.price}
        </p>
      )}

      <div style={{ borderTop: "1px solid #eeeeee", paddingTop: "20px", display: "flex", flexDirection: "column", gap: "16px", marginBottom: "20px" }}>
        {FIELDS.map(({ name, label, placeholder, hint }) => (
          <div key={name}>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#111111", marginBottom: "6px" }}>
              {label}
            </label>
            <input
              name={name}
              type="number"
              step="any"
              required
              value={form[name]}
              onChange={handleChange}
              placeholder={placeholder}
              style={inputStyle}
            />
            <p style={{ fontSize: "0.72rem", color: "#888888", margin: "4px 0 0" }}>{hint}</p>
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          display: "block",
          width: "100%",
          padding: "12px",
          backgroundColor: loading ? "#999999" : "#111111",
          color: "#ffffff",
          border: "none",
          borderRadius: "6px",
          fontSize: "0.9rem",
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Predicting..." : "Predict Market Trend"}
      </button>
    </form>
  );
}
