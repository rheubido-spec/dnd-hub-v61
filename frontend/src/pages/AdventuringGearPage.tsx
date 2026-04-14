import { Link } from 'react-router-dom'
import { PageHero } from '../components/PageHero'

const cards = [
  { slug: 'weapons', title: 'Weapons', description: 'Browse simple and martial weapons with cost, damage, weight, and properties.', tags: ['damage', 'properties', 'cost'] },
  { slug: 'armor', title: 'Armor', description: 'Review light, medium, heavy armor and shields with AC and wear requirements.', tags: ['light', 'medium', 'heavy'] },
  { slug: 'adventuring-gear', title: 'Adventuring Gear', description: 'Search tools, travel gear, containers, lighting, and utility equipment.', tags: ['travel', 'utility', 'containers'] },
  { slug: 'mounts', title: 'Mounts', description: 'Check cost, speed, size, and carrying capacity for common SRD mounts.', tags: ['speed', 'size', 'capacity'] },
]

export function AdventuringGearPage() {
  return (
    <div className="page-shell">
      <PageHero
        variant="campaigns"
        imageSrc="/art/adventuring-gear-banner.png"
        imageAlt="A fantasy outfitting shop with armor, weapons, packs, lanterns, and adventuring supplies"
        eyebrow="Adventuring Gear"
        title="Outfit the Party"
        description="Browse SRD-backed weapons, armor, gear, and mounts with cost, weight, speed, size, properties, and other key equipment details."
        tags={['Weapons', 'Armor', 'Gear', 'Mounts']}
      />

      <section className="grid two-col">
        {cards.map((card) => (
          <article key={card.slug} className="card stack">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Equipment reference</p>
                <h2>{card.title}</h2>
                <p>{card.description}</p>
              </div>
            </div>
            <div className="chip-row">
              {card.tags.map((tag) => <span key={tag} className="tag">{tag}</span>)}
            </div>
            <div className="hero-tags">
              <Link className="button-link secondary" to={`/adventuring-gear/${card.slug}`}>Open {card.title}</Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
