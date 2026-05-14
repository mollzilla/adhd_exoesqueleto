import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { useAutoSave } from '../hooks/useAutoSave';
import FormWrapper from '../components/FormWrapper';
import DynamicTable from '../components/DynamicTable';

const CATEGORIES = [
  { value: 'Work',     label: 'Work' },
  { value: 'Home',     label: 'Home' },
  { value: 'Health',   label: 'Health' },
  { value: 'Finance',  label: 'Finance' },
  { value: 'Family',   label: 'Family' },
  { value: 'Social',   label: 'Social' },
  { value: 'Learning', label: 'Learning' },
  { value: 'Leisure',  label: 'Leisure' },
];

const COLUMNS = [
  { key: 'activity',    label: 'Activity / Responsibility', width: 180 },
  { key: 'category',   label: 'Category', type: 'select', options: CATEGORIES, width: 120 },
  { key: 'duration',   label: 'Approx. duration', width: 110 },
  { key: 'reliability', label: 'Reliability (1–5)', type: 'number', min: 1, max: 5, width: 90 },
  { key: 'notes',      label: 'Notes / Friction', type: 'textarea', width: 160 },
];

function emptyRow() {
  return { activity: '', category: '', duration: '', reliability: '', notes: '' };
}

export default function RoutineBacklog() {
  const { user } = useAuth();
  const STORAGE_KEY = `adhd-draft-routine-backlog-${user?.id}`;

  const [items, setItems] = useState([emptyRow()]);
  const [status, setStatus] = useState('draft');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { lastSaved, loadDraft, clearDraft } = useAutoSave(STORAGE_KEY, items);

  useEffect(() => {
    async function init() {
      const draft = loadDraft();
      if (draft) setItems(draft);
      try {
        const saved = await api.get('/forms/routine-backlog');
        if (saved) {
          setItems(Array.isArray(saved.items) && saved.items.length ? saved.items : [emptyRow()]);
          setStatus(saved.status);
        }
      } catch { /* use draft */ }
      finally { setLoading(false); }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save(submitting) {
    setError('');
    setStatus('saving');
    try {
      await api.post('/forms/routine-backlog', { items, status: submitting ? 'submitted' : 'draft' });
      setStatus(submitting ? 'submitted' : 'draft');
      if (submitting) clearDraft();
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }

  if (loading) return <div className="spinner">Loading…</div>;

  return (
    <FormWrapper title="Routine Backlog" status={status} lastSaved={lastSaved}>
      <div className="card">
        <p className="muted" style={{ marginBottom: 16 }}>
          List all your regular activities and responsibilities. Add as many rows as you need.
        </p>
        {error && <div className="error-msg">{error}</div>}
        <DynamicTable
          columns={COLUMNS}
          rows={items}
          onChange={setItems}
          onAdd={() => setItems((r) => [...r, emptyRow()])}
          onRemove={(i) => setItems((r) => r.filter((_, idx) => idx !== i))}
        />
      </div>
      <div className="btn-row">
        <button type="button" className="btn btn-secondary" onClick={() => save(false)}>Save draft</button>
        <button type="button" className="btn btn-primary" onClick={() => save(true)}>Submit ✓</button>
      </div>
    </FormWrapper>
  );
}
