
import { useState } from 'react'

type AccordionSectionProps = {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

export function AccordionSection({ title, children, defaultOpen = false }: AccordionSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section className={`accordion-section ${open ? 'open' : ''}`}>
      <button
        type="button"
        className="accordion-toggle"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        <span>{title}</span>
        <span className="accordion-symbol">{open ? '−' : '+'}</span>
      </button>
      {open ? <div className="accordion-content">{children}</div> : null}
    </section>
  )
}
