// src/components/DataTable.jsx
import React, { useState } from 'react';
import { parseNum } from '../services/dataUtils';

export default function DataTable({ allData, numericCol }) {
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  // Flatten all data
  const allCols = ['Source', 'Sheet', ...new Set(
    allData.flatMap(f => f.sheets.flatMap(s => s.headers))
  )];

  let rows = allData.flatMap(f =>
    f.sheets.flatMap(s =>
      s.rows.map(r => ({ Source: f.fileName, Sheet: s.sheetName, ...r }))
    )
  );

  if (search) {
    const q = search.toLowerCase();
    rows = rows.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(q)));
  }

  if (sortCol) {
    rows = [...rows].sort((a, b) => {
      const av = parseNum(a[sortCol]) ?? a[sortCol] ?? '';
      const bv = parseNum(b[sortCol]) ?? b[sortCol] ?? '';
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const maxVal = numericCol
    ? Math.max(...rows.map(r => parseNum(r[numericCol]) || 0))
    : 0;

  return (
    <div>
      <input
        placeholder="Search in table..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: '100%', padding: '8px 12px', marginBottom: 12,
          border: '1px solid #dde1f0', borderRadius: 8, fontSize: 13,
          outline: 'none', boxSizing: 'border-box',
        }}
      />
      <div style={{ overflowX: 'auto', maxHeight: 400, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead style={{ position: 'sticky', top: 0, background: '#f3f4f8', zIndex: 1 }}>
            <tr>
              {allCols.map(col => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  style={{
                    padding: '9px 12px', textAlign: 'left', fontWeight: 600,
                    color: '#374151', cursor: 'pointer', whiteSpace: 'nowrap',
                    borderBottom: '1px solid #e5e7eb', userSelect: 'none',
                  }}
                >
                  {col}
                  {sortCol === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafbfd' }}>
                {allCols.map(col => {
                  const val = row[col] ?? '—';
                  const num = col === numericCol ? parseNum(val) : null;
                  const pct = num !== null && maxVal > 0 ? Math.round((num / maxVal) * 100) : null;
                  return (
                    <td key={col} style={{
                      padding: '8px 12px', borderBottom: '1px solid #f0f0f5',
                      color: '#1f2937', whiteSpace: 'nowrap',
                    }}>
                      {pct !== null ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 600 }}>{Number(val).toLocaleString()}</span>
                          <span style={{
                            fontSize: 10, padding: '2px 7px', borderRadius: 20, fontWeight: 600,
                            background: pct > 70 ? '#d4edda' : pct > 40 ? '#fff3cd' : '#fde8e8',
                            color: pct > 70 ? '#1e8e3e' : pct > 40 ? '#92600a' : '#d93025',
                          }}>{pct}%</span>
                        </span>
                      ) : String(val)}
                    </td>
                  );
                })}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={allCols.length} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: '#9ca3af' }}>
        {rows.length} record{rows.length !== 1 ? 's' : ''} shown
      </div>
    </div>
  );
}
