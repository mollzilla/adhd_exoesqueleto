import { useState, useEffect } from 'react';
import api from '../../api/client';

const TAGS = [
  { value: 'observation', label: 'Observation', color: '#6C63FF' },
  { value: 'question',    label: 'Question',    color: '#F59E0B' },
  { value: 'pattern',     label: 'Pattern',     color: '#10B981' },
  { value: 'action_item', label: 'Action Item', color: '#EF4444' },
];

function tagColor(tag) {
  return TAGS.find(t => t.value === tag)?.color || '#6B7280';
}

function tagLabel(tag) {
  return TAGS.find(t => t.value === tag)?.label || tag;
}

function formatDate(ts) {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function CoachNotesTab({ patientId }) {
  const [notes, setNotes]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [content, setContent]   = useState('');
  const [tag, setTag]           = useState('observation');
  const [saving, setSaving]     = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editTag, setEditTag]   = useState('');

  useEffect(() => {
    api.get(`/coach/patients/${patientId}/notes`)
      .then(setNotes)
      .finally(() => setLoading(false));
  }, [patientId]);

  async function addNote() {
    if (!content.trim()) return;
    setSaving(true);
    try {
      const note = await api.post(`/coach/patients/${patientId}/notes`, { tag, content });
      setNotes(n => [note, ...n]);
      setContent('');
    } catch { /* stay */ }
    finally { setSaving(false); }
  }

  function startEdit(note) {
    setEditingId(note.id);
    setEditContent(note.content);
    setEditTag(note.tag);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditContent('');
    setEditTag('');
  }

  async function saveEdit(id) {
    try {
      const data = await api.put(`/coach/notes/${id}`, { content: editContent, tag: editTag });
      setNotes(n => n.map(note => note.id === id ? data : note));
      cancelEdit();
    } catch { /* stay */ }
  }

  async function deleteNote(id) {
    if (!window.confirm('Delete this note?')) return;
    try {
      await api.delete(`/coach/notes/${id}`);
      setNotes(n => n.filter(note => note.id !== id));
    } catch { /* stay */ }
  }

  if (loading) return <div className="spinner">Loading…</div>;

  return (
    <div>
      {/* Composer */}
      <div className="note-composer card">
        <div className="note-tag-row">
          {TAGS.map(t => (
            <button
              key={t.value}
              className="note-tag-btn"
              style={{
                borderColor: tag === t.value ? t.color : undefined,
                color: tag === t.value ? t.color : undefined,
                background: tag === t.value ? t.color + '15' : undefined,
              }}
              onClick={() => setTag(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Add a note about this patient…"
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addNote(); }}
        />
        <button className="btn btn-primary" onClick={addNote} disabled={saving || !content.trim()}>
          {saving ? 'Saving…' : 'Add Note'}
        </button>
        <p className="muted" style={{ fontSize: '.75rem', marginTop: 6 }}>Cmd+Enter to save · Only visible to coaches</p>
      </div>

      {/* Notes list */}
      {notes.length === 0 ? (
        <div className="empty-state">No notes yet.</div>
      ) : (
        notes.map(note => (
          <div key={note.id} className="note-card">
            <div className="note-card-header">
              <span style={{
                padding: '2px 10px', borderRadius: 20,
                background: tagColor(note.tag) + '20',
                color: tagColor(note.tag),
                fontSize: '.78rem', fontWeight: 700,
              }}>
                {tagLabel(note.tag)}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="note-card-date">{formatDate(note.created_at)}</span>
                <button className="note-action-btn" onClick={() => startEdit(note)}>Edit</button>
                <button className="note-action-btn" style={{ color: '#EF4444' }} onClick={() => deleteNote(note.id)}>Delete</button>
              </div>
            </div>

            {editingId === note.id ? (
              <div>
                <div className="note-tag-row" style={{ marginBottom: 8 }}>
                  {TAGS.map(t => (
                    <button key={t.value} className="note-tag-btn"
                      style={{
                        borderColor: editTag === t.value ? t.color : undefined,
                        color: editTag === t.value ? t.color : undefined,
                        background: editTag === t.value ? t.color + '15' : undefined,
                      }}
                      onClick={() => setEditTag(t.value)}>
                      {t.label}
                    </button>
                  ))}
                </div>
                <textarea
                  className="note-edit-area"
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  rows={4}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => saveEdit(note.id)}>Save</button>
                  <button className="btn btn-ghost"   style={{ flex: 1 }} onClick={cancelEdit}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className="note-content">{note.content}</div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
