import { useState } from "react";
import InputForm from "./components/InputForm";
import PredictionResult from "./components/PredictionResult";
import Charts from "./components/Charts";
import { predictTrend } from "./services/api";

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

  const scrollToPredictor = () => {
    document.getElementById('predictor-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 font-body">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-blue-800 text-white py-20" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem', textAlign: 'center' }}>
          <h1 className="text-5xl font-bold mb-6 font-display">
            UPvestment
          </h1>
          <h2 className="text-2xl font-semibold mb-4 font-display">
            AI-Powered S&P 500 Predictor
          </h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto opacity-90 font-body leading-relaxed">
            Leverage machine learning to analyze market signals and predict short-term trends with advanced technical indicators.
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem' }}>
          <div className="max-w-6xl mx-auto" style={{ maxWidth: '1152px', margin: '0 auto' }}>
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Input Form Card */}
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center font-display">Market Indicators</h3>
                <InputForm onSubmit={handlePredict} loading={loading} />
                {error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    Error: {error}
                  </div>
                )}
              </div>

              {/* Prediction Result Card */}
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center font-display">Prediction Result</h3>
                <PredictionResult result={result} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visualization Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem' }}>
          <div className="max-w-6xl mx-auto" style={{ maxWidth: '1152px', margin: '0 auto' }}>
            <h3 className="text-3xl font-bold text-center text-gray-800 mb-12 font-display">
              Feature Analysis
            </h3>
            <div className="bg-white rounded-xl shadow-lg p-8">
              <Charts featureImportance={null} />
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem' }}>
          <div className="max-w-4xl mx-auto text-center" style={{ maxWidth: '896px', margin: '0 auto', textAlign: 'center' }}>
            <h3 className="text-3xl font-bold text-gray-800 mb-8 font-display">How It Works</h3>
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">1</span>
                </div>
                <h4 className="font-semibold text-gray-800 mb-2 font-body">Data Collection</h4>
                <p className="text-gray-600 text-sm font-body">S&P 500 historical data from Kaggle</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">2</span>
                </div>
                <h4 className="font-semibold text-gray-800 mb-2 font-body">Feature Engineering</h4>
                <p className="text-gray-600 text-sm font-body">SMA, RSI, and daily returns</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">3</span>
                </div>
                <h4 className="font-semibold text-gray-800 mb-2 font-body">ML Training</h4>
                <p className="text-gray-600 text-sm font-body">RandomForest classifier</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">4</span>
                </div>
                <h4 className="font-semibold text-gray-800 mb-2 font-body">Prediction</h4>
                <p className="text-gray-600 text-sm font-body">Real-time trend analysis</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem', textAlign: 'center' }}>
          <p className="text-gray-400 mb-4 font-body">
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

export default App
