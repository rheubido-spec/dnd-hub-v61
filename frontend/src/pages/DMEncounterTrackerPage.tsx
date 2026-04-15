import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../api/client'
import { PageHero } from '../components/PageHero'
import type { EncounterTrackerState } from '../types'

type ConditionKey =
  | 'blinded'
  | 'charmed'
  | 'deafened'
  | 'frightened'
  | 'grappled'
  | 'incapacitated'
  | 'invisible'
  | 'paralyzed'
  | 'petrified'
  | 'poisoned'
  | 'prone'
  | 'restrained'
  | 'stunned'
  | 'unconscious'

type Combatant = {
  id: string
  name: string
  initiative: number
  hp: string
  ac: string
  notes: string
  inTurnOrder: boolean
  greaterInvisibility: boolean
  exhaustionLevel: number
  conditions: Record<ConditionKey, boolean>
}

const CONDITION_LABELS: Record<ConditionKey, string> = {
  blinded: 'Blinded',
  charmed: 'Charmed',
  deafened: 'Deafened',
  frightened: 'Frightened',
  grappled: 'Grappled',
  incapacitated: 'Incapacitated',
  invisible: 'Invisible',
  paralyzed: 'Paralyzed',
  petrified: 'Petrified',
  poisoned: 'Poisoned',
  prone: 'Prone',
  restrained: 'Restrained',
  stunned: 'Stunned',
  unconscious: 'Unconscious',
}

function emptyConditions(): Record<ConditionKey, boolean> {
  return {
    blinded: false,
    charmed: false,
    deafened: false,
    frightened: false,
    grappled: false,
    incapacitated: false,
    invisible: false,
    paralyzed: false,
    petrified: false,
    poisoned: false,
    prone: false,
    restrained: false,
    stunned: false,
    unconscious: false,
  }
}

function makeCombatant(index: number): Combatant {
  return {
    id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
    name: `Combatant ${index + 1}`,
    initiative: 10,
    hp: '',
    ac: '',
    notes: '',
    inTurnOrder: true,
    greaterInvisibility: false,
    exhaustionLevel: 0,
    conditions: emptyConditions(),
  }
}

function buildDefaultCombatants(): Combatant[] {
  return [makeCombatant(0), makeCombatant(1), makeCombatant(2), makeCombatant(3)]
}

function normalizeConditions(value: unknown): Record<ConditionKey, boolean> {
  const raw = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  return {
    blinded: Boolean(raw.blinded),
    charmed: Boolean(raw.charmed),
    deafened: Boolean(raw.deafened),
    frightened: Boolean(raw.frightened),
    grappled: Boolean(raw.grappled),
    incapacitated: Boolean(raw.incapacitated),
    invisible: Boolean(raw.invisible),
    paralyzed: Boolean(raw.paralyzed),
    petrified: Boolean(raw.petrified),
    poisoned: Boolean(raw.poisoned),
    prone: Boolean(raw.prone),
    restrained: Boolean(raw.restrained),
    stunned: Boolean(raw.stunned),
    unconscious: Boolean(raw.unconscious),
  }
}

function normalizeCombatants(value: unknown): Combatant[] {
  if (!Array.isArray(value) || value.length === 0) return buildDefaultCombatants()

  return value.map((entry, index) => {
    const raw = entry && typeof entry === 'object' ? (entry as Record<string, unknown>) : {}
    return {
      id: typeof raw.id === 'string' && raw.id ? raw.id : makeCombatant(index).id,
      name: typeof raw.name === 'string' && raw.name ? raw.name : `Combatant ${index + 1}`,
      initiative: typeof raw.initiative === 'number' ? raw.initiative : Number(raw.initiative) || 0,
      hp: typeof raw.hp === 'string' ? raw.hp : '',
      ac: typeof raw.ac === 'string' ? raw.ac : '',
      notes: typeof raw.notes === 'string' ? raw.notes : '',
      inTurnOrder: raw.inTurnOrder === false ? false : true,
      greaterInvisibility: Boolean(raw.greaterInvisibility),
      exhaustionLevel: Math.max(0, Math.min(6, Number(raw.exhaustionLevel) || 0)),
      conditions: normalizeConditions(raw.conditions),
    }
  })
}

export function DMEncounterTrackerPage() {
  const [title, setTitle] = useState('Encounter Tracker')
  const [combatants, setCombatants] = useState<Combatant[]>(buildDefaultCombatants())
  const [savedStateId, setSavedStateId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    void loadTracker()
  }, [])

  async function loadTracker() {
    setIsLoading(true)
    setMessage('')
    try {
      const items = await apiFetch<EncounterTrackerState[]>('/tracker')
      const latest = items[0]

      if (!latest) {
        setSavedStateId(null)
        setTitle('Encounter Tracker')
        setCombatants(buildDefaultCombatants())
        return
      }

      setSavedStateId(latest.id)
      setTitle(typeof latest.title === 'string' && latest.title ? latest.title : 'Encounter Tracker')

      const rawCombatants =
        latest.tracker_data &&
        typeof latest.tracker_data === 'object' &&
        Array.isArray((latest.tracker_data as Record<string, unknown>).combatants)
          ? (latest.tracker_data as Record<string, unknown>).combatants
          : []

      setCombatants(normalizeCombatants(rawCombatants))
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to load tracker')
    } finally {
      setIsLoading(false)
    }
  }

  async function saveTracker() {
    setIsSaving(true)
    setMessage('')

    const payload = {
      title,
      tracker_data: {
        combatants,
      },
    }

    try {
      if (savedStateId) {
        const updated = await apiFetch<EncounterTrackerState>(`/tracker/${savedStateId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
        setSavedStateId(updated.id)
        setMessage('Tracker saved to your account.')
      } else {
        const created = await apiFetch<EncounterTrackerState>('/tracker', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        setSavedStateId(created.id)
        setMessage('Tracker saved to your account.')
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to save tracker')
    } finally {
      setIsSaving(false)
    }
  }

  function updateCombatant(id: string, patch: Partial<Combatant>) {
    setCombatants((current) =>
      current.map((item) => {
        if (item.id !== id) return item
        const updated = { ...item, ...patch }
        if (!updated.conditions.invisible) updated.greaterInvisibility = false
        if (updated.exhaustionLevel < 0) updated.exhaustionLevel = 0
        if (updated.exhaustionLevel > 6) updated.exhaustionLevel = 6
        return updated
      }),
    )
  }

  function toggleCondition(id: string, key: ConditionKey) {
    setCombatants((current) =>
      current.map((item) => {
        if (item.id !== id) return item
        const updated = {
          ...item,
          conditions: {
            ...item.conditions,
            [key]: !item.conditions[key],
          },
        }
        if (key === 'invisible' && updated.conditions.invisible === false) {
          updated.greaterInvisibility = false
        }
        return updated
      }),
    )
  }

  function addCombatant() {
    setCombatants((current) => [...current, makeCombatant(current.length)])
  }

  function removeCombatant(id: string) {
    setCombatants((current) => current.filter((item) => item.id !== id))
  }

  const activeCombatants = useMemo(
    () => [...combatants].filter((item) => item.inTurnOrder).sort((a, b) => b.initiative - a.initiative),
    [combatants],
  )

  const inactiveCombatants = useMemo(
    () => combatants.filter((item) => !item.inTurnOrder),
    [combatants],
  )

  const conditionKeys = Object.keys(CONDITION_LABELS) as ConditionKey[]

  return (
    <div className="page-shell stack">
     <PageHero
  eyebrow="DM Suite"
  title="Encounter Tracker"
  description="Track initiative, conditions, and notes — and now save the tracker to your account."
  imageSrc="/images/page-heroes/tracker.webp"
  imageAlt="Fantasy encounter tracker with initiative and status markers"
/>

      <div className="action-row">
        <button type="button" onClick={() => void saveTracker()} disabled={isSaving || isLoading}>
          {isSaving ? 'Saving...' : 'Save tracker'}
        </button>
        <button type="button" className="button-link secondary" onClick={() => void loadTracker()} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Reload saved tracker'}
        </button>
      </div>

      {message ? <div className="notice">{message}</div> : null}

      <section className="stack">
        <article className="card stack">
          <label>
            Tracker title
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>

          <div className="action-row">
            <button type="button" onClick={addCombatant}>
              Add combatant
            </button>
          </div>
        </article>

        <article className="card stack">
          <h2>Combatants</h2>

          {combatants.map((combatant) => (
            <div key={combatant.id} className="list-item stack">
              <div className="section-heading">
                <strong>{combatant.name}</strong>
                <button type="button" className="button-link secondary danger-button" onClick={() => removeCombatant(combatant.id)}>
                  Remove
                </button>
              </div>

              <div className="form-inline">
                <label>
                  Name
                  <input
                    value={combatant.name}
                    onChange={(e) => updateCombatant(combatant.id, { name: e.target.value })}
                  />
                </label>

                <label>
                  Initiative
                  <input
                    type="number"
                    value={combatant.initiative}
                    onChange={(e) => updateCombatant(combatant.id, { initiative: Number(e.target.value) || 0 })}
                  />
                </label>

                <label>
                  HP
                  <input
                    value={combatant.hp}
                    onChange={(e) => updateCombatant(combatant.id, { hp: e.target.value })}
                    placeholder="45 / 45"
                  />
                </label>

                <label>
                  AC
                  <input
                    value={combatant.ac}
                    onChange={(e) => updateCombatant(combatant.id, { ac: e.target.value })}
                    placeholder="16"
                  />
                </label>
              </div>

              <div className="action-row">
                <button
                  type="button"
                  className="button-link secondary"
                  onClick={() =>
                    updateCombatant(combatant.id, { inTurnOrder: !combatant.inTurnOrder })
                  }
                >
                  {combatant.inTurnOrder ? 'In Active Turn Order' : 'Out of Turn Order'}
                </button>

                <button
                  type="button"
                  className="button-link secondary"
                  onClick={() =>
                    updateCombatant(combatant.id, { greaterInvisibility: !combatant.greaterInvisibility })
                  }
                >
                  Greater Invisibility
                </button>
              </div>

              <div className="chip-row">
                {conditionKeys.map((key) => (
                  <button
                    key={key}
                    type="button"
                    className="button-link secondary"
                    onClick={() => toggleCondition(combatant.id, key)}
                  >
                    {CONDITION_LABELS[key]}
                  </button>
                ))}
              </div>

              <div className="action-row">
                <span className="tag">Exhaustion {combatant.exhaustionLevel}</span>
                <button
                  type="button"
                  className="button-link secondary"
                  onClick={() =>
                    updateCombatant(combatant.id, { exhaustionLevel: combatant.exhaustionLevel - 1 })
                  }
                >
                  -
                </button>
                <button
                  type="button"
                  className="button-link secondary"
                  onClick={() =>
                    updateCombatant(combatant.id, { exhaustionLevel: combatant.exhaustionLevel + 1 })
                  }
                >
                  +
                </button>
              </div>

              <label>
                Notes
                <textarea
                  value={combatant.notes}
                  onChange={(e) => updateCombatant(combatant.id, { notes: e.target.value })}
                  placeholder="Concentrating on bless"
                />
              </label>
            </div>
          ))}
        </article>

        <article className="card stack">
          <h2>{title}</h2>
          <p>{activeCombatants.length} active</p>

          {activeCombatants.map((combatant) => (
            <div key={combatant.id} className="list-item stack">
              <strong>{combatant.name}</strong>
              <div className="chip-row">
                <span className="tag">Init {combatant.initiative}</span>
                {combatant.ac ? <span className="tag">AC {combatant.ac}</span> : null}
                {combatant.hp ? <span className="tag">HP {combatant.hp}</span> : null}
                {combatant.exhaustionLevel > 0 ? <span className="tag">Exhaustion {combatant.exhaustionLevel}</span> : null}
                {Object.entries(combatant.conditions)
                  .filter(([, enabled]) => enabled)
                  .map(([key]) => (
                    <span key={key} className="tag">
                      {CONDITION_LABELS[key as ConditionKey]}
                    </span>
                  ))}
                {combatant.greaterInvisibility ? <span className="tag">Greater Invisibility</span> : null}
              </div>
              <small>Notes: {combatant.notes || '—'}</small>
            </div>
          ))}

          {inactiveCombatants.length > 0 ? (
            <>
              <h3>Inactive combatants</h3>
              {inactiveCombatants.map((combatant) => (
                <div key={combatant.id} className="list-item stack">
                  <strong>{combatant.name}</strong>
                  <div className="chip-row">
                    <span className="tag">Init {combatant.initiative}</span>
                    {combatant.ac ? <span className="tag">AC {combatant.ac}</span> : null}
                    {combatant.hp ? <span className="tag">HP {combatant.hp}</span> : null}
                  </div>
                  <small>Notes: {combatant.notes || '—'}</small>
                </div>
              ))}
            </>
          ) : null}
        </article>
      </section>
    </div>
  )
}
