type ChipPickerProps = {
  label: string
  options: string[]
  selected: string[]
  onToggle: (value: string) => void
  hint?: string
}

export function ChipPicker({ label, options, selected, onToggle, hint }: ChipPickerProps) {
  return (
    <div className="stack-tight">
      <div>
        <strong className="chip-picker-label">{label}</strong>
        {hint ? <div className="field-hint">{hint}</div> : null}
      </div>
      <div className="chip-grid">
        {options.map((option) => {
          const active = selected.includes(option)
          return (
            <button
              key={option}
              type="button"
              className={`chip-button${active ? ' active' : ''}`}
              onClick={() => onToggle(option)}
              aria-pressed={active}
            >
              {option}
            </button>
          )
        })}
      </div>
    </div>
  )
}
