export default function DynamicTable({ columns, rows, onChange, onAdd, onRemove }) {
  function updateCell(rowIdx, field, value) {
    const next = rows.map((r, i) => (i === rowIdx ? { ...r, [field]: value } : r));
    onChange(next);
  }

  return (
    <div>
      <div className="table-wrap">
        <table className="dyn-table">
          <thead>
            <tr>
              {columns.map((c) => <th key={c.key}>{c.label}</th>)}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                {columns.map((col) => (
                  <td key={col.key} style={{ minWidth: col.width || 120 }}>
                    {col.type === 'select' ? (
                      <select value={row[col.key] || ''} onChange={(e) => updateCell(ri, col.key, e.target.value)}>
                        <option value="">—</option>
                        {col.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    ) : col.type === 'textarea' ? (
                      <textarea
                        value={row[col.key] || ''}
                        onChange={(e) => updateCell(ri, col.key, e.target.value)}
                        rows={2}
                      />
                    ) : col.type === 'number' ? (
                      <input
                        type="number"
                        min={col.min}
                        max={col.max}
                        value={row[col.key] || ''}
                        onChange={(e) => updateCell(ri, col.key, e.target.value)}
                      />
                    ) : (
                      <input
                        type="text"
                        value={row[col.key] || ''}
                        onChange={(e) => updateCell(ri, col.key, e.target.value)}
                      />
                    )}
                  </td>
                ))}
                <td>
                  <button type="button" className="del-btn" onClick={() => onRemove(ri)} title="Remove row">×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" className="btn btn-secondary add-row-btn" onClick={onAdd}>
        + Add row
      </button>
    </div>
  );
}
