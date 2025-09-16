export default function PredictionResult({ result }) {
  if (!result) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <span className="text-2xl">📊</span>
        </div>
        <h4 className="text-lg font-semibold text-gray-600 mb-2">Ready to Predict</h4>
        <p className="text-gray-500 text-sm">Enter market indicators to get your prediction</p>
      </div>
    );
  }

  const isUp = result.prediction === "Up" || result.trend_prediction === "Up";
  const prob = typeof result.prob_up === "number" ? result.prob_up : result.probability;
  const confidence = typeof prob === "number" ? (prob * 100).toFixed(1) : "N/A";

  return (
    <div className="text-center">
      {/* Prediction Badge */}
      <div className={`inline-flex items-center px-6 py-3 rounded-full text-lg font-bold mb-6 ${
        isUp 
          ? 'bg-green-100 text-green-800 border-2 border-green-200' 
          : 'bg-red-100 text-red-800 border-2 border-red-200'
      }`}>
        <span className="text-2xl mr-3">{isUp ? "📈" : "📉"}</span>
        <span>Market Trend: {isUp ? "UP" : "DOWN"}</span>
      </div>

      {/* Confidence Score */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h5 className="text-sm font-semibold text-gray-600 mb-2">Confidence Score</h5>
        <div className="text-3xl font-bold text-gray-800 mb-2">
          {confidence}%
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              isUp ? 'bg-green-500' : 'bg-red-500'
            }`}
            style={{ width: `${confidence}%` }}
          ></div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="text-sm text-gray-600">
        <p className="mb-2">
          <span className="font-semibold">Prediction:</span> {isUp ? "Bullish" : "Bearish"} market sentiment
        </p>
        <p className="text-xs text-gray-500">
          Based on technical analysis of SMA, RSI, and daily returns
        </p>
      </div>
    </div>
  );
}
