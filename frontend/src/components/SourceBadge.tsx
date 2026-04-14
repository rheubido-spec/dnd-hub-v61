
import type { ReferenceMaterial } from '../types'

type Props = {
  label: string
  tone?: 'official' | 'open' | 'builder' | 'custom'
}

export function SourceBadge({ label, tone = 'open' }: Props) {
  return <span className={`source-badge ${tone}`}>{label}</span>
}

export function SourceBadgeRow({ items }: { items: ReferenceMaterial[] | undefined }) {
  if (!items || items.length === 0) {
    return (
      <div className="source-badge-row">
        <SourceBadge tone="builder" label="Starter builder defaults" />
      </div>
    )
  }

  const first = items[0]
  const badges: { label: string; tone: 'official' | 'open' | 'builder' | 'custom' }[] = []

  if (first.is_open_content && first.source_name.toLowerCase().includes('srd')) {
    badges.push({ label: 'Official SRD 5.2.1', tone: 'official' })
  } else if (first.is_open_content) {
    badges.push({ label: first.source_name, tone: 'open' })
  } else {
    badges.push({ label: first.source_name, tone: 'builder' })
  }

  if (first.license_name) {
    badges.push({ label: first.license_name, tone: first.is_open_content ? 'open' : 'builder' })
  }

  return (
    <div className="source-badge-row">
      {badges.map((badge) => <SourceBadge key={badge.label} label={badge.label} tone={badge.tone} />)}
    </div>
  )
}
