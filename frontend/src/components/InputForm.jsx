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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700 font-body">
          SMA 10
        </label>
        <input 
          name="sma_10" 
          type="number" 
          step="any" 
          required 
          value={form.sma_10} 
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors font-body"
          placeholder="Enter 10-day moving average"
        />
      </div>
      
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700 font-body">
          SMA 50
        </label>
        <input 
          name="sma_50" 
          type="number" 
          step="any" 
          required 
          value={form.sma_50} 
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors font-body"
          placeholder="Enter 50-day moving average"
        />
      </div>
      
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700 font-body">
          Daily Return
        </label>
        <input 
          name="daily_return" 
          type="number" 
          step="any" 
          required 
          value={form.daily_return} 
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors font-body"
          placeholder="e.g., 0.002 for 0.2%"
        />
        <p className="text-xs text-gray-500 font-body">Enter as decimal (0.002 = 0.2%)</p>
      </div>
      
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700 font-body">
          RSI (Relative Strength Index)
        </label>
        <input 
          name="rsi" 
          type="number" 
          step="any" 
          required 
          value={form.rsi} 
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors font-body"
          placeholder="Enter RSI value (0-100)"
        />
      </div>
      
      <button 
        type="submit" 
        disabled={loading}
        className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors font-body ${
          loading 
            ? 'bg-gray-400 cursor-not-allowed text-white' 
            : 'bg-primary hover:bg-blue-700 text-white'
        }`}
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Predicting...
          </div>
        ) : (
          'Predict Market Trend'
        )}
      </button>
    </form>
  );
}
