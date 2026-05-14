import { useState, useEffect, useMemo, memo } from 'react';
import { FixedSizeList as List } from 'react-window';
import api from '../../api/client';

const COLS = [
  { key: 'activity',    label: 'Activity / Responsibility', flex: 3   },
  { key: 'category',   label: 'Category',                  flex: 1.5 },
  { key: 'duration',   label: 'Duration',                  flex: 1.5 },
  { key: 'reliability', label: 'Reliability',              flex: 1.5 },
  { key: 'notes',      label: 'Notes / Friction',          flex: 2.5 },
];

function ReliabilityBadge({ score }) {
  const n = Number(score);
  const color = n <= 2 ? '#EF4444' : n === 3 ? '#F59E0B' : '#10B981';
  const label = n <= 2 ? 'Low' : n === 3 ? 'Med' : 'High';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 20,
      background: color + '20', color, fontSize: '.78rem', fontWeight: 700,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, display: 'inline-block' }} />
      {n} — {label}
    </span>
  );
}

const Row = memo(function Row({ index, style, data }) {
  const row = data.rows[index];
  return (
    <div style={{ ...style, display: 'flex', alignItems: 'center', borderBottom: '1px solid #E2E5F0', background: '#fff', fontSize: '.88rem' }}>
      {COLS.map(c => (
        <div key={c.key} style={{ flex: c.flex, padding: '0 10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={String(row[c.key] ?? '')}>
          {c.key === 'reliability'
            ? <ReliabilityBadge score={row[c.key]} />
            : row[c.key] ?? '—'}
        </div>
      ))}
    </div>
  );
});

export default function RoutineBacklogTab({ patientId }) {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  useEffect(() => {
    api.get(`/coach/patients/${patientId}/routine-backlog`)
      .then(data => setItems(data?.items || []))
      .finally(() => setLoading(false));
  }, [patientId]);

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }

  const sorted = useMemo(() => {
    let rows = [...items];
    if (filter.trim()) {
      const q = filter.toLowerCase();
      rows = rows.filter(r => Object.values(r).some(v => String(v ?? '').toLowerCase().includes(q)));
    }
    if (sortKey) {
      rows.sort((a, b) => {
        const av = sortKey === 'reliability' ? Number(a[sortKey]) : String(a[sortKey] ?? '');
        const bv = sortKey === 'reliability' ? Number(b[sortKey]) : String(b[sortKey] ?? '');
        if (av === bv) return 0;
        return (av > bv ? 1 : -1) * (sortDir === 'asc' ? 1 : -1);
      });
    }
    return rows;
  }, [items, filter, sortKey, sortDir]);

  if (loading) return <div className="spinner">Loading…</div>;
  if (!items.length) return <div className="empty-state">No routine backlog submitted yet.</div>;

  return (
    <div>
      <div className="backlog-toolbar">
        <input
          type="search"
          placeholder="Filter…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
        <span className="muted" style={{ fontSize: '.82rem' }}>{sorted.length} rows</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', background: '#F7F8FC', borderBottom: '2px solid #E2E5F0', fontSize: '.78rem', fontWeight: 700, color: '#6B7280', padding: '0 0' }}>
        {COLS.map(c => (
          <button key={c.key} className={`sort-btn ${sortKey === c.key ? 'active' : ''}`}
            style={{ flex: c.flex, padding: '8px 10px' }}
            onClick={() => toggleSort(c.key)}>
            {c.label} {sortKey === c.key ? (sortDir === 'asc' ? '↑' : '↓') : ''}
          </button>
        ))}
      </div>

      <List
        height={Math.min(sorted.length * 52 + 2, 560)}
        itemCount={sorted.length}
        itemSize={52}
        width="100%"
        itemData={{ rows: sorted }}
      >
        {Row}
      </List>
    </div>
  );
}
