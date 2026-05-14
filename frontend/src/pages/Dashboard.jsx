import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FORMS = [
  { path: '/forms/daily-report',      icon: '📋', title: 'Daily Self-Report',          desc: 'Energy, tasks & reflection' },
  { path: '/forms/routine-backlog',   icon: '🔁', title: 'Routine Backlog',             desc: 'Ongoing activities & habits' },
  { path: '/forms/postponed-backlog', icon: '⏳', title: 'Postponed Tasks',             desc: 'Things you\'ve been putting off' },
  { path: '/forms/goals-meeting',     icon: '🎯', title: 'Goals & Expectations',        desc: 'Meeting 1 — your ADHD profile' },
  { path: '/forms/reflection',        icon: '🔍', title: 'Between-Session Reflection',  desc: 'Patterns, backlog & goals' },
  { path: '/forms/week1-review',      icon: '🏁', title: 'Week 1 End Review',           desc: 'Learnings & Week 2 commitments' },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  if (user?.role === 'coach') return <Navigate to="/coach/patients" replace />;

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div>
          <h1>Hi, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="muted">Week 1 forms</p>
        </div>
        <button className="btn btn-ghost" style={{ width: 'auto', padding: '10px 14px' }} onClick={logout}>
          Sign out
        </button>
      </div>

      <div className="dash-grid">
        {FORMS.map((f) => (
          <Link key={f.path} to={f.path} className="form-link-card">
            <span className="icon">{f.icon}</span>
            <h3>{f.title}</h3>
            <p className="muted" style={{ fontSize: '.78rem' }}>{f.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
