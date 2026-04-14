import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../api/client'
import { PageHero } from '../components/PageHero'
import { useAuth } from '../contexts/AuthContext'
import { ALIGNMENTS, SRD_BACKGROUNDS, SRD_CLASSES, SRD_LINEAGES } from '../data/srdOptions'
import {
  buildCharacterSheetExport,
  buildLoadoutSummary,
  LEVEL_OPTIONS,
  RULESET_LABELS,
  RULESET_LINKS,
  type LoadoutMode,
  type RulesetId,
} from '../data/characterBuilderRules'
import type { Character, Party } from '../types'

type CharacterForm = {
  name: string
  lineage: string
  char_class: string
  background: string
  level: number
  alignment: string
  ruleset: RulesetId
  loadout_mode: LoadoutMode
  party_id: string
  shared_with_party: boolean
  custom_backstory: string
}

const CHARACTER_SHEET_EXPORT_KEY = 'dndhub_character_sheet_export'

const initialForm: CharacterForm = {
  name: '',
  lineage: 'Human',
  char_class: 'Fighter',
  background: 'Soldier',
  level: 1,
  alignment: 'Neutral',
  ruleset: 'srd2024',
  loadout_mode: 'starting_equipment',
  party_id: '',
  shared_with_party: false,
  custom_backstory: '',
}

function buildSheetData(form: CharacterForm) {
  const exportData = buildCharacterSheetExport({
    name: form.name,
    lineage: form.lineage,
    charClass: form.char_class,
    background: form.background,
    alignment: form.alignment,
    level: form.level,
    ruleset: form.ruleset,
    loadoutMode: form.loadout_mode,
    customBackstory: form.custom_backstory,
  })

  return {
    source_mode: 'srd',
    ruleset: form.ruleset,
    loadout_mode: form.loadout_mode,
    character_sheet_export: exportData,
    custom_backstory: form.custom_backstory,
  }
}

function sheetText(sheetData: Record<string, unknown> | undefined, key: string): string {
  const value = sheetData?.[key]
  return typeof value === 'string' ? value : ''
}

function sheetExport(item: Character): Record<string, unknown> | null {
  const value = item.sheet_data?.character_sheet_export
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function formFromCharacter(item: Character): CharacterForm {
  return {
    name: item.name,
    lineage: item.lineage,
    char_class: item.char_class,
    background: item.background,
    level: item.level,
    alignment: item.alignment,
    ruleset: sheetText(item.sheet_data, 'ruleset') === 'srd2014' ? 'srd2014' : 'srd2024',
    loadout_mode: sheetText(item.sheet_data, 'loadout_mode') === 'starting_gold' ? 'starting_gold' : 'starting_equipment',
    party_id: item.party_id ? String(item.party_id) : '',
    shared_with_party: item.shared_with_party,
    custom_backstory: sheetText(item.sheet_data, 'custom_backstory'),
  }
}

function exportToCharacterSheet(payload: Record<string, unknown>) {
  localStorage.setItem(CHARACTER_SHEET_EXPORT_KEY, JSON.stringify(payload))
}

export function CharactersPage() {
  const [items, setItems] = useState<Character[]>([])
  const [parties, setParties] = useState<Party[]>([])
  const [form, setForm] = useState<CharacterForm>(initialForm)
  const [editForm, setEditForm] = useState<CharacterForm>(initialForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()

  async function load() {
    setIsLoading(true)
    try {
      const [characterData, partyData] = await Promise.all([
        apiFetch<Character[]>('/characters'),
        apiFetch<Party[]>('/parties'),
      ])
      setItems(characterData)
      setParties(partyData)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const loadoutPreview = useMemo(
    () => buildLoadoutSummary(form.ruleset, form.loadout_mode, form.char_class, form.background, form.level),
    [form],
  )

  async function createCharacter(e: FormEvent, exportAfterSave: boolean) {
    e.preventDefault()
    setMessage('')
    const payload = {
      ...form,
      party_id: form.party_id ? Number(form.party_id) : null,
      sheet_data: buildSheetData(form),
    }

    const created = await apiFetch<Character>('/characters', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    if (exportAfterSave) {
      exportToCharacterSheet(
        buildCharacterSheetExport({
          name: created.name,
          lineage: created.lineage,
          charClass: created.char_class,
          background: created.background,
          alignment: created.alignment,
          level: created.level,
          ruleset: form.ruleset,
          loadoutMode: form.loadout_mode,
          customBackstory: form.custom_backstory,
        }),
      )
      setMessage('Character saved and exported to the in-app character sheet.')
    } else {
      setMessage('Character saved to your account.')
    }

    setForm(initialForm)
    await load()
  }

  function beginEdit(item: Character) {
    setEditingId(item.id)
    setEditForm(formFromCharacter(item))
    setMessage('')
  }

  async function saveEdit(e: FormEvent) {
    e.preventDefault()
    if (!editingId) return
    setMessage('')
    const payload = {
      ...editForm,
      party_id: editForm.party_id ? Number(editForm.party_id) : null,
      sheet_data: buildSheetData(editForm),
    }

    await apiFetch<Character>(`/characters/${editingId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
    setEditingId(null)
    setEditForm(initialForm)
    setMessage('Character updated.')
    await load()
  }

  async function removeCharacter(item: Character) {
    const confirmed = window.confirm(`Delete ${item.name}?`)
    if (!confirmed) return
    await apiFetch(`/characters/${item.id}`, { method: 'DELETE' })
    setMessage('Character deleted.')
    await load()
  }

  async function cloneCharacter(item: Character) {
    await apiFetch<Character>(`/characters/${item.id}/clone`, { method: 'POST' })
    setMessage('Character cloned.')
    await load()
  }

  function exportSavedCharacter(item: Character) {
    const exported = sheetExport(item) ?? buildCharacterSheetExport({
      name: item.name,
      lineage: item.lineage,
      charClass: item.char_class,
      background: item.background,
      alignment: item.alignment,
      level: item.level,
      ruleset: formFromCharacter(item).ruleset,
      loadoutMode: formFromCharacter(item).loadout_mode,
      customBackstory: sheetText(item.sheet_data, 'custom_backstory'),
    })
    exportToCharacterSheet(exported)
    setMessage(`${item.name} exported to the in-app character sheet.`)
  }

  return (
    <div className="page-shell stack">
      <PageHero
        variant="characters"
        imageSrc="/character-page-banner.png"
        imageAlt="A fantasy adventuring party celebrating together in a tavern"
        eyebrow="Hero builder"
        title="Character Forge"
        description="Build SRD characters with a 2014/2024 ruleset toggle, choose starting equipment or starting gold, set any level from 1â€“20, and export the result into the in-app character sheet."
        tags={['2014 SRD', '2024 SRD', 'Levels 1â€“20', 'Sheet export']}
      >
        <div className="toolbar-row">
          <Link className="button-link secondary" to="/character-sheet">Open character sheet</Link>
        </div>
      </PageHero>

      <section className="grid two-col">
        <article className="card stack">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Builder</p>
              <h2>Create a character</h2>
              <p>Select a ruleset, choose starting equipment or gold, and export the finished build to the in-app sheet.</p>
            </div>
          </div>

          {message ? <div className="notice">{message}</div> : null}

          <form className="form-grid">
            <div className="form-section stack">
              <h3>Ruleset and level</h3>
              <div className="condition-toggle-row">
                {(['srd2014', 'srd2024'] as RulesetId[]).map((ruleset) => (
                  <button
                    key={ruleset}
                    type="button"
                    className={`button-link secondary condition-toggle ${form.ruleset === ruleset ? 'is-on' : ''}`}
                    onClick={() => setForm((current) => ({ ...current, ruleset }))}
                  >
                    {RULESET_LABELS[ruleset]}
                  </button>
                ))}
              </div>

              <div className="condition-toggle-row">
                {(['starting_equipment', 'starting_gold'] as LoadoutMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={`button-link secondary condition-toggle ${form.loadout_mode === mode ? 'is-on' : ''}`}
                    onClick={() => setForm((current) => ({ ...current, loadout_mode: mode }))}
                  >
                    {mode === 'starting_equipment' ? 'Starting Equipment' : 'Starting Gold'}
                  </button>
                ))}
              </div>

              <div className="form-inline">
                <label>
                  Character level
                  <select
                    value={form.level}
                    onChange={(e) => setForm((current) => ({ ...current, level: Number(e.target.value) }))}
                  >
                    {LEVEL_OPTIONS.map((level) => (
                      <option key={level} value={level}>Level {level}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Rules quick link
                  <a className="inline-link" href={RULESET_LINKS[form.ruleset]} target="_blank" rel="noreferrer">
                    Open selected ruleset
                  </a>
                </label>
              </div>
            </div>

            <div className="form-section stack">
              <h3>Character details</h3>
              <div className="form-inline">
                <label>
                  Character name
                  <input value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} />
                </label>
                <label>
                  Species / lineage
                  <select value={form.lineage} onChange={(e) => setForm((current) => ({ ...current, lineage: e.target.value }))}>
                    {SRD_LINEAGES.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
                <label>
                  Class
                  <select value={form.char_class} onChange={(e) => setForm((current) => ({ ...current, char_class: e.target.value }))}>
                    {SRD_CLASSES.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
                <label>
                  Background
                  <select value={form.background} onChange={(e) => setForm((current) => ({ ...current, background: e.target.value }))}>
                    {SRD_BACKGROUNDS.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
                <label>
                  Alignment
                  <select value={form.alignment} onChange={(e) => setForm((current) => ({ ...current, alignment: e.target.value }))}>
                    {ALIGNMENTS.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
                <label>
                  Party
                  <select value={form.party_id} onChange={(e) => setForm((current) => ({ ...current, party_id: e.target.value }))}>
                    <option value="">No party</option>
                    {parties.map((party) => <option key={party.id} value={party.id}>{party.name}</option>)}
                  </select>
                </label>
              </div>

              <label>
                Backstory / notes
                <textarea
                  value={form.custom_backstory}
                  onChange={(e) => setForm((current) => ({ ...current, custom_backstory: e.target.value }))}
                  placeholder="Add backstory, feature notes, proficiencies, or equipment choices."
                />
              </label>

              <label className="checkbox-line">
                <input
                  type="checkbox"
                  checked={form.shared_with_party}
                  onChange={(e) => setForm((current) => ({ ...current, shared_with_party: e.target.checked }))}
                />
                Share with party
              </label>
            </div>

            <div className="form-section stack">
              <h3>Rules-aware preview</h3>
              <div className="chip-row">
                <span className="tag">{RULESET_LABELS[form.ruleset]}</span>
                <span className="tag">{form.char_class}</span>
                <span className="tag">{form.background}</span>
                <span className="tag">Level {form.level}</span>
              </div>
              <ul className="stack-tight">
                {loadoutPreview.map((line) => <li key={line}>{line}</li>)}
              </ul>
            </div>

            <div className="action-row">
              <button type="button" onClick={(e) => void createCharacter(e as unknown as FormEvent, false)}>Save character</button>
              <button type="button" className="button-link secondary" onClick={(e) => void createCharacter(e as unknown as FormEvent, true)}>Save + export to sheet</button>
            </div>
          </form>
        </article>

        <article className="card stack">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Saved roster</p>
              <h2>Characters on this account</h2>
              <p>{isLoading ? 'Loading saved characters...' : 'Edit, clone, export, or delete saved characters.'}</p>
            </div>
          </div>

          {items.length === 0 && !isLoading ? <div className="notice">No characters yet.</div> : null}

          <div className="stack">
            {items.map((item) => {
              const isEditing = editingId === item.id
              const localForm = isEditing ? editForm : formFromCharacter(item)
              const isOwner = user?.id === item.owner_id
              return (
                <div key={item.id} className="list-item stack">
                  <div className="section-heading">
                    <div>
                      <strong>{item.name}</strong>
                      <div className="chip-row">
                        <span className="tag">{item.lineage}</span>
                        <span className="tag">{item.char_class}</span>
                        <span className="tag">{item.background}</span>
                        <span className="tag">Level {item.level}</span>
                        <span className="tag">{RULESET_LABELS[localForm.ruleset]}</span>
                      </div>
                    </div>
                    <div className="stack-tight item-meta">
                      <span className="field-hint">{item.alignment}</span>
                      {item.shared_with_party ? <span className="tag">Shared</span> : <span className="tag">Private</span>}
                    </div>
                  </div>

                  {sheetText(item.sheet_data, 'custom_backstory')
                    ? <small>{sheetText(item.sheet_data, 'custom_backstory')}</small>
                    : <small>No backstory saved.</small>}

                  <div className="action-row">
                    <button type="button" onClick={() => beginEdit(item)}>{isEditing ? 'Editing now' : 'Edit'}</button>
                    <button type="button" className="button-link secondary" onClick={() => exportSavedCharacter(item)}>Export to sheet</button>
                    {isOwner ? <button type="button" className="button-link secondary" onClick={() => void cloneCharacter(item)}>Clone</button> : null}
                    {isOwner ? <button type="button" className="button-link secondary danger-button" onClick={() => void removeCharacter(item)}>Delete</button> : null}
                  </div>

                  {isEditing ? (
                    <form onSubmit={saveEdit} className="form-grid inline-editor">
                      <div className="form-inline">
                        <label>
                          Character name
                          <input value={editForm.name} onChange={(e) => setEditForm((current) => ({ ...current, name: e.target.value }))} />
                        </label>
                        <label>
                          Ruleset
                          <select value={editForm.ruleset} onChange={(e) => setEditForm((current) => ({ ...current, ruleset: e.target.value as RulesetId }))}>
                            <option value="srd2014">2014 SRD 5.1</option>
                            <option value="srd2024">2024 SRD 5.2.1</option>
                          </select>
                        </label>
                        <label>
                          Level
                          <select value={editForm.level} onChange={(e) => setEditForm((current) => ({ ...current, level: Number(e.target.value) }))}>
                            {LEVEL_OPTIONS.map((level) => <option key={level} value={level}>Level {level}</option>)}
                          </select>
                        </label>
                        <label>
                          Loadout
                          <select value={editForm.loadout_mode} onChange={(e) => setEditForm((current) => ({ ...current, loadout_mode: e.target.value as LoadoutMode }))}>
                            <option value="starting_equipment">Starting Equipment</option>
                            <option value="starting_gold">Starting Gold</option>
                          </select>
                        </label>
                      </div>

                      <div className="form-inline">
                        <label>
                          Species / lineage
                          <select value={editForm.lineage} onChange={(e) => setEditForm((current) => ({ ...current, lineage: e.target.value }))}>
                            {SRD_LINEAGES.map((item) => <option key={item} value={item}>{item}</option>)}
                          </select>
                        </label>
                        <label>
                          Class
                          <select value={editForm.char_class} onChange={(e) => setEditForm((current) => ({ ...current, char_class: e.target.value }))}>
                            {SRD_CLASSES.map((item) => <option key={item} value={item}>{item}</option>)}
                          </select>
                        </label>
                        <label>
                          Background
                          <select value={editForm.background} onChange={(e) => setEditForm((current) => ({ ...current, background: e.target.value }))}>
                            {SRD_BACKGROUNDS.map((item) => <option key={item} value={item}>{item}</option>)}
                          </select>
                        </label>
                        <label>
                          Alignment
                          <select value={editForm.alignment} onChange={(e) => setEditForm((current) => ({ ...current, alignment: e.target.value }))}>
                            {ALIGNMENTS.map((item) => <option key={item} value={item}>{item}</option>)}
                          </select>
                        </label>
                      </div>

                      <label>
                        Backstory / notes
                        <textarea value={editForm.custom_backstory} onChange={(e) => setEditForm((current) => ({ ...current, custom_backstory: e.target.value }))} />
                      </label>

                      <div className="action-row">
                        <button type="submit">Save changes</button>
                        <button type="button" className="button-link secondary" onClick={() => setEditingId(null)}>Cancel</button>
                      </div>
                    </form>
                  ) : null}
                </div>
              )
            })}
          </div>
        </article>
      </section>
    </div>
  )
}
