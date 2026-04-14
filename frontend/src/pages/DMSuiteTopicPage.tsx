
import { Link, useParams } from 'react-router-dom'
import { PageHero } from '../components/PageHero'
import { AccordionSection } from '../components/AccordionSection'

type TopicContent = {
  title: string
  eyebrow: string
  summary: string
  sections: Array<{ title: string; bullets: string[] }>
  notes?: string[]
}

const TOPICS: Record<string, TopicContent> = {
  'running-the-game': {
    title: 'Running the Game',
    eyebrow: 'SRD Reference',
    summary: 'Keep the session moving with clear rulings, scene framing, and a steady loop of exploration, interaction, and action.',
    sections: [
      { title: 'Scene framing', bullets: ['Start scenes with who, where, and immediate stakes.', 'Remind players what is obvious, urgent, and risky.'] },
      { title: 'Adjudication', bullets: ['Decide whether an outcome is automatic, uncertain, or impossible.', 'If uncertain and meaningful, call for the most relevant check or saving throw.'] },
      { title: 'Exploration pressure', bullets: ['Use time, light, weather, distance, sound, and resource drain to make choices matter.', 'Track consequences openly so players can plan around risk.'] },
    ],
    notes: ['Use the official SRD as the base rules source, then apply table rulings consistently.'],
  },
  combat: {
    title: 'Combat Rules',
    eyebrow: 'SRD Combat',
    summary: 'A quick battle reference for turn order, movement, attacks, and action economy.',
    sections: [
      { title: 'Turn order', bullets: ['Roll initiative and act from highest to lowest.', 'Repeat the order each round until combat ends.'] },
      { title: 'Action economy', bullets: ['Most turns include movement, one action, possible bonus action, and one reaction each round.', 'Movement can be split around your action.'] },
      { title: 'Core reminders', bullets: ['Common actions include Attack, Cast a Spell, Dash, Disengage, Dodge, Help, Hide, Ready, Search, and Use an Object.', 'Track cover, visibility, range, concentration, and reactions.'] },
    ],
  },
  conditions: {
    title: 'Conditions',
    eyebrow: 'SRD Conditions',
    summary: 'Conditions alter movement, attacks, checks, saves, and awareness.',
    sections: [
      { title: 'Awareness effects', bullets: ['Blinded affects seeing and often gives attackers advantage.', 'Invisible changes how creatures are perceived and targeted.'] },
      { title: 'Control effects', bullets: ['Charmed blocks hostile targeting by the charmer.', 'Frightened imposes disadvantage while the source is in sight.'] },
      { title: 'Mobility and combat effects', bullets: ['Grappled sets speed to 0.', 'Prone, restrained, stunned, paralyzed, and unconscious each change attacks, movement, and saves.'] },
    ],
  },
  'overland-travel': {
    title: 'Overland Travel',
    eyebrow: 'DM Toolkit',
    summary: 'Use pace, route danger, and environmental pressure to turn travel into play rather than a skip.',
    sections: [
      { title: 'Travel pace', bullets: ['Choose a pace and decide how it affects distance, stealth, and awareness.', 'Adjust for terrain and weather.'] },
      { title: 'Journey hazards', bullets: ['Use navigation checks, natural hazards, random encounters, and supply pressure.', 'Make landmarks and camps feel distinct.'] },
      { title: 'Running travel scenes', bullets: ['Present distance and objectives clearly.', 'Use discoveries, rumors, and signs of danger to make the route matter.'] },
    ],
  },
  initiative: {
    title: 'Initiative',
    eyebrow: 'Encounter Flow',
    summary: 'Use initiative to organize actions and reactions cleanly.',
    sections: [
      { title: 'Starting initiative', bullets: ['Roll when timing matters and several creatures act in conflict.', 'Resolve surprise before the first full round.'] },
      { title: 'Tracking rounds', bullets: ['Use a visible tracker for turn order.', 'Call out the start and end of each round clearly.'] },
      { title: 'Reducing mistakes', bullets: ['Track conditions beside initiative order.', 'Prompt reaction opportunities when triggers happen.'] },
    ],
  },
  'npc-generator': {
    title: 'NPC Generator',
    eyebrow: 'Generator',
    summary: 'Create an NPC quickly by combining role, demeanor, goal, and secret.',
    sections: [
      { title: 'Role', bullets: ['Pick a job or social position: merchant, guard, priest, scholar, outlaw, artisan.'] },
      { title: 'Demeanor', bullets: ['Pick how they present: warm, suspicious, proud, exhausted, curious, evasive.'] },
      { title: 'Goal and secret', bullets: ['Give the NPC a current goal and one secret that can create drama when revealed.'] },
    ],
  },
  'creature-generator': {
    title: 'Creature Generator',
    eyebrow: 'Generator',
    summary: 'Sketch a creature concept fast by combining environment, role, and signature threat.',
    sections: [
      { title: 'Environment', bullets: ['Choose caverns, ruins, coast, woods, tundra, swamp, desert, or another home terrain.'] },
      { title: 'Combat role', bullets: ['Choose brute, ambusher, controller, skirmisher, artillery, or lurker.'] },
      { title: 'Signature threat', bullets: ['Pick one memorable mechanic like breath, gaze, tunneling, illusion, regeneration, or corruption.'] },
    ],
  },
}

export function DMSuiteTopicPage() {
  const { slug = 'running-the-game' } = useParams()
  const topic = TOPICS[slug] ?? TOPICS['running-the-game']

  return (
    <div className="page-shell">
      <PageHero
        variant="characters"
        imageSrc="/art/dashboard-banner.png"
        imageAlt="Fantasy dashboard banner"
        eyebrow={topic.eyebrow}
        title={topic.title}
        description={topic.summary}
        tags={['DM Suite', 'Quick reference']}
      >
        <div className="hero-tags">
          <Link className="button-link secondary" to="/dm-suite">Back to DM Suite</Link>
          <Link className="button-link secondary" to="/dm-cheat-sheets">Open cheat sheets</Link>
        </div>
      </PageHero>

      <section className="card stack">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Expandable reference</p>
            <h2>{topic.title}</h2>
          </div>
        </div>
        <div className="accordion-stack">
          {topic.sections.map((section, index) => (
            <AccordionSection key={section.title} title={section.title} defaultOpen={index === 0}>
              <ul>
                {section.bullets.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </AccordionSection>
          ))}
        </div>
        {topic.notes?.length ? (
          <div className="notice">
            {topic.notes.map((item) => <p key={item}>{item}</p>)}
          </div>
        ) : null}
      </section>

      <section className="card stack">
        <div className="section-heading">
          <div>
            <p className="eyebrow">External quick links</p>
            <h2>Open related references</h2>
          </div>
        </div>
        <div className="hero-tags">
          <a className="button-link secondary" href="https://www.dndbeyond.com/srd" target="_blank" rel="noreferrer">Official SRD</a>
          <a className="button-link secondary" href="https://donjon.bin.sh/5e/quickref/" target="_blank" rel="noreferrer">Donjon Quick Reference</a>
          <a className="button-link secondary" href="https://5e.tools/" target="_blank" rel="noreferrer">5etools</a>
        </div>
      </section>
    </div>
  )
}
