import { FormEvent, useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../api/client'

const presets = [4, 6, 8, 10, 12, 20, 100]

type RollResult = { rolls: number[]; total: number; modifier: number }
type DiceTheme = 'ember' | 'arcane' | 'emerald' | 'frost' | 'obsidian'
type DicePattern = 'solid' | 'marble' | 'runes' | 'starlit' | 'scale'
type RenderQuality = 'standard' | 'high' | 'ultra'

type DiceStyleOption<T extends string> = {
  key: T
  label: string
  hint: string
}

const diceThemes: Array<DiceStyleOption<DiceTheme>> = [
  { key: 'ember', label: 'Ember Gold', hint: 'Warm brass and ruby glow' },
  { key: 'arcane', label: 'Arcane Violet', hint: 'Purple crystal shimmer' },
  { key: 'emerald', label: 'Emerald Relic', hint: 'Jewel-green enchantment' },
  { key: 'frost', label: 'Frost Silver', hint: 'Moonlit ice and steel' },
  { key: 'obsidian', label: 'Obsidian Flame', hint: 'Dark stone with ember edges' },
]

const dicePatterns: Array<DiceStyleOption<DicePattern>> = [
  { key: 'solid', label: 'Solid', hint: 'Clean polished finish' },
  { key: 'marble', label: 'Marble', hint: 'Swirled stone veining' },
  { key: 'runes', label: 'Runes', hint: 'Arcane engraved sigils' },
  { key: 'starlit', label: 'Starlit', hint: 'Cosmic spark flecks' },
  { key: 'scale', label: 'Dragon Scale', hint: 'Scaled fantasy texture' },
]

const qualityOptions: Array<DiceStyleOption<RenderQuality>> = [
  { key: 'standard', label: 'Standard', hint: 'Fastest animation' },
  { key: 'high', label: 'High', hint: 'Sharper lighting' },
  { key: 'ultra', label: 'Ultra', hint: 'More tumble frames' },
]

function randomRolls(count: number, sides: number) {
  return Array.from({ length: count }, () => Math.max(1, Math.floor(Math.random() * sides) + 1))
}

function d6Pips(value: number) {
  const layouts: Record<number, number[]> = {
    1: [5],
    2: [1, 9],
    3: [1, 5, 9],
    4: [1, 3, 7, 9],
    5: [1, 3, 5, 7, 9],
    6: [1, 3, 4, 6, 7, 9],
  }

  const active = new Set(layouts[Math.min(6, Math.max(1, value))] ?? [])

  return (
    <div className="pip-face" aria-hidden="true">
      {Array.from({ length: 9 }, (_, index) => {
        const key = index + 1
        return <span key={key} className={`pip ${active.has(key) ? 'on' : ''}`} />
      })}
    </div>
  )
}

function DieFaceContent({ sides, value }: { sides: number; value: number }) {
  return (
    <div className="die-token-inner">
      <small>d{sides}</small>
      {sides === 6 ? d6Pips(value) : <strong>{value}</strong>}
    </div>
  )
}

function Die3D({
  sides,
  value,
  rolling = false,
  theme,
  pattern,
  index,
}: {
  sides: number
  value: number
  rolling?: boolean
  theme: DiceTheme
  pattern: DicePattern
  index: number
}) {
  const shapeClass =
    sides === 4 ? 'd4'
    : sides === 6 ? 'd6'
    : sides === 8 ? 'd8'
    : sides === 10 ? 'd10'
    : sides === 12 ? 'd12'
    : sides === 20 ? 'd20'
    : 'd100'

  return (
    <div
      className={`die-viewport ${rolling ? 'rolling' : ''}`}
      style={{
        ['--die-delay' as string]: `${index * 0.08}s`,
        ['--die-tilt' as string]: `${(index % 4) * 7 - 10}deg`,
      }}
    >
      <div className={`die-token die-3d ${shapeClass} theme-${theme} pattern-${pattern}`}>
        <div className="die-shadow" />
        <div className="die-cube">
          <div className="die-face face-front">
            <span className="die-pattern-layer" />
            <span className="die-glow-layer" />
            <DieFaceContent sides={sides} value={value} />
          </div>
          <div className="die-face face-back">
            <span className="die-pattern-layer" />
            <span className="die-glow-layer" />
            <DieFaceContent sides={sides} value={value} />
          </div>
          <div className="die-face face-right">
            <span className="die-pattern-layer" />
            <span className="die-glow-layer" />
            <DieFaceContent sides={sides} value={value} />
          </div>
          <div className="die-face face-left">
            <span className="die-pattern-layer" />
            <span className="die-glow-layer" />
            <DieFaceContent sides={sides} value={value} />
          </div>
          <div className="die-face face-top">
            <span className="die-pattern-layer" />
            <span className="die-glow-layer" />
            <DieFaceContent sides={sides} value={value} />
          </div>
          <div className="die-face face-bottom">
            <span className="die-pattern-layer" />
            <span className="die-glow-layer" />
            <DieFaceContent sides={sides} value={value} />
          </div>
        </div>
      </div>
    </div>
  )
}

function DiceControls({
  sides,
  count,
  modifier,
  theme,
  pattern,
  quality,
  onChangeSides,
  onChangeCount,
  onChangeModifier,
  onChangeTheme,
  onChangePattern,
  onChangeQuality,
  onSubmit,
  creatingRoll = false,
}: {
  sides: number
  count: number
  modifier: number
  theme: DiceTheme
  pattern: DicePattern
  quality: RenderQuality
  onChangeSides: (value: number) => void
  onChangeCount: (value: number) => void
  onChangeModifier: (value: number) => void
  onChangeTheme: (value: DiceTheme) => void
  onChangePattern: (value: DicePattern) => void
  onChangeQuality: (value: RenderQuality) => void
  onSubmit: (event: FormEvent) => Promise<void>
  creatingRoll?: boolean
}) {
  return (
    <form onSubmit={onSubmit} className="form-grid">
      <div className="form-section stack">
        <h3>Custom roll builder</h3>
        <div className="form-inline">
          <label>
            Number of sides
            <input type="number" value={sides} min="2" onChange={(e) => onChangeSides(Number(e.target.value))} />
          </label>
          <label>
            Number of dice
            <input type="number" value={count} min="1" onChange={(e) => onChangeCount(Number(e.target.value))} />
          </label>
          <label>
            Modifier
            <input type="number" value={modifier} onChange={(e) => onChangeModifier(Number(e.target.value))} />
          </label>
        </div>

        <div className="dice-style-grid">
          <div className="form-section stack">
            <h3>Color theme</h3>
            <div className="dice-style-options">
              {diceThemes.map((option) => (
                <button
                  type="button"
                  key={option.key}
                  className={`dice-style-chip ${theme === option.key ? 'active' : ''}`}
                  onClick={() => onChangeTheme(option.key)}
                >
                  <span className={`dice-style-swatch theme-${option.key}`} />
                  <span>
                    <strong>{option.label}</strong>
                    <small>{option.hint}</small>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-section stack">
            <h3>Surface pattern</h3>
            <div className="dice-style-options">
              {dicePatterns.map((option) => (
                <button
                  type="button"
                  key={option.key}
                  className={`dice-style-chip ${pattern === option.key ? 'active' : ''}`}
                  onClick={() => onChangePattern(option.key)}
                >
                  <span className={`dice-pattern-preview pattern-${option.key}`} />
                  <span>
                    <strong>{option.label}</strong>
                    <small>{option.hint}</small>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-section stack">
            <h3>Render quality</h3>
            <div className="dice-style-options">
              {qualityOptions.map((option) => (
                <button
                  type="button"
                  key={option.key}
                  className={`dice-style-chip ${quality === option.key ? 'active' : ''}`}
                  onClick={() => onChangeQuality(option.key)}
                >
                  <span className="dice-quality-gem" />
                  <span>
                    <strong>{option.label}</strong>
                    <small>{option.hint}</small>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <button type="submit" disabled={creatingRoll}>
          {creatingRoll ? 'Rolling...' : 'Roll custom dice'}
        </button>
      </div>
    </form>
  )
}

function DiceResultPanel({
  result,
  notation,
  themeLabel,
  patternLabel,
}: {
  result: RollResult | null
  notation: string
  themeLabel: string
  patternLabel: string
}) {
  return (
    <div className="form-section stack">
      <h3>Latest result</h3>
      <div className="result-card">
        <p className="result-total">{result ? result.total : '—'}</p>
        <p className="result-breakdown">
          {result
            ? `${result.rolls.join(', ')} ${
                result.modifier ? `(modifier ${result.modifier >= 0 ? '+' : ''}${result.modifier})` : ''
              }`
            : 'Roll the dice to see individual values.'}
        </p>
      </div>

      <div className="chip-row">
        <span className="tag">{notation}</span>
        <span className="tag">{themeLabel}</span>
        <span className="tag">{patternLabel}</span>
      </div>
    </div>
  )
}

function DiceStage({
  sides,
  rolls,
  rolling,
  theme,
  pattern,
  quality,
  onQuickRoll,
}: {
  sides: number
  rolls: number[]
  rolling: boolean
  theme: DiceTheme
  pattern: DicePattern
  quality: RenderQuality
  onQuickRoll: (preset: number) => Promise<void>
}) {
  return (
    <div className="dice-tray-card">
      <div className="dice-tray-header">
        <div>
          <strong>Dice tray</strong>
          <p>Step 1 keeps your current animated tray logic and prepares the page for the future 3D canvas upgrade.</p>
        </div>
        <div className="chip-row">
          <span className="tag">Step 1 foundation</span>
          <span className="tag">Ready for R3F</span>
          <span className="tag">Ready for Manim hooks</span>
        </div>
      </div>

      <div className="dice-preset-grid">
        {presets.map((preset) => (
          <button
            type="button"
            key={preset}
            className={`dice-preset-card ${sides === preset ? 'active' : ''}`}
            onClick={() => void onQuickRoll(preset)}
          >
            <span className="dice-preset-crest">d{preset}</span>
            <small>{preset === 100 ? 'Percentile' : `Roll a d${preset}`}</small>
          </button>
        ))}
      </div>

      <div className={`dice-stage dice-stage-${quality}`}>
        <div className="dice-stage-grid" />
        {rolls.map((value, index) => (
          <Die3D
            key={`${value}-${index}-${rolling ? 'rolling' : 'rest'}-${sides}`}
            sides={sides}
            value={value}
            rolling={rolling}
            theme={theme}
            pattern={pattern}
            index={index}
          />
        ))}
      </div>
    </div>
  )
}

function DiceTray({
  notation,
  themeLabel,
  patternLabel,
  stage,
  results,
}: {
  notation: string
  themeLabel: string
  patternLabel: string
  stage: React.ReactNode
  results: React.ReactNode
}) {
  return (
    <section className="card stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Arcane dice tray</p>
          <h2>Dice forge</h2>
          <p>
            Step 1 restructures the page for the upcoming React Three Fiber and Manim upgrade while preserving your
            current rolling flow.
          </p>
        </div>
        <div className="section-tags">
          <span className="tag">{notation}</span>
          <span className="tag">{themeLabel}</span>
          <span className="tag">{patternLabel}</span>
        </div>
      </div>

      {stage}

      <div className="form-grid">{results}</div>
    </section>
  )
}

export function DicePage() {
  const [sides, setSides] = useState(20)
  const [count, setCount] = useState(1)
  const [modifier, setModifier] = useState(0)
  const [theme, setTheme] = useState<DiceTheme>('arcane')
  const [pattern, setPattern] = useState<DicePattern>('runes')
  const [result, setResult] = useState<RollResult | null>(null)
  const [previewRolls, setPreviewRolls] = useState<number[]>([20])
  const [rolling, setRolling] = useState(false)
  const [quality, setQuality] = useState<RenderQuality>('high')

  const activeNotation = useMemo(
    () => `${count}d${sides}${modifier > 0 ? `+${modifier}` : modifier < 0 ? modifier : ''}`,
    [count, sides, modifier],
  )

  const activeTheme = diceThemes.find((item) => item.key === theme)
  const activePattern = dicePatterns.find((item) => item.key === pattern)

  useEffect(() => {
    setPreviewRolls((current) => (current.length === count ? current : Array.from({ length: count }, () => sides)))
  }, [count, sides])

  async function roll(nextSides = sides) {
    const targetSides = nextSides
    const targetCount = count

    setSides(targetSides)
    setRolling(true)

    const steps = quality === 'ultra' ? 16 : quality === 'high' ? 12 : 8
    const delay = quality === 'ultra' ? 65 : quality === 'high' ? 75 : 90

    for (let step = 0; step < steps; step += 1) {
      setPreviewRolls(randomRolls(targetCount, targetSides))
      await new Promise((resolve) => window.setTimeout(resolve, delay))
    }

    const data = await apiFetch<RollResult>('/dice/roll', {
      method: 'POST',
      body: JSON.stringify({ sides: targetSides, count: targetCount, modifier }),
    })

    setResult(data)
    setPreviewRolls(data.rolls)
    setRolling(false)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    await roll()
  }

  const displayedRolls = rolling ? previewRolls : (result?.rolls ?? previewRolls)

  return (
    <DiceTray
      notation={activeNotation}
      themeLabel={activeTheme?.label ?? 'Custom Theme'}
      patternLabel={activePattern?.label ?? 'Custom Pattern'}
      stage={
        <DiceStage
          sides={sides}
          rolls={displayedRolls}
          rolling={rolling}
          theme={theme}
          pattern={pattern}
          quality={quality}
          onQuickRoll={roll}
        />
      }
      results={
        <>
          <DiceControls
            sides={sides}
            count={count}
            modifier={modifier}
            theme={theme}
            pattern={pattern}
            quality={quality}
            onChangeSides={setSides}
            onChangeCount={setCount}
            onChangeModifier={setModifier}
            onChangeTheme={setTheme}
            onChangePattern={setPattern}
            onChangeQuality={setQuality}
            onSubmit={handleSubmit}
            creatingRoll={rolling}
          />
          <DiceResultPanel
            result={result}
            notation={activeNotation}
            themeLabel={activeTheme?.label ?? 'Custom Theme'}
            patternLabel={activePattern?.label ?? 'Custom Pattern'}
          />
        </>
      }
    />
  )
}
