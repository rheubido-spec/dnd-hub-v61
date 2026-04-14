import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ADVENTURING_GEAR, ARMOR, GEAR_CATEGORY_META, MOUNTS, WEAPONS, type GearCategorySlug } from '../data/adventuringGearData'
import { PageHero } from '../components/PageHero'

type ViewMode = 'cards' | 'table'
type SortMode = 'name_asc' | 'cost_asc' | 'cost_desc' | 'weight_asc' | 'weight_desc'

function isSlug(value: string): value is GearCategorySlug {
  return value === 'weapons' || value === 'armor' || value === 'adventuring-gear' || value === 'mounts'
}

function parseMoneyToCp(value: string): number {
  const normalized = value.trim().toLowerCase()
  const parts = normalized.split(' ')
  const amount = Number(parts[0]) || 0
  const unit = parts[1] || ''
  if (unit === 'cp') return amount
  if (unit === 'sp') return amount * 10
  if (unit === 'ep') return amount * 50
  if (unit === 'gp') return amount * 100
  if (unit === 'pp') return amount * 1000
  return 0
}

function parseWeightToLb(value: string): number {
  const normalized = value.trim().toLowerCase()
  if (!normalized || normalized === 'â€”') return 0
  const match = normalized.match(/([\d.]+)/)
  return match ? Number(match[1]) : 0
}

function sortByMode<T extends { name: string; cost: string }>(
  items: T[],
  sortMode: SortMode,
  getWeight: (item: T) => number,
) {
  const copy = [...items]
  copy.sort((a, b) => {
    if (sortMode === 'name_asc') return a.name.localeCompare(b.name)
    if (sortMode === 'cost_asc') return parseMoneyToCp(a.cost) - parseMoneyToCp(b.cost)
    if (sortMode === 'cost_desc') return parseMoneyToCp(b.cost) - parseMoneyToCp(a.cost)
    if (sortMode === 'weight_asc') return getWeight(a) - getWeight(b)
    if (sortMode === 'weight_desc') return getWeight(b) - getWeight(a)
    return 0
  })
  return copy
}

function weaponTags(item: typeof WEAPONS[number]): string[] {
  const tags: string[] = [item.category]
  const lower = item.damage.toLowerCase()
  if (lower.includes('slashing')) tags.push('slashing')
  if (lower.includes('piercing')) tags.push('piercing')
  if (lower.includes('bludgeoning')) tags.push('bludgeoning')
  if (item.properties !== 'â€”') {
    item.properties
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
      .slice(0, 3)
      .forEach((part) => tags.push(part))
  }
  return tags
}

function armorTags(item: typeof ARMOR[number]): string[] {
  const tags: string[] = [item.category]
  if (item.strength) tags.push(item.strength)
  if (item.stealth) tags.push(item.stealth)
  return tags
}

function gearTags(item: typeof ADVENTURING_GEAR[number]): string[] {
  return [item.category]
}

function mountTags(item: typeof MOUNTS[number]): string[] {
  return [item.size, item.speed]
}

export function AdventuringGearCategoryPage() {
  const { slug = 'weapons' } = useParams()
  const safeSlug: GearCategorySlug = isSlug(slug) ? slug : 'weapons'
  const meta = GEAR_CATEGORY_META[safeSlug]
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [sortMode, setSortMode] = useState<SortMode>('name_asc')

  const normalizedQuery = query.trim().toLowerCase()

  const filteredWeapons = useMemo(() => {
    const filtered = WEAPONS.filter((item) => {
      const tags = weaponTags(item)
      const haystack = [item.name, item.category, item.damage, item.properties, item.cost, item.weight, ...tags].join(' ').toLowerCase()
      const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery)
      const matchesFilter = filter === 'all' || tags.map((t) => t.toLowerCase()).includes(filter.toLowerCase())
      return matchesQuery && matchesFilter
    })
    return sortByMode(filtered, sortMode, (item) => parseWeightToLb(item.weight))
  }, [normalizedQuery, filter, sortMode])

  const filteredArmor = useMemo(() => {
    const filtered = ARMOR.filter((item) => {
      const tags = armorTags(item)
      const haystack = [item.name, item.category, item.ac, item.cost, item.weight, item.strength ?? '', item.stealth ?? '', ...tags].join(' ').toLowerCase()
      const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery)
      const matchesFilter = filter === 'all' || tags.map((t) => t.toLowerCase()).includes(filter.toLowerCase())
      return matchesQuery && matchesFilter
    })
    return sortByMode(filtered, sortMode, (item) => parseWeightToLb(item.weight))
  }, [normalizedQuery, filter, sortMode])

  const filteredGear = useMemo(() => {
    const filtered = ADVENTURING_GEAR.filter((item) => {
      const tags = gearTags(item)
      const haystack = [item.name, item.category, item.details, item.cost, item.weight, ...tags].join(' ').toLowerCase()
      const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery)
      const matchesFilter = filter === 'all' || item.category.toLowerCase() === filter.toLowerCase()
      return matchesQuery && matchesFilter
    })
    return sortByMode(filtered, sortMode, (item) => parseWeightToLb(item.weight))
  }, [normalizedQuery, filter, sortMode])

  const filteredMounts = useMemo(() => {
    const filtered = MOUNTS.filter((item) => {
      const tags = mountTags(item)
      const haystack = [item.name, item.cost, item.speed, item.carrying_capacity, item.size, item.details, ...tags].join(' ').toLowerCase()
      const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery)
      const matchesFilter = filter === 'all' || tags.map((t) => t.toLowerCase()).includes(filter.toLowerCase())
      return matchesQuery && matchesFilter
    })
    return sortByMode(filtered, sortMode, () => 0)
  }, [normalizedQuery, filter, sortMode])

  const filterOptions = safeSlug === 'weapons'
    ? ['all', 'Simple Melee', 'Simple Ranged', 'Martial Melee', 'Martial Ranged', 'slashing', 'piercing', 'bludgeoning']
    : safeSlug === 'armor'
    ? ['all', 'Light Armor', 'Medium Armor', 'Heavy Armor', 'Shield']
    : safeSlug === 'adventuring-gear'
    ? ['all', ...Array.from(new Set(ADVENTURING_GEAR.map((item) => item.category)))]
    : ['all', 'Medium', 'Large', '50 ft.', '60 ft.']

  const resultCount = safeSlug === 'weapons'
    ? filteredWeapons.length
    : safeSlug === 'armor'
    ? filteredArmor.length
    : safeSlug === 'adventuring-gear'
    ? filteredGear.length
    : filteredMounts.length

  return (
    <div className="page-shell">
      <PageHero
        variant="campaigns"
        imageSrc="/art/adventuring-gear-banner.png"
        imageAlt="A fantasy outfitting shop with armor, weapons, packs, lanterns, and adventuring supplies"
        eyebrow="Adventuring Gear"
        title={meta.title}
        description={meta.subtitle}
        tags={meta.tags}
      >
        <div className="hero-tags">
          <Link className="button-link secondary" to="/adventuring-gear">Back to Adventuring Gear</Link>
        </div>
      </PageHero>

      <section className="card stack">
        <div className="section-heading">
          <div>
            <p className="eyebrow">SRD-backed reference</p>
            <h2>{meta.title}</h2>
            <p>{meta.subtitle}</p>
          </div>
          <span className="tag">{resultCount} results</span>
        </div>

        <div className="gear-filter-bar">
          <label>
            Search
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${meta.title.toLowerCase()}...`} />
          </label>
          <label>
            Filter
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              {filterOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label>
            View
            <select value={viewMode} onChange={(e) => setViewMode(e.target.value as ViewMode)}>
              <option value="cards">Card view</option>
              <option value="table">Table view</option>
            </select>
          </label>
          <label>
            Sort
            <select value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)}>
              <option value="name_asc">Name Aâ€“Z</option>
              <option value="cost_asc">Cost low to high</option>
              <option value="cost_desc">Cost high to low</option>
              <option value="weight_asc">Weight low to high</option>
              <option value="weight_desc">Weight high to low</option>
            </select>
          </label>
        </div>

        {safeSlug === 'weapons' && viewMode === 'cards' && (
          <div className="gear-card-grid">
            {filteredWeapons.map((item) => (
              <article key={item.name} className="gear-item-card">
                <div className="section-heading">
                  <div><h3>{item.name}</h3><p>{item.category}</p></div>
                  <span className="tag">{item.cost}</span>
                </div>
                <div className="chip-row">
                  {weaponTags(item).map((tag) => <span key={tag} className="tag">{tag}</span>)}
                </div>
                <p><strong>Damage:</strong> {item.damage}</p>
                <p><strong>Weight:</strong> {item.weight}</p>
                <p><strong>Properties:</strong> {item.properties}</p>
              </article>
            ))}
          </div>
        )}

        {safeSlug === 'weapons' && viewMode === 'table' && (
          <div className="gear-table-wrap">
            <table className="gear-table">
              <thead><tr><th>Name</th><th>Tags</th><th>Cost</th><th>Damage</th><th>Weight</th><th>Properties</th></tr></thead>
              <tbody>
                {filteredWeapons.map((item) => (
                  <tr key={item.name}>
                    <td>{item.name}</td><td>{weaponTags(item).join(', ')}</td><td>{item.cost}</td><td>{item.damage}</td><td>{item.weight}</td><td>{item.properties}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {safeSlug === 'armor' && viewMode === 'cards' && (
          <div className="gear-card-grid">
            {filteredArmor.map((item) => (
              <article key={item.name} className="gear-item-card">
                <div className="section-heading">
                  <div><h3>{item.name}</h3><p>{item.category}</p></div>
                  <span className="tag">{item.cost}</span>
                </div>
                <div className="chip-row">
                  {armorTags(item).map((tag) => <span key={tag} className="tag">{tag}</span>)}
                </div>
                <p><strong>Armor Class:</strong> {item.ac}</p>
                <p><strong>Strength:</strong> {item.strength ?? 'â€”'}</p>
                <p><strong>Stealth:</strong> {item.stealth ?? 'â€”'}</p>
                <p><strong>Weight:</strong> {item.weight}</p>
              </article>
            ))}
          </div>
        )}

        {safeSlug === 'armor' && viewMode === 'table' && (
          <div className="gear-table-wrap">
            <table className="gear-table">
              <thead><tr><th>Name</th><th>Tags</th><th>Cost</th><th>AC</th><th>Strength</th><th>Stealth</th><th>Weight</th></tr></thead>
              <tbody>
                {filteredArmor.map((item) => (
                  <tr key={item.name}>
                    <td>{item.name}</td><td>{armorTags(item).join(', ')}</td><td>{item.cost}</td><td>{item.ac}</td><td>{item.strength ?? 'â€”'}</td><td>{item.stealth ?? 'â€”'}</td><td>{item.weight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {safeSlug === 'adventuring-gear' && viewMode === 'cards' && (
          <div className="gear-card-grid">
            {filteredGear.map((item) => (
              <article key={item.name} className="gear-item-card">
                <div className="section-heading">
                  <div><h3>{item.name}</h3><p>{item.category}</p></div>
                  <span className="tag">{item.cost}</span>
                </div>
                <div className="chip-row">
                  {gearTags(item).map((tag) => <span key={tag} className="tag">{tag}</span>)}
                  <span className="tag">{item.weight}</span>
                </div>
                <p>{item.details}</p>
              </article>
            ))}
          </div>
        )}

        {safeSlug === 'adventuring-gear' && viewMode === 'table' && (
          <div className="gear-table-wrap">
            <table className="gear-table">
              <thead><tr><th>Name</th><th>Category</th><th>Cost</th><th>Weight</th><th>Details</th></tr></thead>
              <tbody>
                {filteredGear.map((item) => (
                  <tr key={item.name}>
                    <td>{item.name}</td><td>{item.category}</td><td>{item.cost}</td><td>{item.weight}</td><td>{item.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {safeSlug === 'mounts' && viewMode === 'cards' && (
          <div className="gear-card-grid">
            {filteredMounts.map((item) => (
              <article key={item.name} className="gear-item-card">
                <div className="section-heading">
                  <div><h3>{item.name}</h3><p>Mount</p></div>
                  <span className="tag">{item.cost}</span>
                </div>
                <div className="chip-row">
                  {mountTags(item).map((tag) => <span key={tag} className="tag">{tag}</span>)}
                </div>
                <p><strong>Speed:</strong> {item.speed}</p>
                <p><strong>Size:</strong> {item.size}</p>
                <p><strong>Capacity:</strong> {item.carrying_capacity}</p>
                <p>{item.details}</p>
              </article>
            ))}
          </div>
        )}

        {safeSlug === 'mounts' && viewMode === 'table' && (
          <div className="gear-table-wrap">
            <table className="gear-table">
              <thead><tr><th>Name</th><th>Tags</th><th>Cost</th><th>Speed</th><th>Size</th><th>Capacity</th><th>Details</th></tr></thead>
              <tbody>
                {filteredMounts.map((item) => (
                  <tr key={item.name}>
                    <td>{item.name}</td><td>{mountTags(item).join(', ')}</td><td>{item.cost}</td><td>{item.speed}</td><td>{item.size}</td><td>{item.carrying_capacity}</td><td>{item.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

