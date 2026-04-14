
import { useMemo, useState } from 'react'
import { PageHero } from '../components/PageHero'

type LootMode = 'gold' | 'gold_items' | 'gold_items_magic' | 'dragon_hoard'

type LootItem = {
  category: string
  name: string
}

const ITEM_TABLE: LootItem[] = [
  { category: 'trade good', name: 'silk bundle' },
  { category: 'trade good', name: 'silver chalice' },
  { category: 'gear', name: "healer's kit" },
  { category: 'gear', name: "climber's kit" },
  { category: 'gear', name: 'fine spyglass case' },
  { category: 'art object', name: 'engraved ivory statuette' },
  { category: 'art object', name: 'etched electrum goblet' },
  { category: 'art object', name: 'jeweled brooch' },
]

const MAGIC_TABLE: LootItem[] = [
  { category: 'potion', name: 'potion of healing' },
  { category: 'scroll', name: 'spell scroll (1st level)' },
  { category: 'wondrous item', name: 'bag of holding' },
  { category: 'wondrous item', name: 'driftglobe' },
  { category: 'weapon', name: '+1 weapon' },
  { category: 'armor', name: '+1 shield' },
]

function hashSeed(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pickMany<T>(rand: () => number, list: T[], count: number): T[] {
  const items = [...list]
  const out: T[] = []
  for (let i = 0; i < count && items.length; i++) {
    const idx = Math.floor(rand() * items.length)
    out.push(items.splice(idx, 1)[0])
  }
  return out
}

function avg(nums: number[]) {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0
}

function buildLoot({
  partySize,
  avgLevel,
  creatureCount,
  crValues,
  lootMode,
}: {
  partySize: number
  avgLevel: number
  creatureCount: number
  crValues: number[]
  lootMode: LootMode
}) {
  const seed = `${partySize}|${avgLevel}|${creatureCount}|${crValues.join(',')}|${lootMode}`
  const rand = mulberry32(hashSeed(seed))
  const avgCr = avg(crValues)
  const encounterWeight = Math.max(1, avgCr * creatureCount + avgLevel + partySize / 2)

  let goldBase = Math.round(18 * encounterWeight + rand() * 60)
  if (lootMode === 'gold_items') goldBase = Math.round(goldBase * 1.15)
  if (lootMode === 'gold_items_magic') goldBase = Math.round(goldBase * 1.3)
  if (lootMode === 'dragon_hoard') goldBase = Math.round(goldBase * 4.2)

  const gems = Math.round((goldBase * (0.1 + rand() * 0.18)) / 10) * 10
  const art = Math.round((goldBase * (0.08 + rand() * 0.15)) / 10) * 10

  const mundaneCount =
    lootMode === 'gold' ? 0 :
    lootMode === 'gold_items' ? 1 + Math.floor(rand() * 3) :
    lootMode === 'gold_items_magic' ? 2 + Math.floor(rand() * 3) :
    4 + Math.floor(rand() * 5)

  const magicCount =
    lootMode === 'gold' ? 0 :
    lootMode === 'gold_items' ? 0 :
    lootMode === 'gold_items_magic' ? 1 + Math.floor((avgCr + avgLevel) / 8) :
    2 + Math.floor((avgCr + avgLevel) / 6)

  const mundaneItems = pickMany(rand, ITEM_TABLE, mundaneCount)
  const magicItems = pickMany(rand, MAGIC_TABLE, Math.min(magicCount, MAGIC_TABLE.length))

  const notes = []
  if (lootMode === 'dragon_hoard') notes.push('Hoard result: includes heavier coin volume and richer treasure objects.')
  if (avgCr >= 5) notes.push('Higher CR encounter: consider splitting coin and item finds across bodies, lairs, and hidden caches.')
  if (partySize >= 6) notes.push('Large party: this result is tuned slightly upward to keep rewards feeling meaningful.')

  return {
    gold: goldBase,
    gems,
    art,
    mundaneItems,
    magicItems,
    notes,
  }
}

export function DMLootGeneratorPage() {
  const [partySize, setPartySize] = useState(4)
  const [avgLevel, setAvgLevel] = useState(5)
  const [creatureCount, setCreatureCount] = useState(3)
  const [crText, setCrText] = useState('1, 1, 2')
  const [lootMode, setLootMode] = useState<LootMode>('gold_items')

  const crValues = useMemo(
    () =>
      crText
        .split(',')
        .map((part) => Number(part.trim()))
        .filter((value) => !Number.isNaN(value) && value >= 0)
        .slice(0, 20),
    [crText],
  )

  const result = useMemo(
    () => buildLoot({ partySize, avgLevel, creatureCount, crValues, lootMode }),
    [partySize, avgLevel, creatureCount, crValues, lootMode],
  )

  return (
    <div className="page-shell">
      <PageHero
        variant="dashboard"
        imageSrc="/art/dashboard-banner.png"
        imageAlt="Fantasy armory and outfitting shop filled with armor, blades, and adventuring gear"
        eyebrow="DM Suite"
        title="Loot Generator"
        description="Generate encounter treasure using labeled party and creature inputs with SRD-friendly loot styles."
        tags={['Loot', 'SRD-friendly', 'Gold', 'Magic items']}
      />

      <section className="grid two-col encounter-layout">
        <article className="card stack">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Encounter inputs</p>
              <h2>Treasure setup</h2>
              <p>Adjust the fields below to shape the generated reward package.</p>
            </div>
          </div>

          <div className="form-inline">
            <label>
              Party size
              <input type="number" min="1" max="10" value={partySize} onChange={(e) => setPartySize(Number(e.target.value) || 1)} />
              <span className="field-hint">How many player characters are in the group.</span>
            </label>
            <label>
              Average party level
              <input type="number" min="1" max="20" value={avgLevel} onChange={(e) => setAvgLevel(Number(e.target.value) || 1)} />
              <span className="field-hint">Use the group's approximate average level.</span>
            </label>
          </div>

          <div className="form-inline">
            <label>
              Number of creatures
              <input type="number" min="1" max="20" value={creatureCount} onChange={(e) => setCreatureCount(Number(e.target.value) || 1)} />
              <span className="field-hint">How many creatures were in the encounter.</span>
            </label>
            <label>
              Loot type
              <select value={lootMode} onChange={(e) => setLootMode(e.target.value as LootMode)}>
                <option value="gold">Just gold</option>
                <option value="gold_items">Gold and items</option>
                <option value="gold_items_magic">Gold, items, and magical items</option>
                <option value="dragon_hoard">Dragon hoard</option>
              </select>
              <span className="field-hint">Choose the general reward style you want.</span>
            </label>
          </div>

          <label>
            CR of each creature
            <input
              value={crText}
              onChange={(e) => setCrText(e.target.value)}
              placeholder="Example: 1, 1, 2 or 5, 5, 5"
            />
            <span className="field-hint">Enter CR values separated by commas, one for each creature when possible.</span>
          </label>

          <div className="chip-row">
            <span className="tag">Party {partySize}</span>
            <span className="tag">Avg level {avgLevel}</span>
            <span className="tag">Creatures {creatureCount}</span>
            <span className="tag">Parsed CRs {crValues.length}</span>
          </div>
        </article>

        <article className="card stack">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Generated reward</p>
              <h2>Loot results</h2>
            </div>
            <span className="tag">{lootMode.replaceAll('_', ' ')}</span>
          </div>

          <div className="encounter-card-grid">
            <article className="encounter-card">
              <h3>Coin & valuables</h3>
              <p><strong>Gold:</strong> {result.gold} gp</p>
              <p><strong>Gems:</strong> {result.gems} gp equivalent</p>
              <p><strong>Art objects:</strong> {result.art} gp equivalent</p>
            </article>

            <article className="encounter-card">
              <h3>Mundane treasure</h3>
              {result.mundaneItems.length ? (
                <ul>
                  {result.mundaneItems.map((item) => <li key={item.name}>{item.name} <span className="field-hint">({item.category})</span></li>)}
                </ul>
              ) : <p>No mundane item bundle in this result.</p>}
            </article>

            <article className="encounter-card">
              <h3>Magic items</h3>
              {result.magicItems.length ? (
                <ul>
                  {result.magicItems.map((item) => <li key={item.name}>{item.name} <span className="field-hint">({item.category})</span></li>)}
                </ul>
              ) : <p>No magical item result for this loot type.</p>}
            </article>
          </div>

          {result.notes.length ? (
            <div className="notice">
              {result.notes.map((note) => <p key={note}>{note}</p>)}
            </div>
          ) : null}
        </article>
      </section>
    </div>
  )
}

