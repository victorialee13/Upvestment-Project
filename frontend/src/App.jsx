import { useState } from "react";
import InputForm from "./components/InputForm";
import PredictionResult from "./components/PredictionResult";
import Charts from "./components/Charts";
import { predictTrend } from "./services/api";
import "./App.css";

function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePredict = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const data = await predictTrend(payload);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header style={{ padding: "2rem 1rem", textAlign: "center" }}>
        <h1>UPvestment - S&P 500 Trend Predictor</h1>
        <p>Enter market indicators to predict short-term trends</p>
      </header>
      <main style={{ maxWidth: 800, margin: "0 auto", padding: "0 1rem" }}>
        <InputForm onSubmit={handlePredict} loading={loading} />
        {error && (
          <div style={{ marginTop: 16, padding: 12, background: "#fef2f2", color: "#dc2626", borderRadius: 8 }}>
            Error: {error}
          </div>
        )}
        <PredictionResult result={result} />
        <Charts featureImportance={null} />
      </main>
    </div>
  );
}

export default App
