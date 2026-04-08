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

  const backgroundColors = values.map((_, i) => {
    const lightness = 17 + i * 8;
    return `hsl(0, 0%, ${Math.min(lightness, 70)}%)`;
  });

  const data = {
    labels,
    datasets: [
      {
        label: "Importance Score",
        data: values,
        backgroundColor: backgroundColors,
        borderWidth: 0,
        borderRadius: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    indexAxis: "y",
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
        ticks: { callback: (v) => `${(v * 100).toFixed(0)}%`, color: "#888888", font: { size: 11 } },
        grid: { color: "#eeeeee" },
        border: { display: false },
      },
      y: {
        grid: { display: false },
        ticks: { color: "#555555", font: { size: 11 } },
        border: { display: false },
      },
    },
  };

  return (
    <div>
      <Bar data={data} options={options} />
    </div>
  );
}
