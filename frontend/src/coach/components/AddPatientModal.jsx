import { useState, useEffect, useRef } from 'react';
import api from '../../api/client';

export default function AddPatientModal({ onClose, onSuccess }) {
  const [email, setEmail]     = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/coach/patients', { email: email.trim() });
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add patient</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="patient-email">Patient email address</label>
            <input
              id="patient-email"
              ref={inputRef}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="patient@example.com"
              required
              autoComplete="off"
            />
          </div>
          {error && <div className="error-msg">{error}</div>}
          <button type="submit" className="btn btn-primary" disabled={loading || !email.trim()}>
            {loading ? 'Adding…' : 'Add patient'}
          </button>
        </form>
      </div>
    </div>
  );
}
