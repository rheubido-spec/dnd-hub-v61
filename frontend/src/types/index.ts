
export type User = {
  id: number
  email: string
  username: string
  is_active: boolean
  is_superuser: boolean
}

export type PartyMembership = {
  id: number
  user_id: number
  role: 'dm' | 'player' | string
  user: User
}

export type Party = {
  id: number
  owner_id: number
  name: string
  description: string
  theme: string
  created_at: string
  updated_at: string
  memberships: PartyMembership[]
}

export type PartyInvite = {
  id: number
  party_id: number
  invitee_user_id: number
  invited_by_user_id: number
  role: string
  status: string
  created_at: string
}

export type PartyAuditLog = {
  id: number
  party_id: number
  actor_id: number | null
  action: string
  entity_type: string
  entity_id: number | null
  details: Record<string, unknown>
  created_at: string
  actor?: User | null
}

export type PartyAuditLogPage = {
  items: PartyAuditLog[]
  total: number
  page: number
  page_size: number
  sort_by: string
  sort_dir: string
}

export type Character = {
  id: number
  owner_id: number
  party_id: number | null
  name: string
  lineage: string
  char_class: string
  background: string
  level: number
  alignment: string
  shared_with_party: boolean
  sheet_data: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type Campaign = {
  id: number
  owner_id: number
  dm_user_id: number
  party_id: number | null
  title: string
  theme: string
  setting_name: string
  summary: string
  status: string
  campaign_data: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type ForumPost = {
  id: number
  thread_id: number
  author_id: number
  body: string
  created_at: string
}

export type ForumThread = {
  id: number
  author_id: number
  title: string
  topic: string
  body: string
  created_at: string
  posts: ForumPost[]
}

export type DatabaseOverview = {
  stats: {
    users: number
    parties: number
    memberships: number
    characters: number
    campaigns: number
    threads: number
    posts: number
    audit_logs: number
  }
  users: User[]
}

export type AuditLogFilterOptions = {
  actions: string[]
  entity_types: string[]
  actors: User[]
}

export type SourceRegistry = {
  id: number
  source_key: string
  display_name: string
  base_url: string
  license_name: string
  trust_level: string
  is_official: boolean
  is_open_content: boolean
  is_import_enabled: boolean
  import_notes: string
  source_metadata: Record<string, unknown>
}

export type ReferenceMaterial = {
  id: number
  source_key: string
  source_name: string
  license_name: string
  source_url: string
  category: string
  name: string
  slug: string
  edition: string
  summary: string
  tags: string[]
  content: Record<string, unknown>
  is_open_content: boolean
  is_import_enabled: boolean
}

export type ReferenceMaterialPage = {
  items: ReferenceMaterial[]
  total: number
  page: number
  page_size: number
}


export type MaintenanceCheck = {
  key: string
  status: string
  summary: string
  details: Record<string, unknown>
}

export type MaintenanceRun = {
  id: number
  status: string
  summary: string
  checks_run: number
  checks_passed: number
  checks_warned: number
  checks_failed: number
  findings: MaintenanceCheck[]
  optimization_suggestions: string[]
  report_markdown: string
  created_at: string
}

export type MaintenanceRunPage = {
  items: MaintenanceRun[]
  total: number
}


export type ReferenceOptionGroup = {
  category: string
  label: string
  items: ReferenceMaterial[]
}

export type ReferenceOptionsResponse = {
  groups: ReferenceOptionGroup[]
}


export type MapProject = {
  id: number
  owner_id: number
  name: string
  summary: string
  map_data: Record<string, unknown>
  created_at: string
  updated_at: string
}
export type EncounterTrackerState = {
  id: number
  owner_id: number
  title: string
  tracker_data: Record<string, unknown>
  created_at: string
  updated_at: string
}
