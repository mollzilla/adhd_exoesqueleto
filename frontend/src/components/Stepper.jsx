export default function Stepper({ steps, current, onChange }) {
  return (
    <div>
      <div className="stepper-nav">
        {steps.map((label, i) => (
          <div key={i} style={{ display: 'contents' }}>
            {i > 0 && <div className="step-line" />}
            <button
              className={`step-dot ${i === current ? 'active' : i < current ? 'done' : ''}`}
              onClick={() => onChange(i)}
              title={label}
              type="button"
            >
              {i < current ? '✓' : i + 1}
            </button>
          </div>
        ))}
      </div>
      <p className="step-label">{steps[current]}</p>
    </div>
  );
}
