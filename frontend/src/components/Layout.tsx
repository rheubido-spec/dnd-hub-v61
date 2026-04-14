import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const links = [
  ['/', 'Dashboard'],
  ['/characters', 'Characters'],
  ['/campaigns', 'Campaigns'],
  ['/character-sheet', 'Character Sheet'],
  ['/adventuring-gear', 'Gear'],
  ['/parties', 'Parties'],
  ['/dice', 'Dice'],
  ['/dm-suite', 'DM Suite'],
  ['/dm-cheat-sheets', 'DM Sheets'],
  ['/dm-encounter-tracker', 'Tracker'],
  ['/dm-loot-generator', 'Loot'],
  ['/maps', 'Maps'],
  ['/forum', 'Forum'],
  ['/references', 'References'],
] as const

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="shell">
      <header className="topbar">
        <section className="hero-panel">
          <div className="hero-art" aria-hidden="true">
            <img src="/hero-dragon.svg" alt="" />
          </div>

          <div className="hero-row">
            <div className="hero-copy">
              <p className="eyebrow">Original fantasy-inspired interface</p>
              <h1>D&D Hub</h1>
              <p>
                Build heroes, shape campaigns, roll dice, and coordinate party play
                in a magical high-fantasy workspace.
              </p>
            </div>

            <div className="topbar__actions">
              <span className="topbar__user">{user?.email ?? 'Adventurer'}</span>
              <button type="button" onClick={logout}>
                Log out
              </button>
            </div>
          </div>

          <form
            className="quickref-global-search"
            onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const q = String(formData.get('q') ?? '').trim()
              navigate(q ? `/dm-suite?q=${encodeURIComponent(q)}` : '/dm-suite')
            }}
          >
            <input
              name="q"
              placeholder="Quick reference search..."
              aria-label="Quick reference search"
            />
            <button type="submit">Search</button>
          </form>

          <nav className="topnav" aria-label="Primary">
            {links.map(([to, label]) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  isActive ? 'nav-link active' : 'nav-link'
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </section>
      </header>

      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}
