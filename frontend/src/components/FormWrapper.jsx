import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';

export default function FormWrapper({ title, status, lastSaved, children }) {
  return (
    <div className="page">
      <Link to="/" className="back-link">← Dashboard</Link>
      <div className="form-topbar">
        <h1>{title}</h1>
        <StatusBadge status={status} />
      </div>
      {lastSaved && (
        <p className="autosave-note">
          Auto-saved locally at {lastSaved.toLocaleTimeString()}
        </p>
      )}
      {children}
    </div>
  );
}
