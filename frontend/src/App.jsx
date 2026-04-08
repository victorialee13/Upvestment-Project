import { useState, useEffect } from "react";
import InputForm from "./components/InputForm";
import PredictionResult from "./components/PredictionResult";
import Charts from "./components/Charts";
import { predictTrend, fetchLiveIndicators, fetchFeatureImportance } from "./services/api";

function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveData, setLiveData] = useState(null);
  const [featureImportance, setFeatureImportance] = useState(null);
  const [advancedMode, setAdvancedMode] = useState(false);

  useEffect(() => {
    fetchFeatureImportance()
      .then(setFeatureImportance)
      .catch(() => {});
  }, []);

  // One-click: fetch live data then immediately predict
  const handlePredictLive = async () => {
    setLoading(true);
    setLiveLoading(true);
    setError(null);
    try {
      const live = await fetchLiveIndicators();
      setLiveData(live);
      const prediction = await predictTrend({
        sma_10_ratio: live.sma_10_ratio,
        sma_50_ratio: live.sma_50_ratio,
        daily_return: live.daily_return,
        rsi: live.rsi,
        macd_pct: live.macd_pct,
        macd_signal_pct: live.macd_signal_pct,
        bb_width: live.bb_width,
        volatility_20: live.volatility_20,
        momentum_5: live.momentum_5,
      });
      setResult(prediction);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLiveLoading(false);
    }
  };

  // Manual form submission (Advanced Mode)
  const handlePredict = async (payload) => {
    setLoading(true);
    setError(null);
    setLiveData(null); // manual input — don't show live indicator panel
    try {
      const data = await predictTrend(payload);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Used by InputForm's "Use Live Data" button
  const handleLoadLive = async () => {
    setLiveLoading(true);
    setError(null);
    try {
      const data = await fetchLiveIndicators();
      setLiveData(data);
      return data;
    } catch (err) {
      setError(`Could not fetch live data: ${err.message}`);
      return null;
    } finally {
      setLiveLoading(false);
    }
  };

  const scrollToPredictor = () => {
    document.getElementById("predictor-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gray-50 font-body">
      {/* Hero */}
      <section
        className="text-white py-20"
        style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)" }}
      >
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4 font-display">UPvestment</h1>
          <h2 className="text-2xl font-semibold mb-4 font-display">AI-Powered S&P 500 Predictor</h2>
          <p className="text-xl mb-8 opacity-90 font-body leading-relaxed">
            Leverage machine learning to analyze live market signals and predict short-term S&P 500 trends.
          </p>
          <button
            onClick={scrollToPredictor}
            className="bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors font-body"
          >
            Try Prediction
          </button>
        </div>
      </section>

      {/* Prediction Section */}
      <section id="predictor-section" className="py-16">
        <div className="max-w-2xl mx-auto px-4">

          {/* Main prediction card */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-2 text-center font-display">
              Today's S&P 500 Prediction
            </h3>
            <p className="text-sm text-gray-400 text-center mb-6 font-body">
              Uses live SPY data from Yahoo Finance
            </p>

            {/* Primary action */}
            <button
              onClick={handlePredictLive}
              disabled={loading}
              className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all font-display mb-6 ${
                loading
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-accent hover:bg-green-700 text-white shadow-md hover:shadow-lg"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                  {liveLoading ? "Fetching live data..." : "Analyzing..."}
                </span>
              ) : result ? (
                "Refresh Prediction"
              ) : (
                "Predict Today"
              )}
            </button>

            {/* Error */}
            {error && (
              <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-body">
                {error}
              </div>
            )}

            {/* Result */}
            <PredictionResult result={result} indicators={liveData} />
          </div>

          {/* Advanced Mode toggle */}
          <div className="mt-4 text-center">
            <button
              onClick={() => setAdvancedMode((v) => !v)}
              className="text-sm text-gray-400 hover:text-gray-600 font-body underline underline-offset-2 transition-colors"
            >
              {advancedMode ? "Hide Advanced Mode" : "Advanced Mode — enter indicators manually"}
            </button>
          </div>

          {/* Advanced Mode form */}
          {advancedMode && (
            <div className="bg-white rounded-xl shadow-lg p-8 mt-4">
              <h3 className="text-xl font-bold text-gray-800 mb-5 text-center font-display">
                Manual Indicators
              </h3>
              <InputForm
                onSubmit={handlePredict}
                loading={loading}
                onLoadLive={handleLoadLive}
                liveLoading={liveLoading}
                liveData={liveData}
              />
            </div>
          )}
        </div>
      </section>

      {/* Feature Analysis */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <h3 className="text-3xl font-bold text-center text-gray-800 mb-10 font-display">
            Feature Analysis
          </h3>
          <div className="bg-white rounded-xl shadow-lg p-8">
            <Charts featureImportance={featureImportance} />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold text-gray-800 mb-10 font-display">How It Works</h3>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: 1, title: "Data Collection", desc: "Live SPY data from Yahoo Finance" },
              { step: 2, title: "Feature Engineering", desc: "SMA, RSI, and daily returns" },
              { step: 3, title: "ML Model", desc: "RandomForest classifier" },
              { step: 4, title: "Prediction", desc: "Next-day trend with confidence" },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: "#1e3a8a" }}
                >
                  <span className="text-white font-bold text-xl">{step}</span>
                </div>
                <h4 className="font-semibold text-gray-800 mb-2 font-body">{title}</h4>
                <p className="text-gray-600 text-sm font-body">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-gray-400 mb-2 font-body">
            <strong>Disclaimer:</strong> For educational purposes only. Not financial advice.
          </p>
          <p className="text-gray-500 text-sm font-body">
            © 2025 UPvestment. Built with React, FastAPI, and Machine Learning.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
