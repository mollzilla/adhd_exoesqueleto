import { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';

const DailyReportsTab   = lazy(() => import('./tabs/DailyReportsTab'));
const RoutineBacklogTab = lazy(() => import('./tabs/RoutineBacklogTab'));
const PostponedBacklogTab = lazy(() => import('./tabs/PostponedBacklogTab'));
const GoalsMeetingTab   = lazy(() => import('./tabs/GoalsMeetingTab'));
const ReflectionTab     = lazy(() => import('./tabs/ReflectionTab'));
const Week1ReviewTab    = lazy(() => import('./tabs/Week1ReviewTab'));
const CoachNotesTab     = lazy(() => import('./tabs/CoachNotesTab'));

const TABS = [
  { id: 'daily',     label: 'Daily Reports',     Component: DailyReportsTab },
  { id: 'routine',   label: 'Routine Backlog',    Component: RoutineBacklogTab },
  { id: 'postponed', label: 'Postponed Backlog',  Component: PostponedBacklogTab },
  { id: 'goals',     label: 'Goals Meeting',      Component: GoalsMeetingTab },
  { id: 'reflection',label: 'Reflection',         Component: ReflectionTab },
  { id: 'week1',     label: 'Week 1 Review',      Component: Week1ReviewTab },
  { id: 'notes',     label: 'Coach Notes',        Component: CoachNotesTab },
];

export default function PatientDashboard() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [activeTab, setActiveTab] = useState('daily');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/coach/patients/${id}`)
      .then(setPatient)
      .catch(() => setError('Could not load patient.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="spinner">Loading…</div>;
  if (error)   return <div className="error-msg" style={{ margin: 24 }}>{error}</div>;

  const { Component } = TABS.find(t => t.id === activeTab);

  return (
    <div className="coach-page">
      <Link to="/coach/patients" className="back-link">← All patients</Link>
      <div className="patient-header">
        <h1>{patient.name}</h1>
        <p className="muted">{patient.email}</p>
      </div>

      <div className="tab-bar">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="tab-content">
        <Suspense fallback={<div className="spinner">Loading…</div>}>
          <Component patientId={id} />
        </Suspense>
      </div>
    </div>
  );
}
