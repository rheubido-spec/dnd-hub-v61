import { useEffect, useState } from 'react'
import { PDFDocument } from 'pdf-lib'
import { SourceBadge } from '../components/SourceBadge'
import { PageHero } from '../components/PageHero'

const CHARACTER_SHEET_EXPORT_KEY = 'dndhub_character_sheet_export'
const CHARACTER_SHEET_PDF_URL = '/fillable-character-sheet-2024.pdf'

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

function safeText(value: unknown): string {
  return typeof value === 'string' ? value : value == null ? '' : String(value)
}

async function buildFilledCharacterSheet(payload: ExportPayload): Promise<Uint8Array> {
  const existingPdfBytes = await fetch(CHARACTER_SHEET_PDF_URL).then((res) => {
    if (!res.ok) throw new Error('Unable to load character sheet PDF')
    return res.arrayBuffer()
  })

  const pdfDoc = await PDFDocument.load(existingPdfBytes)
  const form = pdfDoc.getForm()

  const fieldMap: Record<string, string> = {
    CharacterName: safeText(payload.name),
    ClassLevel: [safeText(payload.char_class), payload.level ? String(payload.level) : '']
      .filter(Boolean)
      .join(' '),
    Background: safeText(payload.background),
    Race: safeText(payload.lineage),
    Alignment: safeText(payload.alignment),
    ProficiencBonus: payload.proficiency_bonus ? `+${payload.proficiency_bonus}` : '',
    PersonalityTraits: safeText(payload.custom_backstory),
    Equipment: Array.isArray(payload.loadout_summary) ? payload.loadout_summary.join('\n') : '',
    FeaturesAndTraits: safeText(payload.ruleset_label),
  }

  for (const [fieldName, value] of Object.entries(fieldMap)) {
    if (!value) continue
    try {
      const field = form.getTextField(fieldName)
      field.setText(value)
    } catch {
      // Ignore missing fields for now.
    }
  }

  form.flatten()
  return await pdfDoc.save()
}

export function CharacterSheetPage() {
  const [payload, setPayload] = useState<ExportPayload | null>(null)
  const [filledPdfUrl, setFilledPdfUrl] = useState<string>('')
  const [pdfMessage, setPdfMessage] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem(CHARACTER_SHEET_EXPORT_KEY)
    if (!raw) return

    try {
      setPayload(JSON.parse(raw))
    } catch {
      setPayload(null)
    }
  }, [])

  useEffect(() => {
    let objectUrl = ''

    async function generateFilledPdf() {
      if (!payload) {
        setFilledPdfUrl('')
        return
      }

      setIsGenerating(true)
      setPdfMessage('')

      try {
        const bytes = await buildFilledCharacterSheet(payload)
       const pdfBytes = bytes.slice()
const blob = new Blob([pdfBytes], { type: 'application/pdf' })
        objectUrl = URL.createObjectURL(blob)
        setFilledPdfUrl(objectUrl)
      } catch (error) {
        setFilledPdfUrl('')
        setPdfMessage(error instanceof Error ? error.message : 'Unable to generate filled PDF')
      } finally {
        setIsGenerating(false)
      }
    }

    void generateFilledPdf()

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [payload])

  return (
    <div className="page-shell stack">
      <PageHero
        variant="dashboard"
        imageSrc="/art/character-sheet-banner.png"
        imageAlt="A fantasy character sheet beside adventuring tools"
        eyebrow="Character tools"
        title="Character Sheet"
        description="View the latest builder export, then generate a filled PDF version of the sheet."
        tags={['Builder Export', 'PDF Autofill', 'Printable']}
      />

      <section className="grid two-col">
        <article className="card stack">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Latest builder export</p>
              <h2>Character summary</h2>
              <p>The builder can export the selected character into this in-app sheet summary for printing or saving.</p>
            </div>
            <div className="chip-row">
              {payload?.ruleset_label ? <SourceBadge label={payload.ruleset_label} /> : null}
              {payload?.level ? <span className="tag">Level {payload.level}</span> : null}
              {payload?.proficiency_bonus ? <span className="tag">PB +{payload.proficiency_bonus}</span> : null}
              {payload?.loadout_mode ? (
                <span className="tag">
                  {payload.loadout_mode === 'starting_gold' ? 'Starting Gold' : 'Starting Equipment'}
                </span>
              ) : null}
            </div>
          </div>

          {payload ? (
            <div className="stack">
              <div className="form-inline">
                <label>
                  Name
                  <input value={payload.name ?? '—'} readOnly />
                </label>
                <label>
                  Species / lineage
                  <input value={payload.lineage ?? '—'} readOnly />
                </label>
                <label>
                  Class
                  <input value={payload.char_class ?? '—'} readOnly />
                </label>
              </div>

              <div className="form-inline">
                <label>
                  Background
                  <input value={payload.background ?? '—'} readOnly />
                </label>
                <label>
                  Alignment
                  <input value={payload.alignment ?? '—'} readOnly />
                </label>
              </div>

              <div className="stack">
                <h3>Loadout preview</h3>
                <ul>
                  {(payload.loadout_summary ?? []).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>

              <div className="stack">
                <h3>Backstory / notes</h3>
                <div className="list-item">{payload.custom_backstory || 'No notes exported yet.'}</div>
              </div>
            </div>
          ) : (
            <div className="notice">
              No character has been exported yet. Open the Character Forge and use “Save + export to sheet” or
              “Export to sheet” on a saved character.
            </div>
          )}
        </article>

        <article className="card stack">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Embedded preview</p>
              <h2>Character sheet viewer</h2>
              <p>Use the generated filled PDF below, or open the original file for manual editing.</p>
            </div>
          </div>

          <div className="action-row">
            <a className="button-link secondary" href={CHARACTER_SHEET_PDF_URL} target="_blank" rel="noreferrer">
              Open original PDF
            </a>
            {filledPdfUrl ? (
              <a className="button-link secondary" href={filledPdfUrl} download="filled_character_sheet.pdf">
                Download filled PDF
              </a>
            ) : null}
          </div>

          {isGenerating ? <div className="notice">Generating filled PDF…</div> : null}
          {pdfMessage ? <div className="notice">{pdfMessage}</div> : null}

          {filledPdfUrl ? (
            <iframe
              title="Filled character sheet PDF preview"
              src={filledPdfUrl}
              style={{ width: '100%', minHeight: '900px', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '16px' }}
            />
          ) : (
            <div className="notice">No filled PDF available yet.</div>
          )}
        </article>
      </section>
    </div>
  )
}
