import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Map internal feature names to human-readable labels
const FEATURE_LABELS = {
  sma_10_ratio: "Price vs SMA-10",
  sma_50_ratio: "Price vs SMA-50",
  daily_return: "Daily Return",
  rsi: "RSI-14",
  macd_pct: "MACD",
  macd_signal_pct: "MACD Signal",
  bb_width: "Bollinger Width",
  volatility_20: "20d Volatility",
  momentum_5: "5d Momentum",
  // legacy names (fallback)
  sma_10: "SMA-10",
  sma_50: "SMA-50",
};

export default function Charts({ featureImportance }) {
  const rawFeatures = featureImportance?.features || ["sma_10_ratio", "sma_50_ratio", "daily_return", "rsi"];
  const rawValues = featureImportance?.importances || [0.25, 0.25, 0.25, 0.25];

  // Sort by importance descending
  const paired = rawFeatures.map((f, i) => ({ feature: f, value: rawValues[i] }));
  paired.sort((a, b) => b.value - a.value);

  const labels = paired.map((p) => FEATURE_LABELS[p.feature] || p.feature);
  const values = paired.map((p) => p.value);

  // Color bars by importance rank
  const backgroundColors = values.map((_, i) => {
    const alpha = 0.9 - i * 0.07;
    return `rgba(30, 58, 138, ${Math.max(alpha, 0.3)})`;
  });

  const data = {
    labels,
    datasets: [
      {
        label: "Importance Score",
        data: values,
        backgroundColor: backgroundColors,
        borderColor: "rgba(30, 58, 138, 0.9)",
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    indexAxis: "y",   // horizontal bars — easier to read with long labels
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${(ctx.raw * 100).toFixed(1)}% importance`,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: { callback: (v) => `${(v * 100).toFixed(0)}%` },
        grid: { color: "rgba(0,0,0,0.05)" },
      },
      y: {
        grid: { display: false },
      },
    },
  };

  return (
    <div>
      <p className="text-sm text-gray-500 text-center mb-4 font-body">
        Which signals matter most to the model's decisions
      </p>
      <Bar data={data} options={options} />
    </div>
  );
}
