
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { PageHero } from '../components/PageHero'

export function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="page-shell">
      <PageHero
        variant="dashboard"
        imageSrc="/art/dashboard-banner.png"
        imageAlt="A fantasy adventuring party standing together before a ruined stronghold"
        eyebrow="Adventurer's hub"
        title="Gather the Party"
        description="Build heroes, shape campaigns, roll dice, and manage your world from one central command table."
        tags={['Characters', 'Campaigns', 'Party Management']}
      />

      <section className="grid two-col">
      <article className="card stack">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Adventure dashboard</p>
            <h2>Welcome{user ? `, ${user.username}` : ''}</h2>
            <p>Create heroes, map party arcs, and keep your table's lore in one place.</p>
          </div>
          <div className="section-tags">
            <span className="tag">High fantasy theme</span>
            <span className="tag">Guided forms</span>
          </div>
        </div>
        <div className="art-banner">
          <img src="/art/dashboard-badge.png" alt="Dragon and d20 fantasy emblem" />
          <div className="art-banner-copy">
            <h3>Forge a party. Chart a realm. Start the first quest.</h3>
            <p>This visual pass uses original fantasy-styled graphics inspired by official D&D presentation patterns like dark panels, gold accents, crests, and parchment tones.</p>
          </div>
        </div>
        <div className="grid two-col">
          <div className="feature-card">
            <h3>Character forge</h3>
            <p>Build editable character sheets with lineage, class, background, alignment, and party sharing.</p>
          </div>
          <div className="feature-card">
            <h3>Campaign codex</h3>
            <p>Save campaign themes, settings, party assignments, and summaries for fast prep.</p>
          </div>
          <div className="feature-card">
            <h3>Dice altar</h3>
            <p>Roll standard dice or custom dice in a fast tray built for players and DMs.</p>
          </div>
          <div className="feature-card">
            <h3>Reference library</h3>
            <p>Browse categorized open 5e materials by class, lineage, background, and more.</p>
          </div>
          <div className="feature-card">
            <h3>Fillable character sheet</h3>
            <p>Open the uploaded PDF sheet from a single quick link for printing, handwriting, or digital form filling.</p>
            <Link className="inline-link" to="/character-sheet">Open sheet page</Link>
          </div>
        </div>
      </article>
      <article className="card stack">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Design notes</p>
            <h2>What changed in this design pass</h2>
          </div>
          <img className="side-crest" src="/art/dashboard-badge.png" alt="" aria-hidden="true" />
        </div>
        <ul>
          <li>Clear labels, helper text, and grouped form sections on creation pages</li>
          <li>Richer high-fantasy colors, image banners, and crest-like framing for a more magical game feel</li>
          <li>Source badges that distinguish official SRD content, open resources, builder defaults, and custom entries</li>
          <li>Cleaner navigation that highlights the main player and DM workflows</li>
        </ul>
        <div className="notice">
          This redesign draws high-level inspiration from official D&D digital presentation patterns without reusing Wizards of the Coast or D&D Beyond artwork or logos.
        </div>
      </article>
    </section>
    </div>
  )
}
