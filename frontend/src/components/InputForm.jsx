import { useState } from "react";

const FIELDS = [
  { name: "sma_10", label: "SMA 10", placeholder: "10-day moving average", hint: "Average closing price over the last 10 trading days" },
  { name: "sma_50", label: "SMA 50", placeholder: "50-day moving average", hint: "Average closing price over the last 50 trading days" },
  { name: "daily_return", label: "Daily Return", placeholder: "e.g. 0.002 for +0.2%", hint: "Today's price change as a decimal" },
  { name: "rsi", label: "RSI", placeholder: "0 – 100", hint: "Below 30 = oversold, above 70 = overbought" },
];

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
  const [form, setForm] = useState({ sma_10: "", sma_50: "", daily_return: "", rsi: "" });

  const handleLoadLive = async () => {
    const data = await onLoadLive?.();
    if (data) {
      setForm({
        sma_10: String(data.sma_10),
        sma_50: String(data.sma_50),
        daily_return: String(data.daily_return),
        rsi: String(data.rsi),
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.({
      sma_10: parseFloat(form.sma_10),
      sma_50: parseFloat(form.sma_50),
      daily_return: parseFloat(form.daily_return),
      rsi: parseFloat(form.rsi),
    });
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
