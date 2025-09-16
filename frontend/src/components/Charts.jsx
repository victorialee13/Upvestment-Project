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

export default function Charts({ featureImportance }) {
  const labels = featureImportance?.labels || ["sma_10", "sma_50", "daily_return", "rsi"];
  const values = featureImportance?.values || [0.25, 0.35, 0.2, 0.2];

  const data = {
    labels,
    datasets: [
      {
        label: "Feature Importance",
        data: values,
        backgroundColor: "rgba(59, 130, 246, 0.6)",
        borderColor: "rgb(37, 99, 235)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Feature Importance (RandomForest)" },
    },
    scales: {
      y: { beginAtZero: true, ticks: { callback: (v) => `${v}` } },
    },
  };

  return (
    <div style={{ marginTop: 16 }}>
      <Bar data={data} options={options} />
    </div>
  );
}
