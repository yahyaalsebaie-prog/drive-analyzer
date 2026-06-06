// src/services/dataUtils.js

export const filterRows = (rows, { nameQuery, dateFrom, dateTo, dateCol }) => {
  return rows.filter(row => {
    if (nameQuery) {
      const q = nameQuery.toLowerCase();
      const match = Object.values(row).some(v => String(v).toLowerCase().includes(q));
      if (!match) return false;
    }
    if ((dateFrom || dateTo) && dateCol) {
      const raw = row[dateCol] || '';
      const normalized = normalizeDate(raw);
      if (normalized) {
        if (dateFrom && normalized < dateFrom) return false;
        if (dateTo && normalized > dateTo) return false;
      }
    }
    return true;
  });
};

const normalizeDate = (raw) => {
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.substring(0, 10);
  if (/^\d{2}\/\d{2}\/\d{4}/.test(raw)) {
    const [d, m, y] = raw.split('/');
    return `${y}-${m}-${d}`;
  }
  if (/^\d{2}-\d{2}-\d{4}/.test(raw)) {
    const [d, m, y] = raw.split('-');
    return `${y}-${m}-${d}`;
  }
  return null;
};

export const getNumericHeaders = (headers, rows) =>
  headers.filter(h =>
    rows.some(r => {
      const v = String(r[h] || '').replace(/[,\s]/g, '');
      return v !== '' && !isNaN(parseFloat(v));
    })
  );

export const getDateHeaders = (headers, rows) =>
  headers.filter(h =>
    rows.some(r => normalizeDate(String(r[h] || '')) !== null)
  );

export const parseNum = (v) => {
  const n = parseFloat(String(v || '').replace(/[,\s$%]/g, ''));
  return isNaN(n) ? null : n;
};

export const columnStats = (rows, col) => {
  const vals = rows.map(r => parseNum(r[col])).filter(v => v !== null);
  if (!vals.length) return { sum: 0, avg: 0, max: 0, min: 0, count: 0 };
  const sum = vals.reduce((a, b) => a + b, 0);
  return {
    sum,
    avg: sum / vals.length,
    max: Math.max(...vals),
    min: Math.min(...vals),
    count: vals.length,
  };
};

export const aggregateBy = (rows, groupCol, valueCol) => {
  const map = {};
  rows.forEach(r => {
    const key = r[groupCol] || 'غير محدد';
    const v = parseNum(r[valueCol]) || 0;
    map[key] = (map[key] || 0) + v;
  });
  return map;
};

export const CHART_COLORS = [
  '#1a73e8', '#e8710a', '#1e8e3e', '#a142f4',
  '#d93025', '#00897b', '#e52592', '#f29900',
];
