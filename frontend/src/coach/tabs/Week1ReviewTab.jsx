import { useState, useEffect } from 'react';
import api from '../../api/client';

const ROField = ({ label, value }) => {
  if (!value) return null;
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

export default function Week1ReviewTab({ patientId }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/coach/patients/${patientId}/week1-review`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [patientId]);

  if (loading) return <div className="spinner">Loading…</div>;
  if (!data)   return <div className="empty-state">Week 1 End Review not submitted yet.</div>;

  return (
    <div className="report-doc">
      <Section title="Looking Back at Week 1">
        <ROField label="Most valuable self-learning"        value={data.most_valuable_learning} />
        <ROField label="Hardest part"                      value={data.hardest_part} />
        <ROField label="Was the strategy realistic?"        value={data.strategy_realistic} />
        <ROField label="Focus for Week 2"                  value={data.week2_focus} />
      </Section>

      <Section title="Meeting 2 Commitments">
        <ROField label="Environmental / structural change"  value={data.environmental_change} />
        <ROField label="Micro-habit"                       value={data.micro_habit} />
        <ROField label="First backlog step"                value={data.first_backlog_step} />
        <ROField label="Progress reporting format"         value={data.progress_reporting} />
      </Section>
    </div>
  );
}
