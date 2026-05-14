import { useState, useEffect, useRef } from 'react';
import api from '../../api/client';
import EnergyFocusBar from '../components/EnergyFocusBar';

const ROField = ({ label, value }) => {
  if (value == null || value === '') return null;
  return (
    <div className="ro-field">
      <div className="ro-field-label">{label}</div>
      <div className="ro-field-value">{value}</div>
    </div>
  );
};

const Section = ({ title, children }) => (
  <div className="report-section">
    <div className="report-section-title">{title}</div>
    {children}
  </div>
);

function ReportDocument({ r }) {
  const efMap = Array.isArray(r.energy_focus_map) ? r.energy_focus_map : [];
  return (
    <div className="report-doc">
      <div className="report-doc-header">
        <h2>{r.day_name || r.report_date}</h2>
        <span className="report-date">{r.report_date}</span>
        <span className="mood-score-large">Mood {r.mood_score}/10</span>
      </div>

      <Section title="Part A — Morning">
        <ROField label="Wake-up" value={r.wake_up_time} />
        <ROField label="First 30 minutes" value={r.first_30min} />
        <ROField label="Intended tasks" value={[r.intended_task_1, r.intended_task_2, r.intended_task_3].filter(Boolean).join('  ·  ')} />
        <ROField label="Done tasks" value={[r.done_task_1, r.done_task_2, r.done_task_3].filter(Boolean).join('  ·  ')} />
        <ROField label="Why different?" value={r.task_difference_reason} />
      </Section>

      {efMap.length > 0 && (
        <Section title="Part B — Energy & Focus Map">
          <EnergyFocusBar map={efMap} />
        </Section>
      )}

      <Section title="Part C — Reflections">
        <ROField label="Easiest thing" value={r.easiest_thing} />
        <ROField label="Conditions that helped" value={r.easiest_conditions} />
        <ROField label="Hardest thing" value={r.hardest_thing} />
        <ROField label="Hyperfocus moment" value={r.hyperfocus_moment} />
        <ROField label="Hyperfocus trigger" value={r.hyperfocus_trigger} />
        <ROField label="Avoidance moment" value={r.avoidance_moment} />
      </Section>

      <Section title="Part D — Lifestyle">
        <ROField label="Work location" value={r.work_location} />
        <ROField label="Was it helpful?" value={r.location_helpful} />
        <ROField label="Sleep hours" value={r.sleep_hours != null ? `${r.sleep_hours}h` : null} />
        <ROField label="Ate regularly" value={r.ate_regularly === true ? 'Yes' : r.ate_regularly === false ? 'No' : null} />
        <ROField label="Moved body" value={r.moved_body === true ? 'Yes' : r.moved_body === false ? 'No' : null} />
        <ROField label="Lifestyle notes" value={r.lifestyle_notes} />
        <ROField label="Medication taken" value={r.medication_taken === true ? 'Yes' : r.medication_taken === false ? 'No' : null} />
        <ROField label="Medication notes" value={r.medication_notes} />
      </Section>

      <Section title="Part E — Wrap-up">
        <ROField label="What went well" value={r.went_well} />
        <ROField label="One thing to change" value={r.to_change} />
        <ROField label="Carried to tomorrow" value={r.carried_task} />
        <ROField label="Internal experience" value={r.internal_experience} />
      </Section>
    </div>
  );
}

// Normalize any date value to "YYYY-MM-DD" so comparisons and URLs are stable
function toDateStr(val) {
  if (!val) return '';
  return String(val).slice(0, 10);
}

export default function DailyReportsTab({ patientId }) {
  const [history, setHistory]             = useState([]);
  const [selectedDate, setSelectedDate]   = useState(null);
  const [report, setReport]               = useState(null);
  const [loadingList, setLoadingList]     = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [fetchError, setFetchError]       = useState(null);
  const latestDateRef = useRef(null);

  useEffect(() => {
    api.get(`/coach/patients/${patientId}/daily-reports`)
      .then(data => setHistory(data.map(e => ({ ...e, report_date: toDateStr(e.report_date) }))))
      .finally(() => setLoadingList(false));
  }, [patientId]);

  async function selectDate(date) {
    const d = toDateStr(date);
    setSelectedDate(d);
    latestDateRef.current = d;
    setLoadingReport(true);
    setReport(null);
    setFetchError(null);
    try {
      const data = await api.get(`/coach/patients/${patientId}/daily-reports/${d}`);
      if (latestDateRef.current !== d) return; // stale — user already clicked another date
      if (data.energy_focus_map && typeof data.energy_focus_map === 'string') {
        data.energy_focus_map = JSON.parse(data.energy_focus_map);
      }
      setReport(data);
    } catch (err) {
      if (latestDateRef.current === d) {
        setFetchError(err.message || 'Could not load report');
      }
    } finally {
      if (latestDateRef.current === d) setLoadingReport(false);
    }
  }

  if (loadingList) return <div className="spinner">Loading…</div>;
  if (!history.length) return <div className="empty-state">No daily reports submitted yet.</div>;

  return (
    <div className="daily-tab-inner">
      <div className="date-list">
        {history.map((entry) => (
          <button
            key={entry.report_date}
            className={`date-list-item ${selectedDate === entry.report_date ? 'active' : ''}`}
            onClick={() => selectDate(entry.report_date)}
          >
            <span className="date-str">{entry.report_date}</span>
            <span className="mood-badge">😐 {entry.mood_score}/10</span>
            {entry.intended_task_1 && (
              <span className="task-preview">{entry.intended_task_1}</span>
            )}
            {entry.went_well && (
              <span className="win-preview">✓ {entry.went_well}</span>
            )}
          </button>
        ))}
      </div>

      <div className="report-panel">
        {!selectedDate && (
          <div className="empty-state">← Select a date to view the full report</div>
        )}
        {loadingReport && <div className="spinner">Loading report…</div>}
        {fetchError && (
          <div className="error-msg" style={{ margin: 0 }}>{fetchError}</div>
        )}
        {report && !loadingReport && <ReportDocument r={report} />}
      </div>
    </div>
  );
}
