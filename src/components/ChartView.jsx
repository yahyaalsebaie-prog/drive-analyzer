// src/components/ChartView.jsx
import React from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { CHART_COLORS } from '../services/dataUtils';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
);

const baseOptions = (title) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top', labels: { font: { size: 12 }, padding: 16 } },
    title: { display: !!title, text: title, font: { size: 14, weight: 'bold' } },
    tooltip: { mode: 'index', intersect: false },
  },
  scales: {
    x: { grid: { color: '#f0f0f5' }, ticks: { font: { size: 11 } } },
    y: { beginAtZero: true, grid: { color: '#f0f0f5' }, ticks: { font: { size: 11 } } },
  },
});

export default function ChartView({ type, labels, datasets, title }) {
  if (!labels?.length || !datasets?.length) {
    return (
      <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 14 }}>
        No data to display — select a numeric column and load files
      </div>
    );
  }

  const colors = datasets.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);

  if (type === 'doughnut') {
    const donutData = {
      labels: datasets.map(d => d.label),
      datasets: [{
        data: datasets.map(d => d.data.reduce((a, b) => a + b, 0)),
        backgroundColor: colors.map(c => c + 'cc'),
        borderColor: colors,
        borderWidth: 2,
        hoverOffset: 8,
      }],
    };
    return (
      <div style={{ height: 320 }}>
        <Doughnut data={donutData} options={{
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'right' }, title: { display: !!title, text: title } },
          cutout: '58%',
        }} />
      </div>
    );
  }

  const chartData = {
    labels,
    datasets: datasets.map((d, i) => ({
      label: d.label,
      data: d.data,
      backgroundColor: type === 'line' ? colors[i] + '22' : colors[i] + 'cc',
      borderColor: colors[i],
      borderWidth: type === 'line' ? 2.5 : 0,
      borderRadius: type === 'bar' ? 6 : 0,
      pointRadius: type === 'line' ? 4 : 0,
      pointHoverRadius: 6,
      fill: type === 'area',
      tension: 0.35,
    })),
  };

  const opts = baseOptions(title);
  if (type === 'bar') delete opts.scales;

  return (
    <div style={{ height: 320 }}>
      {type === 'bar' || type === 'area'
        ? <Bar data={chartData} options={baseOptions(title)} />
        : <Line data={chartData} options={baseOptions(title)} />}
    </div>
  );
}
