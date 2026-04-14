import { useEffect, useState } from 'react'
import { apiFetch } from '../api/client'
import type { DatabaseOverview, MaintenanceRun, MaintenanceRunPage } from '../types'

export function AdminPage() {
  const [data, setData] = useState<DatabaseOverview | null>(null)
  const [runs, setRuns] = useState<MaintenanceRun[]>([])
  const [error, setError] = useState('')
  const [isRunning, setIsRunning] = useState(false)

  async function loadAdminData() {
    try {
      const [database, history] = await Promise.all([
        apiFetch<DatabaseOverview>('/admin/database'),
        apiFetch<MaintenanceRunPage>('/admin/maintenance/runs?limit=5'),
      ])
      setData(database)
      setRuns(history.items)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load database overview')
    }
  }

  useEffect(() => {
    void loadAdminData()
  }, [])

  async function handleRunMaintenance() {
    setIsRunning(true)
    try {
      const run = await apiFetch<MaintenanceRun>('/admin/maintenance/run', {
        method: 'POST',
        body: JSON.stringify({ run_e2e_browser: false, archive_old_audit_logs: false, archive_days_to_keep: 90 }),
      })
      setRuns((current) => [run, ...current].slice(0, 5))
      setError('')
      await loadAdminData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to run maintenance agent')
    } finally {
      setIsRunning(false)
    }
  }

  if (error) {
    return <section className="card"><h2>Database management</h2><p className="error">{error}</p></section>
  }

  const latestRun = runs[0]

  return (
    <section className="stack">
      <div className="grid two-col">
        <article className="card">
          <h2>Database management</h2>
          <div className="stats-grid">
            {data && Object.entries(data.stats).map(([key, value]) => (
              <div className="stat-card" key={key}>
                <strong>{value}</strong>
                <span>{key}</span>
              </div>
            ))}
          </div>
        </article>
        <article className="card">
          <h2>Recent users</h2>
          <div className="stack">
            {data?.users.map((user) => (
              <div key={user.id} className="list-item">
                <strong>{user.username}</strong>
                <span>{user.email}</span>
                <small>{user.is_superuser ? 'Superuser' : 'Standard user'}</small>
              </div>
            ))}
          </div>
        </article>
      </div>

      <article className="card">
        <div className="row between">
          <div>
            <h2>Maintenance agent</h2>
            <p>Run a supervised optimization and reliability pass. It checks data integrity, collaboration safety, audit coverage, and release-readiness signals.</p>
          </div>
          <button onClick={handleRunMaintenance} disabled={isRunning}>
            {isRunning ? 'Running checks…' : 'Run maintenance agent'}
          </button>
        </div>

        {latestRun ? (
          <div className="stack">
            <div className="list-item">
              <strong>Latest run: {latestRun.status.toUpperCase()}</strong>
              <span>{latestRun.summary}</span>
              <small>{new Date(latestRun.created_at).toLocaleString()}</small>
            </div>
            <div className="grid two-col">
              <div>
                <h3>Checks</h3>
                <div className="stack">
                  {latestRun.findings.map((check) => (
                    <div key={check.key} className="list-item">
                      <strong>{check.key.replaceAll('_', ' ')}</strong>
                      <span>{check.summary}</span>
                      <small>Status: {check.status}</small>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3>Suggested UX and reliability improvements</h3>
                <div className="stack">
                  {latestRun.optimization_suggestions.map((suggestion, index) => (
                    <div key={index} className="list-item">
                      <span>{suggestion}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p>No maintenance runs have been recorded yet.</p>
        )}
      </article>

      <article className="card">
        <h2>Recent maintenance history</h2>
        <div className="stack">
          {runs.map((run) => (
            <div key={run.id} className="list-item">
              <strong>{run.status.toUpperCase()}</strong>
              <span>{run.summary}</span>
              <small>{new Date(run.created_at).toLocaleString()}</small>
            </div>
          ))}
        </div>
      </article>
    </section>
  )
}
