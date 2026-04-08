import { useState, useEffect } from "react";
import InputForm from "./components/InputForm";
import PredictionResult from "./components/PredictionResult";
import Charts from "./components/Charts";
import HistoryChart from "./components/HistoryChart";
import { predictTrend, fetchLiveIndicators, fetchFeatureImportance, fetchBacktest } from "./services/api";

function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveData, setLiveData] = useState(null);
  const [featureImportance, setFeatureImportance] = useState(null);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [backtestData, setBacktestData] = useState(null);
  const [backtestLoading, setBacktestLoading] = useState(true);
  const [backtestError, setBacktestError] = useState(null);

  useEffect(() => {
    fetchFeatureImportance().then(setFeatureImportance).catch(() => {});
    fetchBacktest(30)
      .then(setBacktestData)
      .catch((err) => setBacktestError(err.message))
      .finally(() => setBacktestLoading(false));
  }, []);

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

  const handlePredict = async (payload) => {
    setLoading(true);
    setError(null);
    setLiveData(null);
    try {
      const data = await predictTrend(payload);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div style={{ backgroundColor: "#f7f7f7", minHeight: "100vh", color: "#111111" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "0 24px" }}>

        {/* Header */}
        <header style={{ textAlign: "center", padding: "64px 0 48px" }}>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
            Upvestment
          </h1>
          <p style={{ fontSize: "1rem", color: "#555555", marginTop: "10px", marginBottom: 0 }}>
            S&amp;P 500 Prediction powered by machine learning
          </p>
        </header>

        <hr style={{ border: "none", borderTop: "1px solid #dddddd", margin: "0 0 48px" }} />

        {/* Prediction Tool */}
        <section style={{ marginBottom: "64px" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#555555", marginBottom: "20px" }}>
            Prediction
          </p>

          <div style={{ border: "1px solid #dddddd", borderRadius: "8px", backgroundColor: "#ffffff", padding: "32px" }}>
            <button
              onClick={handlePredictLive}
              disabled={loading}
              style={{
                display: "block",
                width: "100%",
                padding: "14px 32px",
                backgroundColor: loading ? "#999999" : "#111111",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                fontSize: "0.95rem",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                marginBottom: "8px",
              }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <span style={{
                    display: "inline-block", width: "14px", height: "14px",
                    border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff",
                    borderRadius: "50%", animation: "spin 0.7s linear infinite"
                  }} />
                  {liveLoading ? "Fetching live data..." : "Analyzing..."}
                </span>
              ) : result ? "Refresh Prediction" : "Predict Today"}
            </button>

            <p style={{ fontSize: "0.75rem", color: "#888888", textAlign: "center", margin: "0 0 24px" }}>
              Fetches live SPY data - takes 2–4 seconds
            </p>

            {error && (
              <div style={{ padding: "12px 16px", border: "1px solid #dddddd", borderRadius: "6px", fontSize: "0.85rem", color: "#555555", marginBottom: "20px" }}>
                Error: {error}
              </div>
            )}

            <PredictionResult result={result} indicators={liveData} />
          </div>

          <div style={{ marginTop: "12px", textAlign: "center" }}>
            <button
              onClick={() => setAdvancedMode((v) => !v)}
              style={{ background: "none", border: "none", fontSize: "0.8rem", color: "#888888", cursor: "pointer", textDecoration: "underline" }}
            >
              {advancedMode ? "Hide manual entry" : "Enter indicators manually"}
            </button>
          </div>

          {advancedMode && (
            <div style={{ border: "1px solid #dddddd", borderRadius: "8px", backgroundColor: "#ffffff", padding: "32px", marginTop: "12px" }}>
              <p style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#555555", marginBottom: "20px" }}>
                Manual Indicators
              </p>
              <InputForm
                onSubmit={handlePredict}
                loading={loading}
                onLoadLive={handleLoadLive}
                liveLoading={liveLoading}
                liveData={liveData}
              />
            </div>
          )}
        </section>

        <hr style={{ border: "none", borderTop: "1px solid #dddddd", margin: "0 0 48px" }} />

        {/* Performance */}
        <section style={{ marginBottom: "64px" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#555555", marginBottom: "6px" }}>
            Model Performance
          </p>
          <p style={{ fontSize: "0.85rem", color: "#888888", marginBottom: "20px" }}>
            Backtested on the last 30 trading days of SPY data
          </p>
          <div style={{ border: "1px solid #dddddd", borderRadius: "8px", backgroundColor: "#ffffff", padding: "24px" }}>
            <HistoryChart data={backtestData} loading={backtestLoading} error={backtestError} />
          </div>
        </section>

        <hr style={{ border: "none", borderTop: "1px solid #dddddd", margin: "0 0 48px" }} />

        {/* Feature Analysis */}
        <section style={{ marginBottom: "64px" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#555555", marginBottom: "6px" }}>
            Feature Analysis
          </p>
          <p style={{ fontSize: "0.85rem", color: "#888888", marginBottom: "20px" }}>
            Which indicators influence the model most
          </p>
          <div style={{ border: "1px solid #dddddd", borderRadius: "8px", backgroundColor: "#ffffff", padding: "24px" }}>
            <Charts featureImportance={featureImportance} />
          </div>
        </section>

        <hr style={{ border: "none", borderTop: "1px solid #dddddd", margin: "0 0 48px" }} />

        {/* How It Works */}
        <section style={{ marginBottom: "64px" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#555555", marginBottom: "20px" }}>
            How It Works
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
            {[
              { step: "01", title: "Data", desc: "Live SPY from Yahoo Finance" },
              { step: "02", title: "Indicators", desc: "SMA, RSI, MACD, Bollinger" },
              { step: "03", title: "Model", desc: "RandomForest classifier" },
              { step: "04", title: "Prediction", desc: "Trend + confidence score" },
            ].map(({ step, title, desc }) => (
              <div key={step} style={{ border: "1px solid #dddddd", borderRadius: "8px", padding: "16px", backgroundColor: "#ffffff" }}>
                <p style={{ fontSize: "0.7rem", color: "#aaaaaa", margin: "0 0 6px", fontWeight: 500 }}>{step}</p>
                <p style={{ fontSize: "0.85rem", fontWeight: 600, margin: "0 0 4px" }}>{title}</p>
                <p style={{ fontSize: "0.75rem", color: "#888888", margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer style={{ borderTop: "1px solid #dddddd", padding: "32px 0", textAlign: "center" }}>
          <p style={{ fontSize: "0.75rem", color: "#888888", margin: 0 }}>
            For educational purposes only · Not financial advice · © 2025 Upvestment
          </p>
        </footer>

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default App;
