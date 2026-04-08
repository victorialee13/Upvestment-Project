export default function PredictionResult({ result, indicators }) {
  if (!result) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 mx-auto mb-5 bg-blue-50 rounded-full flex items-center justify-center">
          <span className="text-4xl">📊</span>
        </div>
        <h4 className="text-lg font-semibold text-gray-600 mb-2 font-body">Ready to Predict</h4>
        <p className="text-gray-400 text-sm font-body">
          Click "Predict Today" to fetch live SPY data and run the model.
        </p>
      </div>
    );
  }

  const isUp = result.prediction === "Up";
  const confidence = typeof result.prob_up === "number" ? (result.prob_up * 100).toFixed(1) : "N/A";

  return (
    <div className="text-center">
      {/* Prediction Badge */}
      <div className={`inline-flex items-center px-8 py-4 rounded-full text-xl font-bold mb-6 font-display ${
        isUp
          ? "bg-green-100 text-green-800 border-2 border-green-300"
          : "bg-red-100 text-red-800 border-2 border-red-300"
      }`}>
        <span className="text-3xl mr-3">{isUp ? "📈" : "📉"}</span>
        Market Trend: {isUp ? "UP" : "DOWN"}
      </div>

      {/* Confidence */}
      <div className="bg-gray-50 rounded-lg p-5 mb-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 font-body">Confidence</p>
        <p className="text-4xl font-bold text-gray-800 mb-3 font-display">{confidence}%</p>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full transition-all duration-700 ${isUp ? "bg-green-500" : "bg-red-500"}`}
            style={{ width: `${confidence}%` }}
          />
        </div>
      </div>

      {/* Sentiment */}
      <p className="text-sm text-gray-600 font-body mb-1">
        <span className="font-semibold">{isUp ? "Bullish" : "Bearish"}</span> market sentiment
      </p>
      <p className="text-xs text-gray-400 font-body">Based on SMA, RSI, and daily return signals</p>

      {/* Indicators used */}
      {indicators && (
        <div className="mt-5 border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 font-body">
            Indicators used &mdash; SPY as of {indicators.as_of}
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {[
              { label: "SMA 10", value: indicators.sma_10?.toFixed(2) },
              { label: "SMA 50", value: indicators.sma_50?.toFixed(2) },
              { label: "Daily Return", value: indicators.daily_return != null ? `${(indicators.daily_return * 100).toFixed(3)}%` : "—" },
              { label: "RSI", value: indicators.rsi?.toFixed(1) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-lg px-3 py-2">
                <p className="text-xs text-gray-400 font-body">{label}</p>
                <p className="font-semibold text-gray-700 font-body">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
