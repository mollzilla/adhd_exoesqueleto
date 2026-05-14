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

const EMOTIONAL_WEIGHT = [
  { value: 'Low',    label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High',   label: 'High' },
];

const COLUMNS = [
  { key: 'task',            label: 'Task / Item',           width: 180 },
  { key: 'category',        label: 'Category',              type: 'select', options: CATEGORIES,       width: 120 },
  { key: 'how_long',        label: 'How long postponed',    width: 120 },
  { key: 'emotional_weight', label: 'Emotional weight',     type: 'select', options: EMOTIONAL_WEIGHT, width: 110 },
  { key: 'what_it_takes',   label: 'What would it take to finally do it?', type: 'textarea', width: 180 },
];

function emptyRow() {
  return { task: '', category: '', how_long: '', emotional_weight: '', what_it_takes: '' };
}

export default function PostponedBacklog() {
  const { user } = useAuth();
  const STORAGE_KEY = `adhd-draft-postponed-backlog-${user?.id}`;

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
        const saved = await api.get('/forms/postponed-backlog');
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
      await api.post('/forms/postponed-backlog', { items, status: submitting ? 'submitted' : 'draft' });
      setStatus(submitting ? 'submitted' : 'draft');
      if (submitting) clearDraft();
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }

  if (loading) return <div className="spinner">Loading…</div>;

  return (
    <FormWrapper title="Postponed Tasks Backlog" status={status} lastSaved={lastSaved}>
      <div className="card">
        <p className="muted" style={{ marginBottom: 16 }}>
          Everything you've been meaning to do but keep putting off. Be honest — no judgment here.
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
