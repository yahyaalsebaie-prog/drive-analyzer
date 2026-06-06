// src/components/StatsCards.jsx
import React from 'react';

const fmt = (n) =>
  typeof n === 'number'
    ? n.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : '—';

const Card = ({ label, value, sub, color }) => (
  <div style={{
    background: '#fff', borderRadius: 12, padding: '16px 20px',
    border: '1px solid #e2e4ef', flex: 1, minWidth: 140,
  }}>
    <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{sub}</div>
  </div>
);

export default function StatsCards({ stats, colName, tableCount }) {
  if (!stats) return null;
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
      <Card label="Total" value={fmt(stats.sum)} sub={colName} color="#1a73e8" />
      <Card label="Average" value={fmt(stats.avg)} sub="per row" color="#1e8e3e" />
      <Card label="Maximum" value={fmt(stats.max)} sub="highest value" color="#d93025" />
      <Card label="Records" value={fmt(stats.count)} sub={`${tableCount} sheet(s)`} color="#a142f4" />
    </div>
  );
}
