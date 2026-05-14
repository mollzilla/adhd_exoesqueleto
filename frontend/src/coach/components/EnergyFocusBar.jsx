export default function EnergyFocusBar({ map }) {
  if (!Array.isArray(map) || !map.length) return null;
  return (
    <div className="ef-grid">
      {map.map((block) => (
        <div key={block.block} className="ef-grid-row">
          <div className="ef-block-label">{block.block}</div>
          <div className="ef-bars">
            <div className="ef-bar-row">
              <span>E</span>
              <div className="ef-bar-track">
                <div className="ef-bar energy" style={{ width: `${(block.energy / 5) * 100}%` }} />
              </div>
              <span>{block.energy}</span>
            </div>
            <div className="ef-bar-row">
              <span>F</span>
              <div className="ef-bar-track">
                <div className="ef-bar focus" style={{ width: `${(block.focus / 5) * 100}%` }} />
              </div>
              <span>{block.focus}</span>
            </div>
          </div>
          <div className="ef-activity">{block.activity}</div>
        </div>
      ))}
    </div>
  );
}
