export default function StatusBadge({ status }) {
  if (!status) return null;
  const map = {
    submitted: { cls: 'badge-submitted', label: 'Submitted ✓' },
    draft:     { cls: 'badge-draft',     label: 'Draft'        },
    saving:    { cls: 'badge-saving',    label: 'Saving…'      },
    error:     { cls: 'badge-error',     label: 'Error'        },
  };
  const { cls, label } = map[status] || map.draft;
  return <span className={`badge ${cls}`}>{label}</span>;
}
