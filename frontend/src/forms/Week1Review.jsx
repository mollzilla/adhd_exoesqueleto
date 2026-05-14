import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { useAutoSave } from '../hooks/useAutoSave';
import FormWrapper from '../components/FormWrapper';
import Stepper from '../components/Stepper';

const STEPS = ['Week Reflection', 'Meeting 2 Commitments'];

function defaultData() {
  return {
    most_valuable_learning: '',
    hardest_part: '',
    strategy_realistic: '',
    week2_focus: '',
    environmental_change: '',
    micro_habit: '',
    first_backlog_step: '',
    progress_reporting: '',
  };
}

export default function Week1Review() {
  const { user } = useAuth();
  const STORAGE_KEY = `adhd-draft-week1-review-${user?.id}`;

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
        const saved = await api.get('/forms/week1-review');
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

  async function save(submitting) {
    setError('');
    setStatus('saving');
    try {
      await api.post('/forms/week1-review', {
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

  return (
    <FormWrapper title="Week 1 End Review" status={status} lastSaved={lastSaved}>
      <Stepper steps={STEPS} current={step} onChange={setStep} />
      {error && <div className="error-msg">{error}</div>}

      {/* Step 0 – Week Reflection */}
      {step === 0 && (
        <div className="card">
          <h2 style={{ marginBottom: 16 }}>Looking Back at Week 1</h2>
          <div className="field">
            <label>What was your most valuable self-learning from this week?</label>
            <textarea value={f.most_valuable_learning} onChange={set('most_valuable_learning')} rows={4}
              placeholder="Something you discovered about how you work, think, or feel…" />
          </div>
          <div className="field">
            <label>What was the hardest part of this week's process?</label>
            <textarea value={f.hardest_part} onChange={set('hardest_part')} rows={4}
              placeholder="Be specific — what made it difficult?" />
          </div>
          <div className="field">
            <label>Was the strategy we built together realistic? What would you change?</label>
            <textarea value={f.strategy_realistic} onChange={set('strategy_realistic')} rows={4}
              placeholder="Honest reflection — what worked, what felt off, what needs adjusting…" />
          </div>
          <div className="field">
            <label>What do you want to focus on in Week 2?</label>
            <textarea value={f.week2_focus} onChange={set('week2_focus')} rows={4}
              placeholder="One theme, habit, or challenge you want to prioritize…" />
          </div>
        </div>
      )}

      {/* Step 1 – Commitments */}
      {step === 1 && (
        <div className="card">
          <h2 style={{ marginBottom: 4 }}>Meeting 2 Commitments</h2>
          <p className="muted" style={{ marginBottom: 16 }}>
            Concrete decisions made in your second session.
          </p>
          <div className="field">
            <label>Environmental or structural change you're making</label>
            <textarea value={f.environmental_change} onChange={set('environmental_change')} rows={3}
              placeholder="A change to your space, schedule, or systems…" />
          </div>
          <div className="field">
            <label>Micro-habit you're adopting</label>
            <textarea value={f.micro_habit} onChange={set('micro_habit')} rows={3}
              placeholder="Small, specific, easy to start — what is it and when will you do it?" />
          </div>
          <div className="field">
            <label>First step you're taking on a backlog item</label>
            <textarea value={f.first_backlog_step} onChange={set('first_backlog_step')} rows={3}
              placeholder="Which task, and what is the very first action?" />
          </div>
          <div className="field">
            <label>How you'll report progress to your coach</label>
            <textarea value={f.progress_reporting} onChange={set('progress_reporting')} rows={3}
              placeholder="Format, frequency, channel — what you agreed on…" />
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
