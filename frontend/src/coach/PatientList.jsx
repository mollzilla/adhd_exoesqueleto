import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import AddPatientModal from './components/AddPatientModal';

function FormsBar({ count }) {
  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.75rem', color: 'var(--muted)', marginBottom: 3 }}>
        <span>Forms submitted</span>
        <span>{count} / 6</span>
      </div>
      <div className="forms-bar">
        <div className="forms-bar-fill" style={{ width: `${(count / 6) * 100}%` }} />
      </div>
    </div>
  );
}

function timeAgo(ts) {
  if (!ts) return 'No activity yet';
  const diff = Date.now() - new Date(ts).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  return `${d} days ago`;
}

export default function PatientList() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  async function load() {
    try {
      const data = await api.get('/coach/patients');
      setPatients(data);
    } catch { /* already redirected by client on 401 */ }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function removePatient(id, name) {
    if (!window.confirm(`Remove ${name} from your patient list?`)) return;
    try {
      await api.delete(`/coach/patients/${id}`);
      setPatients(ps => ps.filter(p => p.id !== id));
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="coach-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem' }}>Your patients</h1>
          <p className="muted" style={{ fontSize: '.88rem' }}>Signed in as {user?.name}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" style={{ width: 'auto', padding: '10px 18px' }} onClick={() => setShowModal(true)}>
            + Add patient
          </button>
          <button className="btn btn-ghost" style={{ width: 'auto', padding: '10px 16px' }} onClick={logout}>
            Sign out
          </button>
        </div>
      </div>

      {loading ? (
        <div className="spinner">Loading…</div>
      ) : patients.length === 0 ? (
        <div className="empty-state">
          <p style={{ marginBottom: 16 }}>No patients assigned yet.</p>
          <button className="btn btn-primary" style={{ width: 'auto', margin: '0 auto' }} onClick={() => setShowModal(true)}>
            + Add your first patient
          </button>
        </div>
      ) : (
        <div className="patient-grid">
          {patients.map((p) => (
            <Link key={p.id} to={`/coach/patients/${p.id}`} className="patient-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <h2>{p.name}</h2>
                <button
                  className="remove-patient-btn"
                  title="Remove patient"
                  onClick={e => { e.preventDefault(); e.stopPropagation(); removePatient(p.id, p.name); }}
                >✕</button>
              </div>
              <p className="muted" style={{ fontSize: '.82rem' }}>{p.email}</p>
              <p className="muted" style={{ fontSize: '.8rem' }}>{timeAgo(p.last_activity)}</p>
              <FormsBar count={p.forms_submitted} />
              {p.recent_notes_count > 0 && (
                <span className="badge badge-submitted" style={{ alignSelf: 'flex-start', marginTop: 4 }}>
                  {p.recent_notes_count} new note{p.recent_notes_count > 1 ? 's' : ''}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <AddPatientModal
          onClose={() => setShowModal(false)}
          onSuccess={async () => { setShowModal(false); setLoading(true); await load(); }}
        />
      )}
    </div>
  );
}
