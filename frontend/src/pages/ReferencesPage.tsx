import { useEffect, useState } from 'react'
import { apiFetch } from '../api/client'
import type { ReferenceMaterial, ReferenceMaterialPage, SourceRegistry } from '../types'
import { SourceBadge } from '../components/SourceBadge'

export function ReferencesPage() {
  const [links, setLinks] = useState<{ official: { label: string; url: string }[]; open: { label: string; url: string }[]; review_required: { label: string; url: string; note: string }[] } | null>(null)
  const [sources, setSources] = useState<SourceRegistry[]>([])
  const [materials, setMaterials] = useState<ReferenceMaterial[]>([])
  const [category, setCategory] = useState('')
  const [sourceKey, setSourceKey] = useState('')
  const [q, setQ] = useState('')

  async function loadMaterials(nextCategory = category, nextSourceKey = sourceKey, nextQ = q) {
    const params = new URLSearchParams()
    if (nextCategory) params.set('category', nextCategory)
    if (nextSourceKey) params.set('source_key', nextSourceKey)
    if (nextQ) params.set('q', nextQ)
    const data = await apiFetch<ReferenceMaterialPage>(`/reference/materials?${params.toString()}`)
    setMaterials(data.items)
  }

  useEffect(() => {
    void apiFetch<{ official: { label: string; url: string }[]; open: { label: string; url: string }[]; review_required: { label: string; url: string; note: string }[] }>('/reference/links').then(setLinks)
    void apiFetch<SourceRegistry[]>('/reference/sources').then(setSources)
    void loadMaterials('', '', '')
  }, [])

  const categories = Array.from(new Set(materials.map((item) => item.category).concat(['race', 'class', 'background']))).sort()

  return (
    <section className="grid two-col">
      <article className="card stack">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Library and provenance</p>
            <h2>Trusted source links</h2>
          </div>
          <img className="side-crest" src="/character-crest.svg" alt="" aria-hidden="true" />
        </div>
        <div className="form-section stack">
          <h3>Official open rules</h3>
          <ul>
            {links?.official.map((item) => <li key={item.url}><a href={item.url} target="_blank" rel="noreferrer">{item.label}</a></li>)}
          </ul>
        </div>
        <div className="form-section stack">
          <h3>Open SRD resources</h3>
          <ul>
            {links?.open.map((item) => <li key={item.url}><a href={item.url} target="_blank" rel="noreferrer">{item.label}</a></li>)}
          </ul>
        </div>
        <div className="notice">
          5etools is not being bulk-imported here by default. It remains in the manual-review category until its reuse permissions are verified for this app.
        </div>
        <div className="form-section stack">
          <h3>Sources requiring manual review</h3>
          <ul>
            {links?.review_required.map((item) => <li key={item.url}><a href={item.url} target="_blank" rel="noreferrer">{item.label}</a> — {item.note}</li>)}
          </ul>
        </div>
      </article>
      <article className="card stack">
        <div className="section-heading">
          <div>
            <h2>Reference database</h2>
            <p>Browse categorized materials by class, lineage, background, and other reference types.</p>
          </div>
          <div className="section-tags">
            <span className="tag">Categorized content</span>
            <span className="tag">Open sources first</span>
          </div>
        </div>
        <div className="form-inline">
          <label>
            Category
            <select value={category} onChange={(e) => { const value = e.target.value; setCategory(value); void loadMaterials(value, sourceKey, q) }}>
              <option value="">All categories</option>
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label>
            Source
            <select value={sourceKey} onChange={(e) => { const value = e.target.value; setSourceKey(value); void loadMaterials(category, value, q) }}>
              <option value="">All sources</option>
              {sources.map((item) => <option key={item.source_key} value={item.source_key}>{item.display_name}</option>)}
            </select>
          </label>
          <label>
            Search terms
            <input value={q} onChange={(e) => setQ(e.target.value)} onBlur={() => { void loadMaterials(category, sourceKey, q) }} placeholder="fighter, soldier, human..." />
          </label>
        </div>
        <div className="stack">
          {materials.map((item: ReferenceMaterial) => (
            <div key={item.id} className="list-item">
              <strong>{item.name}</strong>
              <div className="chip-row">
                <span className="tag">{item.category}</span>
                <SourceBadge tone={item.is_open_content ? 'official' : 'builder'} label={item.source_name} />
                {item.license_name ? <SourceBadge tone={item.is_open_content ? 'open' : 'builder'} label={item.license_name} /> : null}
              </div>
              <small>{item.summary}</small>
            </div>
          ))}
        </div>
      </article>
    </section>
  )
}