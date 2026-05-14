import { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import api from '../../api/client';

const TRIAGE = [
  { tag: 'urgent',   icon: '🔥', label: 'Urgent' },
  { tag: 'park',     icon: '📦', label: 'Park' },
  { tag: 'drop',     icon: '🗑',  label: 'Drop' },
  { tag: 'delegate', icon: '🤝', label: 'Delegate' },
];

const WEIGHT_COLOR = { Low: '#10B981', Medium: '#F59E0B', High: '#EF4444' };

const COLS = [
  { key: 'task',            label: 'Task',             flex: 2.5 },
  { key: 'category',        label: 'Category',         flex: 1.2 },
  { key: 'how_long',        label: 'Postponed',        flex: 1.2 },
  { key: 'emotional_weight', label: 'Weight',          flex: 1.2 },
  { key: 'what_it_takes',   label: 'What it takes',    flex: 2.5 },
  { key: '_triage',         label: 'Triage',           flex: 2   },
];

function itemKey(task) {
  return (task || '').trim().toLowerCase();
}

const Row = memo(function Row({ index, style, data }) {
  const row = data.rows[index];
  const key = itemKey(row.task);
  const current = data.triageMap[key];

  return (
    <div style={{ ...style, display: 'flex', alignItems: 'center', borderBottom: '1px solid #E2E5F0', background: '#fff', fontSize: '.86rem' }}>
      {COLS.map(c => {
        if (c.key === '_triage') {
          return (
            <div key={c.key} style={{ flex: c.flex, padding: '0 8px', display: 'flex', gap: 3 }}>
              {TRIAGE.map(t => (
                <button
                  key={t.tag}
                  title={t.label}
                  onClick={() => data.onTag(key, current === t.tag ? null : t.tag)}
                  style={{
                    padding: '3px 7px', borderRadius: 6, fontSize: '.85rem', cursor: 'pointer',
                    border: `1px solid ${current === t.tag ? '#6C63FF' : '#E2E5F0'}`,
                    background: current === t.tag ? '#f0effe' : 'transparent',
                  }}
                >
                  {t.icon}
                </button>
              ))}
            </div>
          );
        }
        if (c.key === 'emotional_weight') {
          const color = WEIGHT_COLOR[row[c.key]] || '#6B7280';
          return (
            <div key={c.key} style={{ flex: c.flex, padding: '0 8px' }}>
              <span style={{ color, fontWeight: 700, fontSize: '.8rem' }}>{row[c.key] || '—'}</span>
            </div>
          );
        }
        return (
          <div key={c.key} style={{ flex: c.flex, padding: '0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={String(row[c.key] ?? '')}>
            {row[c.key] ?? '—'}
          </div>
        );
      })}
    </div>
  );
});

export default function PostponedBacklogTab({ patientId }) {
  const [items, setItems]       = useState([]);
  const [triageMap, setTriageMap] = useState({});
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('');
  const [sortKey, setSortKey]   = useState(null);
  const [sortDir, setSortDir]   = useState('asc');

  useEffect(() => {
    api.get(`/coach/patients/${patientId}/postponed-backlog`).then(data => {
      setItems(data?.items || []);
      setTriageMap(data?.triageMap || {});
    }).finally(() => setLoading(false));
  }, [patientId]);

  const handleTag = useCallback(async (key, tag) => {
    // Optimistic update
    setTriageMap(m => tag ? { ...m, [key]: tag } : Object.fromEntries(Object.entries(m).filter(([k]) => k !== key)));
    try {
      await api.post(`/coach/patients/${patientId}/triage`, { item_key: key, tag: tag ?? null });
    } catch {
      // Revert on failure by re-fetching
      api.get(`/coach/patients/${patientId}/postponed-backlog`).then(d => setTriageMap(d?.triageMap || {}));
    }
  }, [patientId]);

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }

  const WEIGHT_ORDER = { High: 3, Medium: 2, Low: 1 };

  const sorted = useMemo(() => {
    let rows = [...items];
    if (filter.trim()) {
      const q = filter.toLowerCase();
      rows = rows.filter(r => Object.values(r).some(v => String(v ?? '').toLowerCase().includes(q)));
    }
    if (sortKey && sortKey !== '_triage') {
      rows.sort((a, b) => {
        let av, bv;
        if (sortKey === 'emotional_weight') {
          av = WEIGHT_ORDER[a[sortKey]] ?? 0;
          bv = WEIGHT_ORDER[b[sortKey]] ?? 0;
        } else {
          av = String(a[sortKey] ?? '');
          bv = String(b[sortKey] ?? '');
        }
        if (av === bv) return 0;
        return (av > bv ? 1 : -1) * (sortDir === 'asc' ? 1 : -1);
      });
    }
    return rows;
  }, [items, filter, sortKey, sortDir]);

  if (loading) return <div className="spinner">Loading…</div>;
  if (!items.length) return <div className="empty-state">No postponed backlog submitted yet.</div>;

  const itemData = { rows: sorted, triageMap, onTag: handleTag };

  return (
    <div>
      <div className="backlog-toolbar">
        <input type="search" placeholder="Filter…" value={filter} onChange={e => setFilter(e.target.value)} />
        <span className="muted" style={{ fontSize: '.82rem' }}>{sorted.length} rows</span>
      </div>

      <div style={{ display: 'flex', background: '#F7F8FC', borderBottom: '2px solid #E2E5F0', fontSize: '.78rem', fontWeight: 700, color: '#6B7280' }}>
        {COLS.map(c => (
          <button key={c.key} className={`sort-btn ${sortKey === c.key ? 'active' : ''}`}
            style={{ flex: c.flex, padding: '8px 10px' }}
            onClick={() => toggleSort(c.key)}>
            {c.label} {sortKey === c.key ? (sortDir === 'asc' ? '↑' : '↓') : ''}
          </button>
        ))}
      </div>

      <List
        height={Math.min(sorted.length * 60 + 2, 560)}
        itemCount={sorted.length}
        itemSize={60}
        width="100%"
        itemData={itemData}
      >
        {Row}
      </List>
    </div>
  );
}
