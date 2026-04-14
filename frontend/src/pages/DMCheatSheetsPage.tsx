
import { PageHero } from '../components/PageHero'

type CheatSheet = {
  slug: string
  title: string
  eyebrow: string
  sections: Array<{ title: string; bullets: string[] }>
}

const SHEETS: CheatSheet[] = [
  {
    slug: 'combat',
    title: 'Combat Cheat Sheet',
    eyebrow: 'Printable quick reference',
    sections: [
      { title: 'Turn structure', bullets: ['Roll initiative and act from highest to lowest.', 'On your turn, you usually get movement, one action, possible bonus action, and interaction with an object.', 'A reaction happens when its trigger occurs, usually outside your turn.'] },
      { title: 'Common actions', bullets: ['Attack, Cast a Spell, Dash, Disengage, Dodge, Help, Hide, Ready, Search, Use an Object.', 'Movement can be split before and after your action.', 'Cover, visibility, and range affect attack rolls.'] },
      { title: 'Remember during play', bullets: ['Track concentration.', 'Track conditions.', 'Call out reaction triggers and opportunity attacks.', 'Mark the end of each round clearly.'] },
    ],
  },
  {
    slug: 'conditions',
    title: 'Conditions Cheat Sheet',
    eyebrow: 'Printable quick reference',
    sections: [
      { title: 'Awareness and control', bullets: ['Blinded: cannot see, often grants attackers advantage.', 'Charmed: cannot target the charmer with harmful abilities or attacks.', 'Frightened: disadvantage while the source of fear is in view.'] },
      { title: 'Movement and restraint', bullets: ['Grappled: speed becomes 0.', 'Restrained: speed 0, attacks against you often gain advantage, your attacks often have disadvantage.', 'Prone: harder to move, melee attackers gain advantage, ranged attackers may suffer disadvantage.'] },
      { title: 'Severe conditions', bullets: ['Incapacitated: no actions or reactions.', 'Stunned / Paralyzed / Unconscious: major combat impact; check attacks, saves, and movement carefully.', 'Invisible: cannot be seen without special senses or magic; targeting rules still matter.'] },
    ],
  },
  {
    slug: 'travel',
    title: 'Overland Travel Cheat Sheet',
    eyebrow: 'Printable quick reference',
    sections: [
      { title: 'Travel pacing', bullets: ['Decide pace first: fast, normal, or slow.', 'Adjust distance, stealth, and perception by pace.', 'Apply terrain difficulty for mountains, swamps, snow, forests, and broken roads.'] },
      { title: 'Journey pressure', bullets: ['Use weather, supplies, exhaustion risk, and navigation checks.', 'Add landmarks and camps to break up long travel scenes.', 'Let travel reveal rumors, signs of monsters, and faction presence.'] },
      { title: 'At the table', bullets: ['State distance and destination clearly.', 'Call for checks only when failure is meaningful.', 'Keep a visible log of days, encounters, and discovered locations.'] },
    ],
  },
]

function downloadHtmlAsFile(filename: string, html: string) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function renderSheetHtml(sheet: CheatSheet) {
  const body = `
  <html>
  <head>
    <meta charset="utf-8" />
    <title>${sheet.title}</title>
    <style>
      body { font-family: Georgia, serif; margin: 32px; color: #222; }
      h1 { margin-bottom: 0.25rem; }
      .eyebrow { text-transform: uppercase; letter-spacing: 0.08em; font-size: 12px; color: #6b4a1e; }
      .section { border: 1px solid #bbb; border-radius: 12px; padding: 12px 16px; margin-bottom: 12px; }
      h2 { margin: 0 0 8px; font-size: 20px; }
      ul { margin: 0; padding-left: 20px; }
      li { margin-bottom: 6px; }
    </style>
  </head>
  <body>
    <div class="eyebrow">${sheet.eyebrow}</div>
    <h1>${sheet.title}</h1>
    ${sheet.sections.map((section) => `
      <section class="section">
        <h2>${section.title}</h2>
        <ul>${section.bullets.map((bullet) => `<li>${bullet}</li>`).join('')}</ul>
      </section>
    `).join('')}
  </body>
  </html>`
  return body
}

export function DMCheatSheetsPage() {
  return (
    <div className="page-shell">
      <PageHero
        variant="dashboard"
        imageSrc="/art/dashboard-banner.png"
        imageAlt="Fantasy dashboard banner"
        eyebrow="DM Cheat Sheets"
        title="Printable One-Page References"
        description="Use these one-page summaries for combat, conditions, and overland travel during play or print them for the table."
        tags={['Combat', 'Conditions', 'Travel', 'Print-ready']}
      >
        <div className="hero-tags">
          <button type="button" onClick={() => window.print()}>Print all sheets</button>
        </div>
      </PageHero>

      <section className="grid cheat-sheet-grid">
        {SHEETS.map((sheet) => (
          <article key={sheet.slug} className="card cheat-sheet-page">
            <div className="cheat-sheet-header">
              <p className="eyebrow">{sheet.eyebrow}</p>
              <h2>{sheet.title}</h2>
            </div>
            {sheet.sections.map((section) => (
              <section key={section.title} className="cheat-sheet-section">
                <h3>{section.title}</h3>
                <ul>
                  {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                </ul>
              </section>
            ))}
            <div className="hero-tags cheat-sheet-actions">
              <button type="button" onClick={() => window.print()}>Print</button>
              <button type="button" onClick={() => downloadHtmlAsFile(`${sheet.slug}-cheat-sheet.html`, renderSheetHtml(sheet))}>Download sheet</button>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}

