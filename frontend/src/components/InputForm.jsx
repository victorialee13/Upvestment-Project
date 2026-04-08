import { useState } from "react";

const FIELDS = [
  {
    name: "sma_10",
    label: "SMA 10",
    placeholder: "10-day moving average",
    hint: "Average closing price over the last 10 trading days",
  },
  {
    name: "sma_50",
    label: "SMA 50",
    placeholder: "50-day moving average",
    hint: "Average closing price over the last 50 trading days",
  },
  {
    name: "daily_return",
    label: "Daily Return",
    placeholder: "e.g. 0.002 for +0.2%",
    hint: "Today's price change as a decimal (today − yesterday) / yesterday",
  },
  {
    name: "rsi",
    label: "RSI (Relative Strength Index)",
    placeholder: "0 – 100",
    hint: "Momentum indicator: below 30 = oversold, above 70 = overbought",
  },
];

export default function InputForm({ onSubmit, loading, onLoadLive, liveLoading, liveData }) {
  const [form, setForm] = useState({ sma_10: "", sma_50: "", daily_return: "", rsi: "" });

  // Sync form when live data arrives
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
    const payload = {
      sma_10: parseFloat(form.sma_10),
      sma_50: parseFloat(form.sma_50),
      daily_return: parseFloat(form.daily_return),
      rsi: parseFloat(form.rsi),
    };
    onSubmit?.(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Live Data Button */}
      <button
        type="button"
        onClick={handleLoadLive}
        disabled={liveLoading}
        className={`w-full py-2.5 px-4 rounded-lg font-semibold border-2 transition-colors font-body text-sm ${
          liveLoading
            ? "border-gray-300 text-gray-400 cursor-not-allowed"
            : "border-accent text-accent hover:bg-accent hover:text-white"
        }`}
      >
        {liveLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent mr-2"></div>
            Fetching live SPY data...
          </div>
        ) : (
          "Use Live Data (SPY)"
        )}
      </button>

      {liveData && (
        <p className="text-xs text-center text-gray-500 font-body -mt-2">
          Data as of {liveData.as_of} &mdash; SPY ${liveData.price}
        </p>
      )}

      <div className="border-t border-gray-100 pt-4 space-y-5">
        {FIELDS.map(({ name, label, placeholder, hint }) => (
          <div key={name} className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700 font-body">
              {label}
            </label>
            <input
              name={name}
              type="number"
              step="any"
              required
              value={form[name]}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors font-body"
              placeholder={placeholder}
            />
            <p className="text-xs text-gray-400 font-body">{hint}</p>
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors font-body ${
          loading
            ? "bg-gray-400 cursor-not-allowed text-white"
            : "bg-primary hover:bg-blue-700 text-white"
        }`}
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Predicting...
          </div>
        ) : (
          "Predict Market Trend"
        )}
      </button>
    </form>
  );
}
