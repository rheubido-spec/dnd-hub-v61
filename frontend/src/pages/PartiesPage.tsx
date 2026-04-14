
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { apiFetch, apiFetchBlob } from '../api/client'
import type { AuditLogFilterOptions, Party, PartyAuditLogPage, PartyInvite } from '../types'

export function PartiesPage() {
  const [parties, setParties] = useState<Party[]>([])
  const [invites, setInvites] = useState<PartyInvite[]>([])
  const [selectedPartyId, setSelectedPartyId] = useState<number | null>(null)
  const [filterOptions, setFilterOptions] = useState<AuditLogFilterOptions | null>(null)
  const [auditPage, setAuditPage] = useState<PartyAuditLogPage | null>(null)
  const [error, setError] = useState('')
  const [partyForm, setPartyForm] = useState({ name: '', description: '', theme: 'Classic Fantasy' })
  const [inviteForm, setInviteForm] = useState({ username: '', role: 'player' })
  const [filters, setFilters] = useState({ q: '', action: '', entity_type: '', actor_id: '', sort_by: 'created_at', sort_dir: 'desc', page: 1, page_size: 10 })

  const selectedParty = useMemo(() => parties.find((party) => party.id === selectedPartyId) ?? null, [parties, selectedPartyId])

  async function loadParties() {
    const [partyData, inviteData] = await Promise.all([
      apiFetch<Party[]>('/parties'),
      apiFetch<PartyInvite[]>('/parties/invites'),
    ])
    setParties(partyData)
    setInvites(inviteData)
    if (!selectedPartyId && partyData.length > 0) setSelectedPartyId(partyData[0].id)
  }

  async function loadAudit(partyId: number, nextFilters = filters) {
    const params = new URLSearchParams()
    if (nextFilters.q) params.set('q', nextFilters.q)
    if (nextFilters.action) params.set('action', nextFilters.action)
    if (nextFilters.entity_type) params.set('entity_type', nextFilters.entity_type)
    if (nextFilters.actor_id) params.set('actor_id', nextFilters.actor_id)
    params.set('sort_by', nextFilters.sort_by)
    params.set('sort_dir', nextFilters.sort_dir)
    params.set('page', String(nextFilters.page))
    params.set('page_size', String(nextFilters.page_size))

    const [options, pageData] = await Promise.all([
      apiFetch<AuditLogFilterOptions>(`/parties/${partyId}/audit-logs/filter-options`),
      apiFetch<PartyAuditLogPage>(`/parties/${partyId}/audit-logs?${params.toString()}`),
    ])
    setFilterOptions(options)
    setAuditPage(pageData)
  }

  useEffect(() => { void loadParties().catch((err) => setError(err instanceof Error ? err.message : 'Unable to load parties')) }, [])
  useEffect(() => { if (selectedPartyId) void loadAudit(selectedPartyId).catch((err) => setError(err instanceof Error ? err.message : 'Unable to load audit logs')) }, [selectedPartyId])

  async function createParty(e: FormEvent) {
    e.preventDefault()
    await apiFetch('/parties', { method: 'POST', body: JSON.stringify(partyForm) })
    setPartyForm({ name: '', description: '', theme: 'Classic Fantasy' })
    await loadParties()
  }

  async function sendInvite() {
    if (!selectedPartyId) return
    await apiFetch(`/parties/${selectedPartyId}/invites`, { method: 'POST', body: JSON.stringify(inviteForm) })
    setInviteForm({ username: '', role: 'player' })
    await loadAudit(selectedPartyId)
  }

  async function acceptInvite(inviteId: number) {
    await apiFetch(`/parties/invites/${inviteId}/accept`, { method: 'POST' })
    await loadParties()
  }

  async function exportLogs() {
    if (!selectedPartyId) return
    const params = new URLSearchParams()
    if (filters.q) params.set('q', filters.q)
    if (filters.action) params.set('action', filters.action)
    if (filters.entity_type) params.set('entity_type', filters.entity_type)
    if (filters.actor_id) params.set('actor_id', filters.actor_id)
    params.set('sort_by', filters.sort_by)
    params.set('sort_dir', filters.sort_dir)
    const blob = await apiFetchBlob(`/parties/${selectedPartyId}/audit-logs/export?${params.toString()}`)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `party-${selectedPartyId}-audit-logs.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function applyFilters(e?: FormEvent) {
    e?.preventDefault()
    if (!selectedPartyId) return
    const next = { ...filters, page: 1 }
    setFilters(next)
    await loadAudit(selectedPartyId, next)
  }

  async function changePage(delta: number) {
    if (!selectedPartyId || !auditPage) return
    const nextPage = Math.max(1, filters.page + delta)
    const next = { ...filters, page: nextPage }
    setFilters(next)
    await loadAudit(selectedPartyId, next)
  }

  return (
    <section className="grid two-col">
      <article className="card stack">
        <h2>Parties</h2>
        <form className="form-grid" onSubmit={createParty}>
          <label>
            Party name
            <input value={partyForm.name} onChange={(e) => setPartyForm({ ...partyForm, name: e.target.value })} placeholder="The Argent Company" />
          </label>
          <label>
            Party theme
            <input value={partyForm.theme} onChange={(e) => setPartyForm({ ...partyForm, theme: e.target.value })} placeholder="Classic Fantasy" />
          </label>
          <label>
            Party description
            <textarea value={partyForm.description} onChange={(e) => setPartyForm({ ...partyForm, description: e.target.value })} placeholder="Who belongs to this party, and what kind of adventures do they seek?" />
          </label>
          <button type="submit">Create party</button>
        </form>
        {error ? <p className="error">{error}</p> : null}
        <div className="stack">
          {parties.map((party) => (
            <button key={party.id} className={`tab-button ${selectedPartyId === party.id ? 'active' : ''}`} onClick={() => setSelectedPartyId(party.id)} type="button">
              {party.name} · {party.theme}
            </button>
          ))}
        </div>
        <h3>My invites</h3>
        <div className="stack">
          {invites.map((invite) => (
            <div key={invite.id} className="list-item">
              <strong>Party #{invite.party_id}</strong>
              <span>Role: {invite.role}</span>
              <button type="button" onClick={() => { void acceptInvite(invite.id) }}>Accept</button>
            </div>
          ))}
        </div>
      </article>

      <article className="card stack">
        <h2>{selectedParty ? `${selectedParty.name}` : 'Select a party'}</h2>
        {selectedParty ? (
          <>
            <div className="stack">
              <strong>Members</strong>
              {selectedParty.memberships.map((membership) => (
                <div key={membership.id} className="list-item">
                  <strong>{membership.user.username}</strong>
                  <span>{membership.role}</span>
                </div>
              ))}
            </div>

            <div className="stack">
              <h3>Invite user</h3>
              <div className="grid form-inline">
                <input placeholder="Username" value={inviteForm.username} onChange={(e) => setInviteForm({ ...inviteForm, username: e.target.value })} />
                <select value={inviteForm.role} onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}>
                  <option value="player">player</option>
                  <option value="dm">dm</option>
                </select>
                <button type="button" onClick={() => { void sendInvite() }}>Send invite</button>
              </div>
            </div>

            <div className="stack">
              <div className="row between wrap">
                <h3>Party audit log</h3>
                <button type="button" onClick={() => { void exportLogs() }}>Export CSV</button>
              </div>
              <form className="stack audit-filter-panel" onSubmit={(e) => { void applyFilters(e) }}>
                <div className="grid form-inline">
                  <label>
                    Search
                    <input value={filters.q} onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))} placeholder="actor, action, details..." />
                  </label>
                  <label>
                    Action
                    <select value={filters.action} onChange={(e) => setFilters((prev) => ({ ...prev, action: e.target.value }))}>
                      <option value="">All actions</option>
                      {filterOptions?.actions.map((action) => <option key={action} value={action}>{action}</option>)}
                    </select>
                  </label>
                  <label>
                    Entity
                    <select value={filters.entity_type} onChange={(e) => setFilters((prev) => ({ ...prev, entity_type: e.target.value }))}>
                      <option value="">All entities</option>
                      {filterOptions?.entity_types.map((entityType) => <option key={entityType} value={entityType}>{entityType}</option>)}
                    </select>
                  </label>
                  <label>
                    Actor
                    <select value={filters.actor_id} onChange={(e) => setFilters((prev) => ({ ...prev, actor_id: e.target.value }))}>
                      <option value="">All actors</option>
                      {filterOptions?.actors.map((actor) => <option key={actor.id} value={String(actor.id)}>{actor.username}</option>)}
                    </select>
                  </label>
                  <label>
                    Sort by
                    <select value={filters.sort_by} onChange={(e) => setFilters((prev) => ({ ...prev, sort_by: e.target.value }))}>
                      <option value="created_at">created_at</option>
                      <option value="action">action</option>
                      <option value="entity_type">entity_type</option>
                      <option value="actor">actor</option>
                    </select>
                  </label>
                  <label>
                    Direction
                    <select value={filters.sort_dir} onChange={(e) => setFilters((prev) => ({ ...prev, sort_dir: e.target.value }))}>
                      <option value="desc">desc</option>
                      <option value="asc">asc</option>
                    </select>
                  </label>
                </div>
                <button type="submit">Apply filters</button>
              </form>
              <div className="stack">
                {auditPage?.items.map((log) => (
                  <div key={log.id} className="list-item">
                    <strong>{log.action}</strong>
                    <span>{log.entity_type}{log.entity_id ? ` #${log.entity_id}` : ''}</span>
                    <small>{log.actor?.username ?? 'system'} · {new Date(log.created_at).toLocaleString()}</small>
                    <pre className="json-block">{JSON.stringify(log.details, null, 2)}</pre>
                  </div>
                ))}
              </div>
              <div className="row between wrap">
                <span>Total: {auditPage?.total ?? 0}</span>
                <div className="row gap-small wrap">
                  <button type="button" className="button-secondary" onClick={() => { void changePage(-1) }} disabled={(auditPage?.page ?? 1) <= 1}>Previous</button>
                  <span>Page {auditPage?.page ?? 1}</span>
                  <button type="button" className="button-secondary" onClick={() => { void changePage(1) }} disabled={Boolean(auditPage && (auditPage.page * auditPage.page_size >= auditPage.total))}>Next</button>
                </div>
              </div>
            </div>
          </>
        ) : <p>Select or create a party to manage members and view audit logs.</p>}
      </article>
    </section>
  )
}
