import { useState, useEffect } from 'react';
import api from '../../api/client';

const ROField = ({ label, value }) => {
  if (!value && value !== 0) return null;
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

const EF_LABELS = {
  task_initiation:      'Task initiation',
  transitions:          'Transitions',
  time_perception:      'Time perception',
  emotional_regulation: 'Emotional regulation',
  follow_through:       'Follow-through',
  organization:         'Organization',
  working_memory:       'Working memory',
};

export default function GoalsMeetingTab({ patientId }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/coach/patients/${patientId}/goals-meeting`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [patientId]);

  if (loading) return <div className="spinner">Loading…</div>;
  if (!data)   return <div className="empty-state">Goals & Expectations form not submitted yet.</div>;

  const d = data;
  const efList = Array.isArray(d.ef_challenges)
    ? d.ef_challenges.map(k => EF_LABELS[k] || k).join(', ')
    : null;

  return (
    <div className="report-doc">
      <Section title="Life Areas Reflection">
        <ROField label="Work"            value={d.life_work} />
        <ROField label="Home"            value={d.life_home} />
        <ROField label="Health"          value={d.life_health} />
        <ROField label="Relationships"   value={d.life_relationships} />
        <ROField label="Finance"         value={d.life_finance} />
        <ROField label="Personal growth" value={d.life_personal_growth} />
      </Section>

      <Section title="ADHD Profile">
        <ROField label="When most alive / focused" value={d.most_alive_focused} />
        <ROField label="Peak time of day"          value={d.peak_time} />
        <ROField label="Hyperfocus triggers"       value={d.hyperfocus_triggers} />
        <ROField label="Executive function challenges" value={efList} />
        <ROField label="Strategies tried"          value={d.strategies_tried} />
      </Section>

      <Section title="Goal Setting">
        <ROField label="3-month goal" value={d.goal_3months} />
        <ROField label="1-month goal" value={d.goal_1month} />
        <ROField label="This week"    value={d.goal_this_week} />
      </Section>

      <Section title="Coaching Framework">
        <ROField label="Session frequency"  value={d.session_frequency} />
        <ROField label="Feedback style"     value={d.feedback_style} />
        <ROField label="Accountability format" value={d.accountability_format} />
        <ROField label="Coach should NOT"   value={d.coach_not_to_do} />
      </Section>
    </div>
  );
}
