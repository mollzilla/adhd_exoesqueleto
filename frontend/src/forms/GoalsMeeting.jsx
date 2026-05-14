import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { useAutoSave } from '../hooks/useAutoSave';
import FormWrapper from '../components/FormWrapper';
import Stepper from '../components/Stepper';

const STEPS = ['Life Areas', 'ADHD Profile', 'Goal Setting', 'Coaching Framework'];

const EF_CHALLENGES = [
  { key: 'task_initiation',    label: 'Task initiation' },
  { key: 'transitions',        label: 'Transitions' },
  { key: 'time_perception',    label: 'Time perception' },
  { key: 'emotional_regulation', label: 'Emotional regulation' },
  { key: 'follow_through',     label: 'Follow-through' },
  { key: 'organization',       label: 'Organization' },
  { key: 'working_memory',     label: 'Working memory' },
];

const LIFE_AREAS = [
  { key: 'life_work',          label: 'Work' },
  { key: 'life_home',          label: 'Home' },
  { key: 'life_health',        label: 'Health' },
  { key: 'life_relationships', label: 'Relationships' },
  { key: 'life_finance',       label: 'Finance' },
  { key: 'life_personal_growth', label: 'Personal growth' },
];

function defaultData() {
  return {
    life_work: '', life_home: '', life_health: '',
    life_relationships: '', life_finance: '', life_personal_growth: '',
    most_alive_focused: '', peak_time: '', hyperfocus_triggers: '',
    ef_challenges: [],
    strategies_tried: '',
    goal_3months: '', goal_1month: '', goal_this_week: '',
    session_frequency: '', feedback_style: '', accountability_format: '', coach_not_to_do: '',
  };
}

export default function GoalsMeeting() {
  const { user } = useAuth();
  const STORAGE_KEY = `adhd-draft-goals-meeting-${user?.id}`;

  const [formData, setFormData] = useState(defaultData());
  const [status, setStatus] = useState('draft');
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { lastSaved, loadDraft, clearDraft } = useAutoSave(STORAGE_KEY, formData);

  useEffect(() => {
    async function init() {
      const draft = loadDraft();
      if (draft) setFormData(draft);
      try {
        const saved = await api.get('/forms/goals-meeting');
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

  function toggleEF(key) {
    setFormData((f) => {
      const challenges = f.ef_challenges || [];
      return {
        ...f,
        ef_challenges: challenges.includes(key)
          ? challenges.filter((k) => k !== key)
          : [...challenges, key],
      };
    });
  }

  async function save(submitting) {
    setError('');
    setStatus('saving');
    try {
      await api.post('/forms/goals-meeting', {
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

  const f = formData;
  const ef = f.ef_challenges || [];

  return (
    <FormWrapper title="Goals & Expectations" status={status} lastSaved={lastSaved}>
      <Stepper steps={STEPS} current={step} onChange={setStep} />
      {error && <div className="error-msg">{error}</div>}

      {/* Step 0 – Life Areas */}
      {step === 0 && (
        <div className="card">
          <h2 style={{ marginBottom: 4 }}>Life Areas Reflection</h2>
          <p className="muted" style={{ marginBottom: 16 }}>
            For each area, describe where you are now and where you'd like to be.
          </p>
          {LIFE_AREAS.map(({ key, label }) => (
            <div className="field" key={key}>
              <label>{label}</label>
              <textarea value={f[key]} onChange={set(key)} placeholder={`Your current situation and hopes in ${label.toLowerCase()}…`} />
            </div>
          ))}
        </div>
      )}

      {/* Step 1 – ADHD Profile */}
      {step === 1 && (
        <div className="card">
          <h2 style={{ marginBottom: 16 }}>Your ADHD Profile</h2>
          <div className="field">
            <label>When do you feel most alive and focused?</label>
            <textarea value={f.most_alive_focused} onChange={set('most_alive_focused')}
              placeholder="Describe the situations, tasks, or environments where you feel at your best…" />
          </div>
          <div className="field">
            <label>What is your peak time of day?</label>
            <input type="text" value={f.peak_time} onChange={set('peak_time')}
              placeholder="e.g. Late morning, after lunch, evenings…" />
          </div>
          <div className="field">
            <label>What typically triggers your hyperfocus?</label>
            <textarea value={f.hyperfocus_triggers} onChange={set('hyperfocus_triggers')} />
          </div>
          <div className="field">
            <label>Executive function challenges (select all that apply)</label>
            <div className="checkbox-group" style={{ marginTop: 8 }}>
              {EF_CHALLENGES.map(({ key, label }) => (
                <label
                  key={key}
                  className={`checkbox-item ${ef.includes(key) ? 'checked' : ''}`}
                  onClick={() => toggleEF(key)}
                >
                  <input type="checkbox" checked={ef.includes(key)} readOnly />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <div className="field">
            <label>Strategies you've tried before — what worked and what didn't?</label>
            <textarea value={f.strategies_tried} onChange={set('strategies_tried')} />
          </div>
        </div>
      )}

      {/* Step 2 – Goal Setting */}
      {step === 2 && (
        <div className="card">
          <h2 style={{ marginBottom: 16 }}>Goal Setting</h2>
          <div className="field">
            <label>Long-term goal — 3 months from now</label>
            <textarea value={f.goal_3months} onChange={set('goal_3months')}
              placeholder="What does success look like in 3 months?" />
          </div>
          <div className="field">
            <label>Medium-term goal — 1 month from now</label>
            <textarea value={f.goal_1month} onChange={set('goal_1month')}
              placeholder="A meaningful milestone you can reach in 4 weeks." />
          </div>
          <div className="field">
            <label>This week's small, concrete goal</label>
            <textarea value={f.goal_this_week} onChange={set('goal_this_week')}
              placeholder="Something specific, achievable, and verifiable by Sunday." />
          </div>
        </div>
      )}

      {/* Step 3 – Coaching Framework */}
      {step === 3 && (
        <div className="card">
          <h2 style={{ marginBottom: 16 }}>How We'll Work Together</h2>
          <div className="field">
            <label>Preferred session frequency</label>
            <input type="text" value={f.session_frequency} onChange={set('session_frequency')}
              placeholder="e.g. Weekly, bi-weekly…" />
          </div>
          <div className="field">
            <label>Feedback style preference</label>
            <div className="radio-group">
              {[{ value: 'direct', label: 'Direct — tell me straight' }, { value: 'exploratory', label: 'Exploratory — ask questions' }].map(({ value, label }) => (
                <label key={value} className={`radio-item ${f.feedback_style === value ? 'selected' : ''}`}
                  onClick={() => setFormData((fd) => ({ ...fd, feedback_style: value }))}>
                  <input type="radio" name="feedback_style" value={value} checked={f.feedback_style === value} readOnly />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <div className="field">
            <label>Accountability format — how do you want to be held accountable?</label>
            <textarea value={f.accountability_format} onChange={set('accountability_format')}
              placeholder="Check-ins, written updates, a specific ritual…" />
          </div>
          <div className="field">
            <label>What should your coach NOT do?</label>
            <textarea value={f.coach_not_to_do} onChange={set('coach_not_to_do')}
              placeholder="Things that demotivate you or don't work for you…" />
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="stepper-btns">
        {step > 0 && (
          <button type="button" className="btn btn-ghost" onClick={() => setStep((s) => s - 1)}>← Back</button>
        )}
        {step < STEPS.length - 1 ? (
          <button type="button" className="btn btn-primary" onClick={() => setStep((s) => s + 1)}>Next →</button>
        ) : (
          <>
            <button type="button" className="btn btn-secondary" onClick={() => save(false)}>Save draft</button>
            <button type="button" className="btn btn-primary" onClick={() => save(true)}>Submit ✓</button>
          </>
        )}
      </div>
      {step < STEPS.length - 1 && (
        <button type="button" className="btn btn-ghost" style={{ marginTop: 10 }} onClick={() => save(false)}>
          Save draft
        </button>
      )}
    </FormWrapper>
  );
}
