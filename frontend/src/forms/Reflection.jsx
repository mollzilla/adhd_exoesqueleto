import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { useAutoSave } from '../hooks/useAutoSave';
import FormWrapper from '../components/FormWrapper';

const SECTIONS = [
  {
    title: 'Your Patterns',
    fields: [
      { key: 'patterns_q1', q: 'What patterns did you notice in your energy and focus this week — were there specific times of day when you felt sharper or more motivated?' },
      { key: 'patterns_q2', q: 'When during the week did you feel most capable and engaged? What were the conditions — location, task type, time of day?' },
      { key: 'patterns_q3', q: 'What situations or moments triggered avoidance, procrastination, or shutdown for you this week?' },
      { key: 'patterns_q4', q: 'How did your physical environment affect your ability to work or focus? What helped and what got in the way?' },
    ],
  },
  {
    title: 'The Backlog',
    fields: [
      { key: 'backlog_q1', q: 'Looking at your postponed tasks backlog, which items are weighing on you most emotionally right now, and why?' },
      { key: 'backlog_q2', q: 'Is there a pattern to the tasks that keep getting postponed? What do they have in common?' },
      { key: 'backlog_q3', q: 'For the task you\'ve been avoiding the longest, what is the very next physical action you could take to move it forward?' },
      { key: 'backlog_q4', q: 'Are there any items in your backlog you could delegate, simplify, or decide to stop feeling obligated about?' },
    ],
  },
  {
    title: 'Your Goals',
    fields: [
      { key: 'goals_q1', q: 'Did you accomplish the small goal you set for this week? If yes, what made it possible? If not, what got in the way?' },
      { key: 'goals_q2', q: 'Looking at your 1-month goal, does it still feel realistic and relevant? What would you adjust?' },
      { key: 'goals_q3', q: 'What would need to change — in your environment, routine, or mindset — for next week to go even 10% better?' },
      { key: 'goals_q4', q: 'What is one concrete commitment you are making to yourself between now and your next session?' },
    ],
  },
];

function defaultData() {
  return {
    patterns_q1: '', patterns_q2: '', patterns_q3: '', patterns_q4: '',
    backlog_q1: '', backlog_q2: '', backlog_q3: '', backlog_q4: '',
    goals_q1: '', goals_q2: '', goals_q3: '', goals_q4: '',
  };
}

export default function Reflection() {
  const { user } = useAuth();
  const STORAGE_KEY = `adhd-draft-reflection-${user?.id}`;

  const [formData, setFormData] = useState(defaultData());
  const [status, setStatus] = useState('draft');
  const [open, setOpen] = useState({ 0: true, 1: false, 2: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { lastSaved, loadDraft, clearDraft } = useAutoSave(STORAGE_KEY, formData);

  useEffect(() => {
    async function init() {
      const draft = loadDraft();
      if (draft) setFormData(draft);
      try {
        const saved = await api.get('/forms/reflection');
        if (saved) {
          setFormData({ ...defaultData(), ...saved });
          setStatus(saved.status);
        }
      } catch { /* use draft */ }
      finally { setLoading(false); }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function set(field) {
    return (e) => setFormData((f) => ({ ...f, [field]: e.target.value }));
  }

  function toggleSection(i) {
    setOpen((o) => ({ ...o, [i]: !o[i] }));
  }

  async function save(submitting) {
    setError('');
    setStatus('saving');
    try {
      await api.post('/forms/reflection', {
        ...formData,
        status: submitting ? 'submitted' : 'draft',
      });
      setStatus(submitting ? 'submitted' : 'draft');
      if (submitting) clearDraft();
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }

  if (loading) return <div className="spinner">Loading…</div>;

  return (
    <FormWrapper title="Between-Session Reflection" status={status} lastSaved={lastSaved}>
      <p className="muted" style={{ marginBottom: 20 }}>
        Take your time with these. Open one section at a time. There are no right answers.
      </p>
      {error && <div className="error-msg">{error}</div>}

      {SECTIONS.map((section, si) => (
        <div className="accordion-item" key={si}>
          <div className="accordion-header" onClick={() => toggleSection(si)}>
            <span>{si + 1}. {section.title}</span>
            <span className={`accordion-chevron ${open[si] ? 'open' : ''}`}>▼</span>
          </div>
          {open[si] && (
            <div className="accordion-body">
              {section.fields.map(({ key, q }) => (
                <div className="field" key={key}>
                  <label>{q}</label>
                  <textarea value={formData[key]} onChange={set(key)} rows={4} />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <div className="btn-row" style={{ marginTop: 20 }}>
        <button type="button" className="btn btn-secondary" onClick={() => save(false)}>Save draft</button>
        <button type="button" className="btn btn-primary" onClick={() => save(true)}>Submit ✓</button>
      </div>
    </FormWrapper>
  );
}
