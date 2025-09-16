import { useState } from "react";

export default function InputForm({ onSubmit, loading }) {
  const [form, setForm] = useState({ sma_10: "", sma_50: "", daily_return: "", rsi: "" });
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      sma_10: parseFloat(form.sma_10),
      sma_50: parseFloat(form.sma_50),
      daily_return: parseFloat(form.daily_return),
      rsi: parseFloat(form.rsi),
    };
    onSubmit?.(payload);
  };
  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, maxWidth: 480 }}>
      <label>
        SMA 10
        <input name="sma_10" type="number" step="any" required value={form.sma_10} onChange={handleChange} />
      </label>
      <label>
        SMA 50
        <input name="sma_50" type="number" step="any" required value={form.sma_50} onChange={handleChange} />
      </label>
      <label>
        Daily Return (e.g., 0.002)
        <input name="daily_return" type="number" step="any" required value={form.daily_return} onChange={handleChange} />
      </label>
      <label>
        RSI
        <input name="rsi" type="number" step="any" required value={form.rsi} onChange={handleChange} />
      </label>
      <button type="submit" disabled={loading}>
        {loading ? "Predicting..." : "Predict"}
      </button>
    </form>
  );
}
