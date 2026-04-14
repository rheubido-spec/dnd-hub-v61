
import { Link, useSearchParams } from 'react-router-dom'
import { PageHero } from '../components/PageHero'

type Topic = {
  slug: string
  title: string
  description: string
  tag: string
  source: string
  labels: string[]
}

const topics: Topic[] = [
  {
    slug: 'running-the-game',
    title: 'Running the Game',
    description: 'Session flow, adjudication reminders, exploration cadence, and encounter pacing for the table.',
    tag: 'SRD Reference',
    source: 'Official SRD',
    labels: ['adjudication', 'session flow', 'exploration'],
  },
  {
    slug: 'combat',
    title: 'Combat Rules',
    description: 'Turn order, actions, bonus actions, reactions, movement, cover, and attack flow.',
    tag: 'SRD Combat',
    source: 'Official SRD',
    labels: ['actions', 'attacks', 'cover', 'movement'],
  },
  {
    slug: 'conditions',
    title: 'Conditions',
    description: 'Quick access to blinded, charmed, frightened, grappled, invisible, prone, stunned, and more.',
    tag: 'SRD Conditions',
    source: 'Official SRD',
    labels: ['status effects', 'combat', 'reference'],
  },
  {
    slug: 'overland-travel',
    title: 'Overland Travel',
    description: 'Travel pace, wilderness movement, navigation, and journey framing.',
    tag: 'DM Toolkit',
    source: 'SRD + app notes',
    labels: ['travel', 'wilderness', 'navigation'],
  },
  {
    slug: 'initiative',
    title: 'Initiative',
    description: 'Quick procedures for rolling initiative, tracking rounds, and handling surprise.',
    tag: 'Encounter Flow',
    source: 'Official SRD',
    labels: ['rounds', 'surprise', 'combat flow'],
  },
  {
    slug: 'npc-generator',
    title: 'NPC Generator',
    description: 'Fast prompts and archetype tables for creating names, motives, roles, and secrets.',
    tag: 'Generator',
    source: 'App tool',
    labels: ['npc', 'generator', 'social encounters'],
  },
  {
    slug: 'creature-generator',
    title: 'Creature Generator',
    description: 'Build encounter concepts using role, environment, threat theme, and signature ability prompts.',
    tag: 'Generator',
    source: 'App tool',
    labels: ['monster', 'generator', 'encounters'],
  },
]

const externalRefs = [
  {
    title: 'Official SRD 5.2.1',
    description: 'Primary open rules source for the in-app DM Suite pages.',
    href: 'https://www.dndbeyond.com/srd',
    source: 'Open rules source',
    labels: ['official', 'rules', 'srd'],
  },
  {
    title: 'Donjon Quick Reference',
    description: 'Fast external reference for actions, conditions, and environmental effects.',
    href: 'https://donjon.bin.sh/5e/quickref/',
    source: 'External quick reference',
    labels: ['conditions', 'actions', 'combat'],
  },
  {
    title: '5etools',
    description: 'External rules/reference link for personal quick lookup.',
    href: 'https://5e.tools/',
    source: 'External reference link',
    labels: ['reference', 'lookup', 'tools'],
  },
]

function matchesQuery(text: string, query: string) {
  if (!query) return true
  return text.toLowerCase().includes(query.toLowerCase())
}

export function DMSuitePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = (searchParams.get('q') ?? '').trim()

  const filteredTopics = topics.filter((topic) =>
    matchesQuery(
      [topic.title, topic.description, topic.tag, topic.source, ...topic.labels].join(' '),
      query,
    ),
  )

  const filteredRefs = externalRefs.filter((ref) =>
    matchesQuery(
      [ref.title, ref.description, ref.source, ...ref.labels].join(' '),
      query,
    ),
  )

  return (
    <div className="page-shell">
      <PageHero
        variant="dashboard"
        imageSrc="/art/dashboard-banner.png"
        imageAlt="Fantasy armory and outfitting shop filled with armor, blades, and adventuring gear"
        eyebrow="Dungeon Master's Suite"
        title="Run the Table"
        description="Open DM reference tools, combat rules, travel notes, initiative help, and generator pages from one command center."
        tags={['DM tools', 'SRD reference', 'Quick generators', 'External quick links']}
      />

      <section className="card stack">
        <div className="hero-tags">
          <Link className="button-link secondary" to="/dm-cheat-sheets">Open printable cheat sheets</Link>
          <Link className="button-link secondary" to="/dm-encounter-tracker">Open encounter tracker cards</Link>
        </div>
        <div className="section-heading">
          <div>
            <p className="eyebrow">Quick reference search</p>
            <h2>Find DM tools fast</h2>
            <p>Search rules topics, generator pages, and reference links from one place.</p>
          </div>
          {query ? <span className="tag">Search: {query}</span> : <span className="tag">Browse all materials</span>}
        </div>

        <form
          className="quickref-searchbar"
          onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            const next = String(formData.get('q') ?? '').trim()
            setSearchParams(next ? { q: next } : {})
          }}
        >
          <input
            name="q"
            defaultValue={query}
            placeholder="Search combat, conditions, NPCs, travel, initiative..."
            aria-label="Search DM Suite references"
          />
          <button type="submit">Search</button>
          {query ? (
            <button type="button" className="button-link secondary" onClick={() => setSearchParams({})}>
              Clear
            </button>
          ) : null}
        </form>
      </section>

      <section className="grid two-col">
        {filteredTopics.length ? filteredTopics.map((topic) => (
          <article key={topic.slug} className="card stack">
            <div className="section-heading">
              <div>
                <p className="eyebrow">{topic.tag}</p>
                <h2>{topic.title}</h2>
                <p>{topic.description}</p>
              </div>
              <span className="tag">{topic.source}</span>
            </div>
            <div className="chip-row">
              {topic.labels.map((label) => <span key={label} className="tag">{label}</span>)}
            </div>
            <div className="hero-tags">
              <Link className="button-link secondary" to={topic.slug === 'loot-generator' ? '/dm-loot-generator' : `/dm-suite/${topic.slug}`}>Open subpage</Link>
            </div>
          </article>
        )) : (
          <article className="card stack">
            <h2>No topic matches</h2>
            <p>Try searching for combat, travel, conditions, initiative, NPC, or creature.</p>
          </article>
        )}
      </section>

      <section className="card stack">
        <div className="hero-tags">
          <Link className="button-link secondary" to="/dm-cheat-sheets">Open printable cheat sheets</Link>
          <Link className="button-link secondary" to="/dm-encounter-tracker">Open encounter tracker cards</Link>
        </div>
        <div className="section-heading">
          <div>
            <p className="eyebrow">Reference links</p>
            <h2>External quick references</h2>
            <p>Use these alongside the official SRD-backed material inside the app.</p>
          </div>
        </div>
        <div className="grid two-col">
          {filteredRefs.map((ref) => (
            <article key={ref.title} className="feature-card stack">
              <div className="section-heading">
                <div>
                  <h3>{ref.title}</h3>
                  <p>{ref.description}</p>
                </div>
                <span className="tag">{ref.source}</span>
              </div>
              <div className="chip-row">
                {ref.labels.map((label) => <span key={label} className="tag">{label}</span>)}
              </div>
              <a className="inline-link" href={ref.href} target="_blank" rel="noreferrer">Open reference</a>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

