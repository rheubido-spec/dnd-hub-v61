import { FormEvent, useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../api/client'
import { ChipPicker } from '../components/ChipPicker'
import { SearchableField } from '../components/SearchableField'
import { CAMPAIGN_MOODS, CAMPAIGN_SETTINGS, CAMPAIGN_THEMES, PARTY_TAGS } from '../data/srdOptions'
import { SourceBadgeRow } from '../components/SourceBadge'
import { useAuth } from '../contexts/AuthContext'
import { PageHero } from '../components/PageHero'
import type { Campaign, Party, ReferenceMaterial, ReferenceOptionsResponse } from '../types'

type CampaignForm = {
  title: string
  theme: string
  setting_name: string
  summary: string
  status: string
  party_id: string
}

function formFromCampaign(item: Campaign): CampaignForm {
  return {
    title: item.title,
    theme: item.theme,
    setting_name: item.setting_name,
    summary: item.summary,
    status: item.status,
    party_id: item.party_id ? String(item.party_id) : '',
  }
}

export function CampaignsPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<Campaign[]>([])
  const [parties, setParties] = useState<Party[]>([])
  const [referenceGroups, setReferenceGroups] = useState<Record<string, ReferenceMaterial[]>>({})
  const [importMessage, setImportMessage] = useState('')
  const [campaignTags, setCampaignTags] = useState<string[]>(['Epic'])
  const [partyFocusTags, setPartyFocusTags] = useState<string[]>([])
  const [form, setForm] = useState<CampaignForm>({ title: '', theme: 'High Fantasy', setting_name: 'Homebrew Realm', summary: '', status: 'draft', party_id: '' })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<CampaignForm>({ title: '', theme: 'High Fantasy', setting_name: 'Homebrew Realm', summary: '', status: 'draft', party_id: '' })
  const [editCampaignTags, setEditCampaignTags] = useState<string[]>([])
  const [editPartyFocusTags, setEditPartyFocusTags] = useState<string[]>([])
  const [actionMessage, setActionMessage] = useState('')

  async function load() {
    const [campaignData, partyData] = await Promise.all([
      apiFetch<Campaign[]>('/campaigns'),
      apiFetch<Party[]>('/parties'),
    ])
    setItems(campaignData)
    setParties(partyData)
  }

  async function loadReferenceOptions() {
    const data = await apiFetch<ReferenceOptionsResponse>('/reference/options?categories=campaign_theme&categories=campaign_setting&categories=campaign_mood&categories=party_focus')
    const nextGroups = Object.fromEntries(data.groups.map((group) => [group.category, group.items]))
    setReferenceGroups(nextGroups)
  }

  async function importOfficialOptions() {
    setImportMessage('Syncing official SRD starter options...')
    try {
      const result = await apiFetch<{ source_count: number; material_count: number }>('/reference/seed-open-content', { method: 'POST' })
      setImportMessage(`Imported ${result.material_count} option records for builder use.`)
      await loadReferenceOptions()
    } catch (err) {
      setImportMessage(err instanceof Error ? err.message : 'Unable to sync builder options.')
    }
  }

  useEffect(() => {
    void load()
    void loadReferenceOptions().catch(() => undefined)
  }, [])

  const themeOptions = referenceGroups.campaign_theme?.map((item) => item.name) ?? CAMPAIGN_THEMES
  const settingOptions = referenceGroups.campaign_setting?.map((item) => item.name) ?? CAMPAIGN_SETTINGS
  const moodOptions = referenceGroups.campaign_mood?.map((item) => item.name) ?? CAMPAIGN_MOODS
  const partyOptions = referenceGroups.party_focus?.map((item) => item.name) ?? PARTY_TAGS

  function toggleTag(value: string, selected: string[], setter: (next: string[]) => void) {
    setter(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value])
  }

  const summaryHint = useMemo(() => {
    const tagText = [...campaignTags, ...partyFocusTags].join(', ')
    return tagText ? `Current vibe: ${tagText}` : 'Pick a few tags to guide your opening pitch.'
  }, [campaignTags, partyFocusTags])

  async function create(e: FormEvent) {
    e.preventDefault()
    setActionMessage('')
    await apiFetch<Campaign>('/campaigns', {
      method: 'POST',
      body: JSON.stringify({
        ...form,
        party_id: form.party_id ? Number(form.party_id) : null,
        campaign_data: {
          acts: [],
          factions: [],
          npcs: [],
          mood_tags: campaignTags,
          party_focus_tags: partyFocusTags,
        },
      }),
    })
    setForm({ title: '', theme: 'High Fantasy', setting_name: 'Homebrew Realm', summary: '', status: 'draft', party_id: '' })
    setCampaignTags(['Epic'])
    setPartyFocusTags([])
    setActionMessage('Campaign saved to your account.')
    await load()
  }

  function beginEdit(item: Campaign) {
    setEditingId(item.id)
    setEditForm(formFromCampaign(item))
    setEditCampaignTags(Array.isArray(item.campaign_data?.mood_tags) ? item.campaign_data.mood_tags as string[] : [])
    setEditPartyFocusTags(Array.isArray(item.campaign_data?.party_focus_tags) ? item.campaign_data.party_focus_tags as string[] : [])
    setActionMessage('')
  }

  async function saveEdit(e: FormEvent) {
    e.preventDefault()
    if (!editingId) return
    setActionMessage('')
    await apiFetch<Campaign>(`/campaigns/${editingId}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...editForm,
        party_id: editForm.party_id ? Number(editForm.party_id) : null,
        campaign_data: {
          acts: [],
          factions: [],
          npcs: [],
          mood_tags: editCampaignTags,
          party_focus_tags: editPartyFocusTags,
        },
      }),
    })
    setEditingId(null)
    setActionMessage('Campaign updated.')
    await load()
  }

  async function removeCampaign(item: Campaign) {
    const confirmed = window.confirm(`Delete ${item.title}? This removes the campaign from the account that owns it.`)
    if (!confirmed) return
    setActionMessage('')
    await apiFetch(`/campaigns/${item.id}`, { method: 'DELETE' })
    if (editingId === item.id) setEditingId(null)
    setActionMessage('Campaign deleted.')
    await load()
  }

  async function cloneCampaign(item: Campaign) {
    setActionMessage('')
    await apiFetch<Campaign>(`/campaigns/${item.id}/clone`, { method: 'POST' })
    setActionMessage('Campaign cloned into your saved roster as a draft branch.')
    await load()
  }

  return (
    <div className="page-shell">
      <PageHero
        variant="campaigns"
        imageSrc="/art/campaigns-banner.png"
        imageAlt="Adventuring party battling a monstrous beast in a frozen mountain pass"
        eyebrow="Campaign designer"
        title="Forge Epic Adventures"
        description="Shape themes, setting, mood, and party focus for your next quest, then save, branch, and refine every version."
        tags={['High Fantasy', 'Story Arcs', 'Party Hooks']}
      />

      <section className="grid two-col">
      <article className="card stack">
        <div className="section-heading">
          <div>
            <h2>Campaign designer</h2>
            <p>Build campaigns with searchable SRD-friendly themes and setting ideas, then layer mood and party-focus chips for a clearer table pitch.</p>
          </div>
          <div className="section-tags">
            <span className="tag">Searchable themes</span>
            <span className="tag">Mood tags</span>
            <span className="tag">Player-facing clarity</span>
          </div>
        </div>
        <div className="toolbar-row">
          <button type="button" onClick={() => void importOfficialOptions()}>Import official SRD starter options</button>
          <span className="field-hint">{importMessage || `Loaded ${themeOptions.length} themes, ${settingOptions.length} settings, ${moodOptions.length} moods, and ${partyOptions.length} party tags.`}</span>
        </div>

        <div className="art-banner compact">
          <img src="/campaign-map.svg" alt="" aria-hidden="true" />
          <div className="art-banner-copy">
            <h3>Frame the quest before the session starts</h3>
            <p>Builder tags now show source badges so you can tell official/open content apart from app-curated campaign planning vocab.</p>
          </div>
        </div>

        {actionMessage ? <div className="notice">{actionMessage}</div> : null}

        <form onSubmit={create} className="form-grid">
          <div className="form-section stack">
            <h3>Core campaign details</h3>
            <div className="form-inline">
              <label>
                Campaign title
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="The Ember Crown" />
                <span className="field-hint">The headline players see first.</span>
              </label>
              <div className="stack-tight">
                <SearchableField
                  label="Theme"
                  value={form.theme}
                  onChange={(value) => setForm({ ...form, theme: value })}
                  options={themeOptions}
                  placeholder="Search a campaign theme"
                  hint="Choose the broad fantasy frame for the story."
                  listId="campaign-theme-options"
                />
                <SourceBadgeRow items={referenceGroups.campaign_theme} />
              </div>
              <div className="stack-tight">
                <SearchableField
                  label="Setting"
                  value={form.setting_name}
                  onChange={(value) => setForm({ ...form, setting_name: value })}
                  options={settingOptions}
                  placeholder="Search a setting"
                  hint="Pick an established or homebrew starting world."
                  listId="campaign-setting-options"
                />
                <SourceBadgeRow items={referenceGroups.campaign_setting} />
              </div>
            </div>
            <ChipPicker
              label="Theme chips"
              options={themeOptions}
              selected={[form.theme]}
              onToggle={(value) => setForm({ ...form, theme: value })}
              hint="Use chips for quick direction changes while planning."
            />
          </div>

          <div className="form-section stack">
            <h3>Story tone and party fit</h3>
            <div className="stack-tight">
              <ChipPicker
                label="Mood tags"
                options={moodOptions}
                selected={campaignTags}
                onToggle={(value) => toggleTag(value, campaignTags, setCampaignTags)}
                hint="Add tags that describe the atmosphere and pacing of the campaign."
              />
              <SourceBadgeRow items={referenceGroups.campaign_mood} />
            </div>
            <div className="stack-tight">
              <ChipPicker
                label="Party focus tags"
                options={partyOptions}
                selected={partyFocusTags}
                onToggle={(value) => toggleTag(value, partyFocusTags, setPartyFocusTags)}
                hint="Signal what kind of table experience players should expect."
              />
              <SourceBadgeRow items={referenceGroups.party_focus} />
            </div>
            <label>
              Campaign summary
              <textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} rows={5} placeholder="Describe the opening threat, major factions, and the first adventure hook." />
              <span className="field-hint">{summaryHint}</span>
            </label>
            <div className="chip-row">
              {campaignTags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
              {partyFocusTags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
            </div>
          </div>

          <div className="form-section stack">
            <h3>Publishing state</h3>
            <div className="form-inline">
              <label>
                Status
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
                <span className="field-hint">Drafts are perfect for prep between sessions.</span>
              </label>
              <label>
                Linked party
                <select value={form.party_id} onChange={(e) => setForm({ ...form, party_id: e.target.value })}>
                  <option value="">No party</option>
                  {parties.map((party) => <option key={party.id} value={party.id}>{party.name}</option>)}
                </select>
                <span className="field-hint">Attach the campaign to one party for shared records.</span>
              </label>
            </div>
          </div>

          <button type="submit">Save campaign</button>
        </form>
      </article>

      <article className="card stack">
        <div className="section-heading">
          <div>
            <h2>Cloud-saved campaigns</h2>
            <p>Edit or delete campaigns stored on each account. Party-linked campaigns still respect DM permissions on the backend.</p>
          </div>
          <div className="section-tags">
            <span className="tag">Edit, clone, delete</span>
            <span className="tag">Account ownership</span>
            <span className="tag">DM-aware controls</span>
          </div>
        </div>
        <div className="stack">
          {items.map((item) => {
            const moodTags = Array.isArray(item.campaign_data?.mood_tags) ? item.campaign_data.mood_tags as string[] : []
            const focusTags = Array.isArray(item.campaign_data?.party_focus_tags) ? item.campaign_data.party_focus_tags as string[] : []
            const isOwner = user?.id === item.owner_id || user?.id === item.dm_user_id
            const isEditing = editingId === item.id
            return (
              <div key={item.id} className="list-item stack">
                <strong>{item.title}</strong>
                <span>{item.theme} · {item.setting_name}</span>
                <div className="chip-row">
                  {moodTags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
                  {focusTags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
                </div>
                <small>Status: {item.status}</small>
                <small>DM #{item.dm_user_id}{item.party_id ? ` · Party #${item.party_id}` : ''}</small>

                {isOwner ? (
                  <div className="action-row">
                    <button type="button" onClick={() => beginEdit(item)}>{isEditing ? 'Editing now' : 'Edit campaign'}</button>
                    <button type="button" className="button-link secondary" onClick={() => void cloneCampaign(item)}>Clone campaign</button>
                    <button type="button" className="button-link secondary danger-button" onClick={() => void removeCampaign(item)}>Delete campaign</button>
                  </div>
                ) : (
                  <div className="field-hint">This campaign is visible to your account, but only the owning account or DM can edit or delete it.</div>
                )}

                {isEditing ? (
                  <form onSubmit={saveEdit} className="form-grid inline-editor">
                    <div className="form-section stack">
                      <h3>Edit campaign details</h3>
                      <div className="form-inline">
                        <label>
                          Campaign title
                          <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                        </label>
                        <SearchableField
                          label="Theme"
                          value={editForm.theme}
                          onChange={(value) => setEditForm({ ...editForm, theme: value })}
                          options={themeOptions}
                          placeholder="Search a campaign theme"
                          hint="Update the broad fantasy frame for the story."
                          listId={`campaign-theme-edit-options-${item.id}`}
                        />
                        <SearchableField
                          label="Setting"
                          value={editForm.setting_name}
                          onChange={(value) => setEditForm({ ...editForm, setting_name: value })}
                          options={settingOptions}
                          placeholder="Search a setting"
                          hint="Choose the world or region for this campaign."
                          listId={`campaign-setting-edit-options-${item.id}`}
                        />
                      </div>
                      <label>
                        Campaign summary
                        <textarea value={editForm.summary} onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })} rows={4} />
                      </label>
                    </div>

                    <div className="form-section stack">
                      <h3>Edit tags and publication</h3>
                      <ChipPicker
                        label="Mood tags"
                        options={moodOptions}
                        selected={editCampaignTags}
                        onToggle={(value) => toggleTag(value, editCampaignTags, setEditCampaignTags)}
                        hint="Refresh the tone for the campaign."
                      />
                      <ChipPicker
                        label="Party focus tags"
                        options={partyOptions}
                        selected={editPartyFocusTags}
                        onToggle={(value) => toggleTag(value, editPartyFocusTags, setEditPartyFocusTags)}
                        hint="Update what kind of player experience this campaign promises."
                      />
                      <div className="form-inline">
                        <label>
                          Status
                          <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                            <option value="draft">Draft</option>
                            <option value="active">Active</option>
                            <option value="archived">Archived</option>
                          </select>
                        </label>
                        <label>
                          Linked party
                          <select value={editForm.party_id} onChange={(e) => setEditForm({ ...editForm, party_id: e.target.value })}>
                            <option value="">No party</option>
                            {parties.map((party) => <option key={party.id} value={party.id}>{party.name}</option>)}
                          </select>
                        </label>
                      </div>
                    </div>

                    <div className="action-row">
                      <button type="submit">Save changes</button>
                      <button type="button" className="button-link secondary" onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  </form>
                ) : null}
              </div>
            )
          })}
          {!items.length && <p>No campaigns saved yet.</p>}
        </div>
      </article>
    </section>
    </div>
  )
}