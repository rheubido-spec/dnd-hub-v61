import { useMemo, useState } from 'react'
import { PageHero } from '../components/PageHero'

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

const CONDITION_LINKS: Record<ConditionKey, string> = {
  blinded: 'https://www.dndbeyond.com/sources/dnd/br-2024/rules-glossary#BlindedCondition',
  charmed: 'https://www.dndbeyond.com/sources/dnd/br-2024/rules-glossary#CharmedCondition',
  deafened: 'https://www.dndbeyond.com/sources/dnd/br-2024/rules-glossary#DeafenedCondition',
  frightened: 'https://www.dndbeyond.com/sources/dnd/br-2024/rules-glossary#FrightenedCondition',
  grappled: 'https://www.dndbeyond.com/sources/dnd/br-2024/rules-glossary#GrappledCondition',
  incapacitated: 'https://www.dndbeyond.com/sources/dnd/br-2024/rules-glossary#IncapacitatedCondition',
  invisible: 'https://www.dndbeyond.com/sources/dnd/br-2024/rules-glossary#InvisibleCondition',
  paralyzed: 'https://www.dndbeyond.com/sources/dnd/br-2024/rules-glossary#ParalyzedCondition',
  petrified: 'https://www.dndbeyond.com/sources/dnd/br-2024/rules-glossary#PetrifiedCondition',
  poisoned: 'https://www.dndbeyond.com/sources/dnd/br-2024/rules-glossary#PoisonedCondition',
  prone: 'https://www.dndbeyond.com/sources/dnd/br-2024/rules-glossary#ProneCondition',
  restrained: 'https://www.dndbeyond.com/sources/dnd/br-2024/rules-glossary#RestrainedCondition',
  stunned: 'https://www.dndbeyond.com/sources/dnd/br-2024/rules-glossary#StunnedCondition',
  unconscious: 'https://www.dndbeyond.com/sources/dnd/br-2024/rules-glossary#UnconsciousCondition',
}

const EXHAUSTION_LINK =
  'https://www.dndbeyond.com/sources/dnd/br-2024/rules-glossary#ExhaustionCondition'

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

export function DMEncounterTrackerPage() {
  const [title, setTitle] = useState('Encounter Tracker')
  const [combatants, setCombatants] = useState<Combatant[]>([
    makeCombatant(0),
    makeCombatant(1),
    makeCombatant(2),
    makeCombatant(3),
  ])

  function updateCombatant(id: string, patch: Partial<Combatant>) {
    setCombatants((current) =>
      current.map((item) => {
        if (item.id !== id) return item
        const updated = { ...item, ...patch }

        if (!updated.conditions.invisible) {
          updated.greaterInvisibility = false
        }

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
    () =>
      [...combatants]
        .filter((item) => item.inTurnOrder)
        .sort((a, b) => b.initiative - a.initiative),
    [combatants],
  )

  const inactiveCombatants = useMemo(
    () => combatants.filter((item) => !item.inTurnOrder),
    [combatants],
  )

  function renderConditionPills(combatant: Combatant) {
    const pills: string[] = []

    if (combatant.exhaustionLevel > 0) {
      pills.push(`Exhaustion ${combatant.exhaustionLevel}`)
    }

    Object.entries(combatant.conditions).forEach(([key, enabled]) => {
      if (enabled) pills.push(CONDITION_LABELS[key as ConditionKey])
    })

    if (combatant.greaterInvisibility) {
      pills.push('Greater Invisibility')
    }

    if (!pills.length) {
      pills.push('No active conditions')
    }

    return pills.map((pill) => (
      <span key={pill} className="tag">
        {pill}
      </span>
    ))
  }

  const conditionKeys = Object.keys(CONDITION_LABELS) as ConditionKey[]

  return (
    <div className="page-shell">
      <PageHero
        variant="dashboard"
        imageSrc="/art/dashboard-banner.png"
        imageAlt="Fantasy adventurers standing ready"
        eyebrow="Encounter tools"
        title="Encounter Tracker"
        description="Track initiative, HP, AC, notes, conditions, and quick rules access during play."
        tags={['Tracker', 'Conditions', 'Reference links', 'DM tools']}
      />

      <section className="card stack">
        <label>
          Tracker title
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <div className="hero-tags">
          <button type="button" onClick={addCombatant}>
            Add combatant
          </button>
        </div>
      </section>

      <section className="grid two-col encounter-layout">
        <article className="card stack">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Editor</p>
              <h2>Combatants</h2>
            </div>
          </div>

          <div className="stack">
            {combatants.map((combatant) => (
              <section key={combatant.id} className="form-section stack">
                <div className="section-heading">
                  <strong>{combatant.name}</strong>
                  <button
                    type="button"
                    className="button-link secondary danger-button"
                    onClick={() => removeCombatant(combatant.id)}
                  >
                    Remove
                  </button>
                </div>

                <div className="form-inline">
                  <label>
                    Name
                    <input
                      value={combatant.name}
                      onChange={(e) =>
                        updateCombatant(combatant.id, { name: e.target.value })
                      }
                    />
                  </label>

                  <label>
                    Initiative
                    <input
                      type="number"
                      value={combatant.initiative}
                      onChange={(e) =>
                        updateCombatant(combatant.id, {
                          initiative: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </label>

                  <label>
                    HP
                    <input
                      value={combatant.hp}
                      onChange={(e) =>
                        updateCombatant(combatant.id, { hp: e.target.value })
                      }
                      placeholder="45 / 45"
                    />
                  </label>

                  <label>
                    AC
                    <input
                      value={combatant.ac}
                      onChange={(e) =>
                        updateCombatant(combatant.id, { ac: e.target.value })
                      }
                      placeholder="16"
                    />
                  </label>
                </div>

                <div className="condition-toggle-row">
                  <button
                    type="button"
                    className={`button-link secondary condition-toggle ${combatant.inTurnOrder ? 'is-on' : ''}`}
                    onClick={() =>
                      updateCombatant(combatant.id, {
                        inTurnOrder: !combatant.inTurnOrder,
                      })
                    }
                  >
                    {combatant.inTurnOrder ? 'In Active Turn Order' : 'Out of Turn Order'}
                  </button>

                  <button
                    type="button"
                    className={`button-link secondary condition-toggle ${combatant.greaterInvisibility ? 'is-on' : ''}`}
                    disabled={!combatant.conditions.invisible}
                    onClick={() =>
                      updateCombatant(combatant.id, {
                        greaterInvisibility: !combatant.greaterInvisibility,
                      })
                    }
                  >
                    Greater Invisibility
                  </button>
                </div>

                <div className="condition-toggle-grid">
                  {conditionKeys.map((key) => (
                    <button
                      key={key}
                      type="button"
                      className={`button-link secondary condition-toggle ${combatant.conditions[key] ? 'is-on' : ''}`}
                      onClick={() => toggleCondition(combatant.id, key)}
                    >
                      {CONDITION_LABELS[key]}
                    </button>
                  ))}
                </div>

                <div className="form-inline">
                  <label className="exhaustion-stepper">
                    Exhaustion Level
                    <div className="exhaustion-controls">
                      <button
                        type="button"
                        onClick={() =>
                          updateCombatant(combatant.id, {
                            exhaustionLevel: combatant.exhaustionLevel - 1,
                          })
                        }
                      >
                        -
                      </button>
                      <span className="tag">Level {combatant.exhaustionLevel}</span>
                      <button
                        type="button"
                        onClick={() =>
                          updateCombatant(combatant.id, {
                            exhaustionLevel: combatant.exhaustionLevel + 1,
                          })
                        }
                      >
                        +
                      </button>
                    </div>
                  </label>

                  <label>
                    Notes
                    <input
                      value={combatant.notes}
                      onChange={(e) =>
                        updateCombatant(combatant.id, { notes: e.target.value })
                      }
                      placeholder="Concentrating on bless"
                    />
                  </label>
                </div>
              </section>
            ))}
          </div>
        </article>

        <article className="card stack">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Active initiative</p>
              <h2>{title}</h2>
            </div>
            <span className="tag">{activeCombatants.length} active</span>
          </div>

          <div className="encounter-card-grid">
            {activeCombatants.map((combatant) => (
              <article key={combatant.id} className="encounter-card">
                <h3>{combatant.name}</h3>
                <div className="chip-row">
                  <span className="tag">Init {combatant.initiative}</span>
                  {combatant.ac ? <span className="tag">AC {combatant.ac}</span> : null}
                  {combatant.hp ? <span className="tag">HP {combatant.hp}</span> : null}
                </div>
                <div className="chip-row">{renderConditionPills(combatant)}</div>
                <p><strong>Notes:</strong> {combatant.notes || 'â€”'}</p>
              </article>
            ))}
          </div>

          <div className="section-heading">
            <div>
              <p className="eyebrow">Removed from turn order</p>
              <h2>Inactive combatants</h2>
            </div>
            <span className="tag">{inactiveCombatants.length} inactive</span>
          </div>

          <div className="encounter-card-grid">
            {inactiveCombatants.map((combatant) => (
              <article key={combatant.id} className="encounter-card">
                <h3>{combatant.name}</h3>
                <div className="chip-row">
                  <span className="tag">Init {combatant.initiative}</span>
                  {combatant.ac ? <span className="tag">AC {combatant.ac}</span> : null}
                  {combatant.hp ? <span className="tag">HP {combatant.hp}</span> : null}
                </div>
                <div className="chip-row">{renderConditionPills(combatant)}</div>
                <p><strong>Notes:</strong> {combatant.notes || 'â€”'}</p>
              </article>
            ))}
          </div>

          <section className="card stack">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Rules quick access</p>
                <h2>Condition reference links</h2>
              </div>
            </div>

            <div className="condition-links-grid">
              <article className="encounter-card">
                <h3>Exhaustion</h3>
                <p>Use the level stepper for this condition.</p>
                <a className="inline-link" href={EXHAUSTION_LINK} target="_blank" rel="noreferrer">
                  Open rule explanation
                </a>
              </article>

              {conditionKeys.map((key) => (
                <article key={key} className="encounter-card">
                  <h3>{CONDITION_LABELS[key]}</h3>
                  <a
                    className="inline-link"
                    href={CONDITION_LINKS[key]}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open rule explanation
                  </a>
                </article>
              ))}

              <article className="encounter-card">
                <h3>Greater Invisibility</h3>
                <p>This is a spell-effect toggle layered on top of Invisible.</p>
              </article>
            </div>
          </section>
        </article>
      </section>
    </div>
  )
}
