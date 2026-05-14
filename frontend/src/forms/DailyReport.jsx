import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { useAutoSave } from '../hooks/useAutoSave';
import FormWrapper from '../components/FormWrapper';
import Stepper from '../components/Stepper';

const TIME_BLOCKS = [
  '6:00 – 9:00',
  '9:00 – 12:00',
  '12:00 – 15:00',
  '15:00 – 18:00',
  '18:00 – 21:00',
  '21:00 – sleep',
];

const STEPS = ['Header', 'Part A: Morning', 'Part B: Energy Map', 'Part C: Reflections', 'Part D: Lifestyle', 'Part E: Wrap-up'];

function emptyEFMap() {
  return TIME_BLOCKS.map((block) => ({ block, energy: 3, focus: 3, activity: '' }));
}

function defaultData(date) {
  return {
    report_date: date,
    day_name: '',
    mood_score: 5,
    wake_up_time: '',
    first_30min: '',
    intended_task_1: '', intended_task_2: '', intended_task_3: '',
    done_task_1: '', done_task_2: '', done_task_3: '',
    task_difference_reason: '',
    energy_focus_map: emptyEFMap(),
    easiest_thing: '', easiest_conditions: '',
    hardest_thing: '',
    hyperfocus_moment: '', hyperfocus_trigger: '',
    avoidance_moment: '',
    work_location: '', location_helpful: '',
    sleep_hours: '',
    ate_regularly: null, moved_body: null, lifestyle_notes: '',
    medication_taken: null, medication_notes: '',
    went_well: '', to_change: '', carried_task: '', internal_experience: '',
  };
}

function normalizeEFMap(saved) {
  if (saved.energy_focus_map && typeof saved.energy_focus_map === 'string') {
    saved.energy_focus_map = JSON.parse(saved.energy_focus_map);
  }
  if (!Array.isArray(saved.energy_focus_map) || saved.energy_focus_map.length === 0) {
    saved.energy_focus_map = emptyEFMap();
  }
}

export default function DailyReport() {
  const { user } = useAuth();
  const today = new Date().toISOString().slice(0, 10);
  const STORAGE_KEY = `adhd-draft-daily-report-${user?.id}-${today}`;

  const [formData, setFormData] = useState(() => defaultData(today));
  const [status, setStatus] = useState('draft');
  const [view, setView] = useState('loading'); // 'loading' | 'form' | 'success'
  const [wasSubmitted, setWasSubmitted] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');

  const { lastSaved, loadDraft, clearDraft } = useAutoSave(STORAGE_KEY, formData);

  useEffect(() => {
    async function init() {
      const draft = loadDraft();
      if (draft) setFormData(draft);

      try {
        const saved = await api.get(`/forms/daily-report?date=${today}`);
        if (saved) {
          normalizeEFMap(saved);
          setFormData(saved);
          setStatus(saved.status);
          if (saved.status === 'submitted') {
            setWasSubmitted(true);
            setView('success');
            return;
          }
        }
      } catch { /* network error — use draft */ }

      setView('form');
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDateChange(newDate) {
    try {
      const saved = await api.get(`/forms/daily-report?date=${newDate}`);
      if (saved) {
        normalizeEFMap(saved);
        setFormData(saved);
        setStatus(saved.status);
        setWasSubmitted(saved.status === 'submitted');
      } else {
        setFormData(defaultData(newDate));
        setStatus('draft');
        setWasSubmitted(false);
      }
    } catch {
      setFormData((f) => ({ ...f, report_date: newDate }));
    }
  }

  function set(field) {
    return (val) => setFormData((f) => ({ ...f, [field]: val }));
  }

  function setEF(blockIdx, field, value) {
    setFormData((f) => {
      const map = f.energy_focus_map.map((b, i) =>
        i === blockIdx ? { ...b, [field]: value } : b
      );
      return { ...f, energy_focus_map: map };
    });
  }

  async function save(submitting) {
    if (submitting && wasSubmitted) {
      const ok = window.confirm(
        `You already submitted a report for ${formData.report_date}. This will overwrite it. Continue?`
      );
      if (!ok) return;
    }

    setError('');
    setStatus('saving');
    try {
      await api.post('/forms/daily-report', {
        ...formData,
        status: submitting ? 'submitted' : 'draft',
      });
      setStatus(submitting ? 'submitted' : 'draft');
      if (submitting) {
        clearDraft();
        setWasSubmitted(true);
        setView('success');
      }
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }

  if (view === 'loading') return <div className="spinner">Loading…</div>;

  // ── Success screen ──────────────────────────────────────────────
  if (view === 'success') {
    return (
      <FormWrapper title="Daily Self-Report" status="submitted">
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: 12 }}>✓</div>
          <h2 style={{ color: 'var(--success)', marginBottom: 8 }}>Report submitted</h2>
          <p className="muted" style={{ marginBottom: 4 }}>{formData.report_date}</p>
          {formData.mood_score && (
            <p className="muted" style={{ marginBottom: 28 }}>Mood: {formData.mood_score} / 10</p>
          )}
          <div className="btn-row" style={{ justifyContent: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => { setStep(0); setView('form'); }}
            >
              Edit this report
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={async () => {
                const fresh = defaultData(today);
                setFormData(fresh);
                setStatus('draft');
                setWasSubmitted(false);
                setStep(0);
                try {
                  const saved = await api.get(`/forms/daily-report?date=${today}`);
                  if (saved) {
                    normalizeEFMap(saved);
                    setFormData(saved);
                    setStatus(saved.status);
                    setWasSubmitted(saved.status === 'submitted');
                    if (saved.status === 'submitted') return;
                  }
                } catch { /* ok */ }
                setView('form');
              }}
            >
              New day →
            </button>
          </div>
        </div>
      </FormWrapper>
    );
  }

  // ── Form ────────────────────────────────────────────────────────
  const f = formData;

  return (
    <FormWrapper title="Daily Self-Report" status={status} lastSaved={lastSaved}>
      {wasSubmitted && (
        <div style={{
          background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: 8,
          padding: '10px 14px', marginBottom: 16, fontSize: '.88rem', color: '#92400E',
        }}>
          You already submitted a report for this day. Submitting again will overwrite it.
        </div>
      )}

      <Stepper steps={STEPS} current={step} onChange={setStep} />
      {error && <div className="error-msg">{error}</div>}

      {/* Step 0 – Header */}
      {step === 0 && (
        <div className="card">
          <div className="field">
            <label>Date</label>
            <input
              type="date"
              value={f.report_date}
              onChange={(e) => handleDateChange(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Day name</label>
            <input type="text" placeholder="e.g. Monday" value={f.day_name}
              onChange={(e) => set('day_name')(e.target.value)} />
          </div>
          <div className="field">
            <label>Overall mood today — {f.mood_score}/10</label>
            <div className="range-row">
              <span>1</span>
              <input type="range" min="1" max="10" value={f.mood_score}
                onChange={(e) => set('mood_score')(Number(e.target.value))} />
              <span>10</span>
            </div>
          </div>
        </div>
      )}

      {/* Step 1 – Part A */}
      {step === 1 && (
        <div className="card">
          <div className="field">
            <label>Wake-up time</label>
            <input type="time" value={f.wake_up_time}
              onChange={(e) => set('wake_up_time')(e.target.value)} />
          </div>
          <div className="field">
            <label>First 30 minutes — what did you do?</label>
            <textarea value={f.first_30min} onChange={(e) => set('first_30min')(e.target.value)}
              placeholder="Describe how you started your day…" />
          </div>
          <h3 style={{ marginBottom: 12 }}>Top 3 tasks you intended to do</h3>
          {[1, 2, 3].map((n) => (
            <div className="field" key={n}>
              <label>Task {n}</label>
              <input type="text" value={f[`intended_task_${n}`]}
                onChange={(e) => set(`intended_task_${n}`)(e.target.value)} />
            </div>
          ))}
          <h3 style={{ marginBottom: 12 }}>Top 3 tasks you actually did</h3>
          {[1, 2, 3].map((n) => (
            <div className="field" key={n}>
              <label>Task {n}</label>
              <input type="text" value={f[`done_task_${n}`]}
                onChange={(e) => set(`done_task_${n}`)(e.target.value)} />
            </div>
          ))}
          <div className="field">
            <label>Why was there a difference? (or what made you stay on track?)</label>
            <textarea value={f.task_difference_reason}
              onChange={(e) => set('task_difference_reason')(e.target.value)} />
          </div>
        </div>
      )}

      {/* Step 2 – Part B */}
      {step === 2 && (
        <div className="card">
          <h2 style={{ marginBottom: 4 }}>Energy & Focus Map</h2>
          <p className="muted" style={{ marginBottom: 16 }}>Rate each time block and note your main activity.</p>
          {f.energy_focus_map.map((block, i) => (
            <div className="ef-block" key={block.block}>
              <div className="ef-block-header">{block.block}</div>
              <div className="ef-scores">
                <div className="ef-score-item">
                  <div className="field" style={{ marginBottom: 0 }}>
                    <label>Energy — {block.energy}/5</label>
                    <input type="range" min="1" max="5" value={block.energy}
                      onChange={(e) => setEF(i, 'energy', Number(e.target.value))} />
                  </div>
                </div>
                <div className="ef-score-item">
                  <div className="field" style={{ marginBottom: 0 }}>
                    <label>Focus — {block.focus}/5</label>
                    <input type="range" min="1" max="5" value={block.focus}
                      onChange={(e) => setEF(i, 'focus', Number(e.target.value))} />
                  </div>
                </div>
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Main activity</label>
                <input type="text" value={block.activity}
                  onChange={(e) => setEF(i, 'activity', e.target.value)}
                  placeholder="What were you doing?" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Step 3 – Part C */}
      {step === 3 && (
        <div className="card">
          <div className="field">
            <label>What was easiest today?</label>
            <textarea value={f.easiest_thing} onChange={(e) => set('easiest_thing')(e.target.value)} />
          </div>
          <div className="field">
            <label>What conditions made it easy?</label>
            <textarea value={f.easiest_conditions} onChange={(e) => set('easiest_conditions')(e.target.value)} />
          </div>
          <div className="field">
            <label>What was hardest today?</label>
            <textarea value={f.hardest_thing} onChange={(e) => set('hardest_thing')(e.target.value)} />
          </div>
          <div className="field">
            <label>Hyperfocus moment — what happened?</label>
            <textarea value={f.hyperfocus_moment} onChange={(e) => set('hyperfocus_moment')(e.target.value)} />
          </div>
          <div className="field">
            <label>What triggered the hyperfocus?</label>
            <input type="text" value={f.hyperfocus_trigger}
              onChange={(e) => set('hyperfocus_trigger')(e.target.value)} />
          </div>
          <div className="field">
            <label>Avoidance or procrastination moment</label>
            <textarea value={f.avoidance_moment} onChange={(e) => set('avoidance_moment')(e.target.value)} />
          </div>
        </div>
      )}

      {/* Step 4 – Part D */}
      {step === 4 && (
        <div className="card">
          <div className="field">
            <label>Where did you work/spend most of your day?</label>
            <input type="text" value={f.work_location}
              onChange={(e) => set('work_location')(e.target.value)} />
          </div>
          <div className="field">
            <label>Was it helpful? Why or why not?</label>
            <textarea value={f.location_helpful}
              onChange={(e) => set('location_helpful')(e.target.value)} />
          </div>
          <div className="field">
            <label>Sleep hours last night</label>
            <input type="number" min="0" max="24" step="0.5" value={f.sleep_hours}
              onChange={(e) => set('sleep_hours')(e.target.value)} placeholder="e.g. 7.5" />
          </div>
          <div className="field">
            <label>Ate regularly today?</label>
            <div className="yn-group">
              <button type="button" className={`yn-btn ${f.ate_regularly === true ? 'active-yes' : ''}`}
                onClick={() => set('ate_regularly')(true)}>Yes</button>
              <button type="button" className={`yn-btn ${f.ate_regularly === false ? 'active-no' : ''}`}
                onClick={() => set('ate_regularly')(false)}>No</button>
            </div>
          </div>
          <div className="field">
            <label>Moved your body?</label>
            <div className="yn-group">
              <button type="button" className={`yn-btn ${f.moved_body === true ? 'active-yes' : ''}`}
                onClick={() => set('moved_body')(true)}>Yes</button>
              <button type="button" className={`yn-btn ${f.moved_body === false ? 'active-no' : ''}`}
                onClick={() => set('moved_body')(false)}>No</button>
            </div>
          </div>
          <div className="field">
            <label>Any notes on food / movement</label>
            <textarea value={f.lifestyle_notes}
              onChange={(e) => set('lifestyle_notes')(e.target.value)} />
          </div>
          <div className="field">
            <label>ADHD medication taken today?</label>
            <div className="yn-group">
              <button type="button" className={`yn-btn ${f.medication_taken === true ? 'active-yes' : ''}`}
                onClick={() => set('medication_taken')(true)}>Yes</button>
              <button type="button" className={`yn-btn ${f.medication_taken === false ? 'active-no' : ''}`}
                onClick={() => set('medication_taken')(false)}>No</button>
            </div>
          </div>
          <div className="field">
            <label>Medication notes (optional)</label>
            <input type="text" value={f.medication_notes}
              onChange={(e) => set('medication_notes')(e.target.value)} />
          </div>
        </div>
      )}

      {/* Step 5 – Part E */}
      {step === 5 && (
        <div className="card">
          <div className="field">
            <label>One thing that went well today</label>
            <textarea value={f.went_well} onChange={(e) => set('went_well')(e.target.value)} />
          </div>
          <div className="field">
            <label>One thing you would do differently</label>
            <textarea value={f.to_change} onChange={(e) => set('to_change')(e.target.value)} />
          </div>
          <div className="field">
            <label>One task carried over to tomorrow</label>
            <input type="text" value={f.carried_task}
              onChange={(e) => set('carried_task')(e.target.value)} />
          </div>
          <div className="field">
            <label>How do you feel internally right now? (2–3 words)</label>
            <input type="text" value={f.internal_experience}
              onChange={(e) => set('internal_experience')(e.target.value)}
              placeholder="e.g. tired, scattered, proud" />
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="stepper-btns">
        {step > 0 && (
          <button type="button" className="btn btn-ghost"
            onClick={() => setStep((s) => s - 1)}>← Back</button>
        )}
        {step < STEPS.length - 1 ? (
          <button type="button" className="btn btn-primary"
            onClick={() => setStep((s) => s + 1)}>Next →</button>
        ) : (
          <>
            <button type="button" className="btn btn-secondary" onClick={() => save(false)}>Save draft</button>
            <button type="button" className="btn btn-primary" onClick={() => save(true)}>Submit ✓</button>
          </>
        )}
      </div>

      {step < STEPS.length - 1 && (
        <button type="button" className="btn btn-ghost" style={{ marginTop: 10 }}
          onClick={() => save(false)}>Save draft</button>
      )}
    </FormWrapper>
  );
}
