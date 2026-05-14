import { useState, useEffect } from 'react';
import api from '../../api/client';

const SECTIONS = [
  {
    title: 'Your Patterns',
    fields: [
      { key: 'patterns_q1', q: 'What patterns did you notice in your energy and focus this week?' },
      { key: 'patterns_q2', q: 'When did you feel most capable and engaged? What were the conditions?' },
      { key: 'patterns_q3', q: 'What situations triggered avoidance, procrastination, or shutdown?' },
      { key: 'patterns_q4', q: 'How did your physical environment affect your ability to work?' },
    ],
  },
  {
    title: 'The Backlog',
    fields: [
      { key: 'backlog_q1', q: 'Which postponed tasks are weighing on you most emotionally, and why?' },
      { key: 'backlog_q2', q: 'Is there a pattern to the tasks that keep getting postponed?' },
      { key: 'backlog_q3', q: 'For the task avoided longest — what is the very next physical action?' },
      { key: 'backlog_q4', q: 'Are there items you could delegate, simplify, or drop entirely?' },
    ],
  },
  {
    title: 'Your Goals',
    fields: [
      { key: 'goals_q1', q: 'Did you accomplish your weekly goal? If not, what got in the way?' },
      { key: 'goals_q2', q: 'Does your 1-month goal still feel realistic and relevant?' },
      { key: 'goals_q3', q: 'What would need to change for next week to go 10% better?' },
      { key: 'goals_q4', q: 'What is one concrete commitment you\'re making before the next session?' },
    ],
  },
];

export default function ReflectionTab({ patientId }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/coach/patients/${patientId}/reflection`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [patientId]);

  if (loading) return <div className="spinner">Loading…</div>;
  if (!data)   return <div className="empty-state">Between-Session Reflection not submitted yet.</div>;

  return (
    <div className="report-doc">
      {SECTIONS.map(section => (
        <div key={section.title} className="report-section">
          <div className="report-section-title">{section.title}</div>
          {section.fields.map(({ key, q }) => {
            const value = data[key];
            if (!value) return null;
            return (
              <div key={key} className="ro-field">
                <div className="ro-field-label">{q}</div>
                <div className="ro-field-value">{value}</div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
