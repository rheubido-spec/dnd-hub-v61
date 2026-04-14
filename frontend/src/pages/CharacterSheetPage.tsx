import { useEffect, useState } from 'react'
import { SourceBadge } from '../components/SourceBadge'
import { PageHero } from '../components/PageHero'

const CHARACTER_SHEET_EXPORT_KEY = 'dndhub_character_sheet_export'

type ExportPayload = {
  exported_at?: string
  name?: string
  lineage?: string
  char_class?: string
  background?: string
  alignment?: string
  level?: number
  ruleset_label?: string
  loadout_mode?: string
  proficiency_bonus?: number
  custom_backstory?: string
  loadout_summary?: string[]
}

export function CharacterSheetPage() {
  const [payload, setPayload] = useState<ExportPayload | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem(CHARACTER_SHEET_EXPORT_KEY)
    if (!raw) return
    try {
      setPayload(JSON.parse(raw))
    } catch {
      setPayload(null)
    }
  }, [])

  return (
    <div className="page-shell stack">
      <PageHero
        variant="characters"
        imageSrc="/art/character-sheet-banner.png"
        imageAlt="Fantasy adventurers training together in a castle courtyard"
        eyebrow="Quick access sheet"
        title="Fillable Character Sheet"
        description="Open the fillable PDF, review the latest exported builder data, and print or save from the in-app sheet page."
        tags={['PDF sheet', 'Builder export', 'Print-ready']}
      >
        <div className="toolbar-row">
          <a className="button-link" href="/fillable-character-sheet-2024.pdf" target="_blank" rel="noreferrer">Open fillable PDF</a>
          <a className="button-link secondary" href="/fillable-character-sheet-2024.pdf" download>Download PDF</a>
          <SourceBadge tone="official" label="Uploaded sheet" />
        </div>
      </PageHero>

      <article className="card stack">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Latest builder export</p>
            <h2>Character summary</h2>
            <p>The builder can export the selected character into this in-app sheet summary for printing or saving.</p>
          </div>
        </div>

        {payload ? (
          <div className="stack">
            <div className="chip-row">
              {payload.ruleset_label ? <span className="tag">{payload.ruleset_label}</span> : null}
              {payload.level ? <span className="tag">Level {payload.level}</span> : null}
              {payload.proficiency_bonus ? <span className="tag">PB +{payload.proficiency_bonus}</span> : null}
              {payload.loadout_mode ? <span className="tag">{payload.loadout_mode === 'starting_gold' ? 'Starting Gold' : 'Starting Equipment'}</span> : null}
            </div>
            <div className="form-inline">
              <div className="form-section stack-tight"><strong>Name</strong><span>{payload.name || 'â€”'}</span></div>
              <div className="form-section stack-tight"><strong>Species / lineage</strong><span>{payload.lineage || 'â€”'}</span></div>
              <div className="form-section stack-tight"><strong>Class</strong><span>{payload.char_class || 'â€”'}</span></div>
              <div className="form-section stack-tight"><strong>Background</strong><span>{payload.background || 'â€”'}</span></div>
              <div className="form-section stack-tight"><strong>Alignment</strong><span>{payload.alignment || 'â€”'}</span></div>
            </div>
            <div className="form-section stack">
              <strong>Loadout preview</strong>
              <ul className="stack-tight">
                {(payload.loadout_summary ?? []).map((line) => <li key={line}>{line}</li>)}
              </ul>
            </div>
            <div className="form-section stack">
              <strong>Backstory / notes</strong>
              <p>{payload.custom_backstory || 'No notes exported yet.'}</p>
            </div>
          </div>
        ) : (
          <div className="notice">No character has been exported yet. Open the Character Forge and use â€œSave + export to sheetâ€ or â€œExport to sheetâ€ on a saved character.</div>
        )}
      </article>

      <article className="card stack">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Embedded preview</p>
            <h2>Character sheet viewer</h2>
            <p>Use the PDF viewer below for quick reference, or open the full file for the best fillable-form experience.</p>
          </div>
          <div className="section-tags">
            <span className="tag">PDF quick link</span>
            <span className="tag">Fillable form</span>
          </div>
        </div>
        <div className="pdf-frame-wrap">
          <iframe title="Fillable character sheet PDF" src="/fillable-character-sheet-2024.pdf" className="pdf-frame" />
        </div>
      </article>
    </div>
  )
}
