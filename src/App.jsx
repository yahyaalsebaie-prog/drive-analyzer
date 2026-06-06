// src/App.jsx
import React, { useState, useEffect } from 'react';
import StatsCards from './components/StatsCards';
import ChartView from './components/ChartView';
import DataTable from './components/DataTable';
import SettingsModal from './components/SettingsModal';
import {
  initGoogleApi, signIn, signOut, isSignedIn,
  listSpreadsheets, loadAllSheetsForFile,
} from './services/googleApi';
import {
  filterRows, getNumericHeaders, getDateHeaders,
  columnStats, parseNum, CHART_COLORS,
} from './services/dataUtils';

const STORAGE_KEY = 'drive_analyzer_creds';

export default function App() {
  const [creds, setCreds] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null; }
    catch { return null; }
  });
  const [gapiReady, setGapiReady] = useState(false);
  const [gisReady, setGisReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [showSettings, setShowSettings] = useState(!creds);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loadedData, setLoadedData] = useState([]);

  const [nameQuery, setNameQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [dateCol, setDateCol] = useState('');
  const [numericCol, setNumericCol] = useState('');
  const [chartType, setChartType] = useState('bar');
  const [activeTab, setActiveTab] = useState('chart');

  // Wait for both GAPI and GIS to load
  useEffect(() => {
    const checkReady = setInterval(() => {
      if (window.gapi) setGapiReady(true);
      if (window.google?.accounts?.oauth2) setGisReady(true);
    }, 200);
    return () => clearInterval(checkReady);
  }, []);

  // Init when both ready and creds available
  useEffect(() => {
    if (!gapiReady || !gisReady || !creds?.apiKey || !creds?.clientId) return;
    initGoogleApi(creds.apiKey, creds.clientId)
      .then(() => setStatus('Ready — click Sign In with Google'))
      .catch(e => setStatus('API error: ' + (e.details || e.message || JSON.stringify(e))));
  }, [gapiReady, gisReady, creds]);

  const handleSaveCreds = (newCreds) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newCreds));
    setCreds(newCreds);
    setShowSettings(false);
  };

  const handleSignIn = async () => {
    try {
      await signIn();
      setSignedIn(true);
      setStatus('Signed in successfully ✓');
    } catch (e) {
      setStatus('Sign-in failed: ' + (e.error || JSON.stringify(e)));
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setSignedIn(false);
    setFiles([]); setSelectedFiles([]); setLoadedData([]);
    setStatus('Signed out');
  };

  const handleLoadFiles = async () => {
    setLoading(true); setStatus('Loading files from Drive...');
    try {
      const list = await listSpreadsheets();
      setFiles(list);
      setStatus(`Found ${list.length} spreadsheet(s)`);
    } catch (e) {
      setStatus('Error: ' + (e.result?.error?.message || e.message));
    }
    setLoading(false);
  };

  const toggleFileSelect = (file) => {
    setSelectedFiles(prev =>
      prev.find(f => f.id === file.id)
        ? prev.filter(f => f.id !== file.id)
        : [...prev, file]
    );
  };

  const handleAnalyze = async () => {
    if (!selectedFiles.length) return;
    setLoading(true); setLoadedData([]);
    const results = [];
    for (const file of selectedFiles) {
      setStatus(`Loading: ${file.name}...`);
      try {
        const data = await loadAllSheetsForFile(file);
        results.push(data);
      } catch (e) {
        setStatus(`Error loading ${file.name}`);
      }
    }
    setLoadedData(results);
    const allHeaders = results.flatMap(f => f.sheets.flatMap(s => s.headers));
    const allRows = results.flatMap(f => f.sheets.flatMap(s => s.rows));
    const numCols = getNumericHeaders(allHeaders, allRows);
    const dtCols = getDateHeaders(allHeaders, allRows);
    if (numCols.length) setNumericCol(numCols[0]);
    if (dtCols.length) setDateCol(dtCols[0]);
    setStatus(`Loaded ${results.length} file(s) — ${allRows.length} rows total`);
    setLoading(false);
  };

  const filteredData = loadedData.map(f => ({
    ...f,
    sheets: f.sheets.map(s => ({
      ...s,
      rows: filterRows(s.rows, { nameQuery, dateFrom, dateTo, dateCol }),
    })),
  }));

  const allFilteredRows = filteredData.flatMap(f => f.sheets.flatMap(s => s.rows));
  const stats = numericCol ? columnStats(allFilteredRows, numericCol) : null;

  const labelSet = new Set();
  filteredData.forEach(f => f.sheets.forEach(s => {
    s.rows.forEach(r => { if (s.headers[0]) labelSet.add(r[s.headers[0]] || ''); });
  }));
  const chartLabels = [...labelSet].filter(Boolean);
  const chartDatasets = filteredData.map((f) => {
    const firstCol = f.sheets[0]?.headers[0] || '';
    const data = chartLabels.map(lbl => {
      let sum = 0;
      f.sheets.forEach(s => s.rows.forEach(r => {
        if (r[firstCol] === lbl) sum += parseNum(r[numericCol]) || 0;
      }));
      return sum;
    });
    return { label: f.fileName, data };
  });

  const allHeaders = loadedData.flatMap(f => f.sheets.flatMap(s => s.headers));
  const allRows = loadedData.flatMap(f => f.sheets.flatMap(s => s.rows));
  const numericCols = getNumericHeaders([...new Set(allHeaders)], allRows);
  const dateCols = getDateHeaders([...new Set(allHeaders)], allRows);

  const s = {
    input: { padding: '7px 11px', border: '1px solid #dde1f0', borderRadius: 8, fontSize: 13, width: '100%', boxSizing: 'border-box', outline: 'none' },
    select: { padding: '7px 11px', border: '1px solid #dde1f0', borderRadius: 8, fontSize: 13, width: '100%', background: '#fff', outline: 'none' },
    label: { fontSize: 11, color: '#6b7280', marginBottom: 4, display: 'block' },
    btn: (bg, color = '#fff') => ({ padding: '8px 18px', borderRadius: 8, border: 'none', background: bg, color, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }),
    card: { background: '#fff', borderRadius: 12, border: '1px solid #e2e4ef', padding: '16px 18px', marginBottom: 14 },
    tab: (active) => ({ padding: '8px 18px', fontSize: 13, fontWeight: active ? 600 : 400, color: active ? '#1a73e8' : '#6b7280', cursor: 'pointer', background: 'none', border: 'none', borderBottom: active ? '2px solid #1a73e8' : '2px solid transparent' }),
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6fa', fontFamily: 'system-ui, sans-serif' }}>
      {/* Top bar */}
      <div style={{ background: '#1a73e8', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 17 }}>📊 Google Drive Data Analyzer</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={s.btn('rgba(255,255,255,0.2)')} onClick={() => setShowSettings(true)}>⚙ Settings</button>
          {signedIn
            ? <button style={s.btn('rgba(255,255,255,0.15)')} onClick={handleSignOut}>Sign Out</button>
            : <button style={s.btn('rgba(255,255,255,0.9)', '#1a73e8')} onClick={handleSignIn}>Sign In with Google</button>
          }
        </div>
      </div>

      <div style={{ display: 'flex', maxWidth: 1300, margin: '0 auto', padding: '20px 16px', gap: 18 }}>
        {/* Sidebar */}
        <div style={{ width: 260, flexShrink: 0 }}>
          <div style={s.card}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, color: '#111827' }}>Spreadsheets</div>
            {signedIn ? (
              <button style={{ ...s.btn('#1a73e8'), width: '100%', marginBottom: 10 }} onClick={handleLoadFiles} disabled={loading}>
                {loading ? 'Loading...' : '↻ Load Files'}
              </button>
            ) : (
              <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>Sign in to load your files</p>
            )}
            {files.length > 0 && (
              <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                {files.map(f => {
                  const sel = selectedFiles.find(sf => sf.id === f.id);
                  return (
                    <div key={f.id} onClick={() => toggleFileSelect(f)} style={{
                      padding: '8px 10px', borderRadius: 8, cursor: 'pointer', marginBottom: 4,
                      background: sel ? '#eff6ff' : '#fafbfd', border: `1px solid ${sel ? '#bfdbfe' : '#e5e7eb'}`,
                      fontSize: 13, color: sel ? '#1d4ed8' : '#374151',
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      <span>{sel ? '☑' : '☐'}</span>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                    </div>
                  );
                })}
              </div>
            )}
            {selectedFiles.length > 0 && (
              <button style={{ ...s.btn('#1e8e3e'), width: '100%', marginTop: 10 }} onClick={handleAnalyze} disabled={loading}>
                ▶ Analyze {selectedFiles.length} file(s)
              </button>
            )}
          </div>

          {loadedData.length > 0 && (
            <div style={s.card}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, color: '#111827' }}>Filters</div>
              <div style={{ marginBottom: 10 }}>
                <label style={s.label}>Name / keyword</label>
                <input style={s.input} value={nameQuery} onChange={e => setNameQuery(e.target.value)} placeholder="Search..." />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={s.label}>Date column</label>
                <select style={s.select} value={dateCol} onChange={e => setDateCol(e.target.value)}>
                  <option value="">— none —</option>
                  {dateCols.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={s.label}>From date</label>
                <input style={s.input} type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={s.label}>To date</label>
                <input style={s.input} type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={s.label}>Numeric column</label>
                <select style={s.select} value={numericCol} onChange={e => setNumericCol(e.target.value)}>
                  <option value="">— select —</option>
                  {numericCols.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={s.label}>Chart type</label>
                <select style={s.select} value={chartType} onChange={e => setChartType(e.target.value)}>
                  <option value="bar">Bar</option>
                  <option value="line">Line</option>
                  <option value="area">Area</option>
                  <option value="doughnut">Donut</option>
                </select>
              </div>
              <button style={{ ...s.btn('#f3f4f8', '#374151'), width: '100%' }}
                onClick={() => { setNameQuery(''); setDateFrom(''); setDateTo(''); }}>
                Reset Filters
              </button>
            </div>
          )}
        </div>

        {/* Main */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {status && (
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '9px 14px', fontSize: 13, color: '#1d4ed8', marginBottom: 16 }}>
              {status}
            </div>
          )}

          {loadedData.length > 0 ? (
            <>
              <StatsCards stats={stats} colName={numericCol} tableCount={filteredData.length} />
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e4ef', padding: '0 18px 18px' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: 18 }}>
                  {['chart', 'table', 'compare'].map(t => (
                    <button key={t} style={s.tab(activeTab === t)} onClick={() => setActiveTab(t)}>
                      {t === 'chart' ? '📈 Chart' : t === 'table' ? '📋 Table' : '⚖ Compare'}
                    </button>
                  ))}
                </div>
                {activeTab === 'chart' && <ChartView type={chartType} labels={chartLabels} datasets={chartDatasets} title={`Comparison: ${numericCol}`} />}
                {activeTab === 'table' && <DataTable allData={filteredData} numericCol={numericCol} />}
                {activeTab === 'compare' && (
                  <div>
                    <ChartView type="bar"
                      labels={filteredData.map(f => f.fileName)}
                      datasets={[{ label: numericCol || 'Total', data: filteredData.map(f => f.sheets.flatMap(s => s.rows).reduce((sum, r) => sum + (parseNum(r[numericCol]) || 0), 0)) }]}
                      title="Total per File"
                    />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
                      {filteredData.map((f, i) => {
                        const rows = f.sheets.flatMap(s => s.rows);
                        const st = numericCol ? columnStats(rows, numericCol) : null;
                        return st ? (
                          <div key={f.fileId} style={{ background: '#f8f9ff', border: `1px solid ${CHART_COLORS[i % CHART_COLORS.length]}44`, borderRadius: 10, padding: '12px 16px', minWidth: 180 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: CHART_COLORS[i % CHART_COLORS.length], marginBottom: 6 }}>{f.fileName}</div>
                            <div style={{ fontSize: 12, color: '#374151' }}>
                              Total: <strong>{st.sum.toLocaleString('en-US', { maximumFractionDigits: 1 })}</strong><br />
                              Avg: <strong>{st.avg.toLocaleString('en-US', { maximumFractionDigits: 1 })}</strong><br />
                              Max: <strong>{st.max.toLocaleString('en-US', { maximumFractionDigits: 1 })}</strong><br />
                              Rows: <strong>{st.count}</strong>
                            </div>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e4ef', padding: '60px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 8 }}>Welcome to Drive Data Analyzer</div>
              <div style={{ fontSize: 14, color: '#6b7280', maxWidth: 400, margin: '0 auto', lineHeight: 1.6 }}>
                {!creds ? 'Click ⚙ Settings to add your Google API credentials.' :
                 !signedIn ? 'Click "Sign In with Google" to connect your Drive.' :
                 'Click "Load Files" to browse your spreadsheets.'}
              </div>
            </div>
          )}
        </div>
      </div>

      {showSettings && <SettingsModal current={creds} onSave={handleSaveCreds} onClose={() => setShowSettings(false)} />}
    </div>
  );
}
