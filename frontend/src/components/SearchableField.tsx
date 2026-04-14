type SearchableFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder?: string
  hint?: string
  listId: string
}

export function SearchableField({ label, value, onChange, options, placeholder, hint, listId }: SearchableFieldProps) {
  return (
    <label>
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        list={listId}
        autoComplete="off"
      />
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  )
}
