import React, { useEffect, useMemo, useRef, useState } from 'react'

type PageHeroProps = {
  variant?: 'characters' | 'campaigns' | 'dashboard'
  imageSrc: string
  imageAlt: string
  eyebrow: string
  title: string
  description: string
  tags?: string[]
  imageObjectPosition?: string
  children?: React.ReactNode
}

type CropPosition = {
  x: number
  y: number
}

type CurrentUser = {
  username?: string
  is_superuser?: boolean
}

type BannerPrefs = {
  crop: CropPosition
  locked: boolean
  imageSrc: string
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function parseObjectPosition(input?: string): CropPosition {
  if (!input) return { x: 50, y: 0 }

  const normalized = input.trim().toLowerCase()
  if (normalized === 'center top' || normalized === 'top center') return { x: 50, y: 0 }

  const parts = normalized.split(/\s+/)
  const xPart = parts[0]
  const yPart = parts[1]

  const x =
    xPart === 'left' ? 0
    : xPart === 'right' ? 100
    : xPart === 'center' ? 50
    : Number.parseFloat(xPart)

  const y =
    yPart === 'top' ? 0
    : yPart === 'bottom' ? 100
    : yPart === 'center' ? 50
    : Number.parseFloat(yPart)

  return {
    x: Number.isFinite(x) ? x : 50,
    y: Number.isFinite(y) ? y : 0,
  }
}

function storageKeyForBanner(variant: string, imageSrc: string): string {
  return `dndhub_banner_prefs:${variant}:${imageSrc}`
}

function readCurrentUser(): CurrentUser | null {
  const raw = localStorage.getItem('dndhub_user')
  if (!raw) return null

  try {
    return JSON.parse(raw) as CurrentUser
  } catch {
    return null
  }
}

function canEditPageChrome(user: CurrentUser | null): boolean {
  if (!user) return false
  if (user.is_superuser) return true
  return (user.username || '').toLowerCase() === 'rheubido'
}

function loadBannerPrefs(storageKey: string): BannerPrefs | null {
  const raw = localStorage.getItem(storageKey)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as BannerPrefs
    if (
      parsed &&
      typeof parsed === 'object' &&
      parsed.crop &&
      typeof parsed.crop.x === 'number' &&
      typeof parsed.crop.y === 'number'
    ) {
      return {
        crop: {
          x: clamp(parsed.crop.x, 0, 100),
          y: clamp(parsed.crop.y, 0, 100),
        },
        locked: Boolean(parsed.locked),
        imageSrc: typeof parsed.imageSrc === 'string' ? parsed.imageSrc : '',
      }
    }
  } catch {
    // ignore invalid storage
  }

  return null
}

function saveBannerPrefs(storageKey: string, prefs: BannerPrefs) {
  localStorage.setItem(storageKey, JSON.stringify(prefs))
}

export function PageHero({
  variant = 'dashboard',
  imageSrc,
  imageAlt,
  eyebrow,
  title,
  description,
  tags = [],
  imageObjectPosition,
  children,
}: PageHeroProps) {
  const sharedBannerClass = imageSrc.includes('dashboard-banner')
    ? ' page-hero--shared-dashboard-art'
    : ''

  const defaultCrop = useMemo(() => parseObjectPosition(imageObjectPosition), [imageObjectPosition])
  const storageKey = useMemo(() => storageKeyForBanner(variant, imageSrc), [variant, imageSrc])

  const [crop, setCrop] = useState<CropPosition>(defaultCrop)
  const [editorEnabled, setEditorEnabled] = useState(false)
  const [canEdit, setCanEdit] = useState(false)
  const [locked, setLocked] = useState(true)

  const heroRef = useRef<HTMLElement | null>(null)
  const dragStateRef = useRef<{ startX: number; startY: number; startCrop: CropPosition } | null>(null)

  useEffect(() => {
    const user = readCurrentUser()
    const allowed = canEditPageChrome(user)
    setCanEdit(allowed)

    const params = new URLSearchParams(window.location.search)
    const enabledFromUrl = params.get('editBanners') === '1'
    const enabledFromStorage = localStorage.getItem('dndhub_banner_editor') === 'on'

    const savedPrefs = loadBannerPrefs(storageKey)

    if (savedPrefs && savedPrefs.imageSrc === imageSrc) {
      setCrop(savedPrefs.crop)
      setLocked(savedPrefs.locked)
    } else {
      setCrop(defaultCrop)
      setLocked(true)
      saveBannerPrefs(storageKey, {
        crop: defaultCrop,
        locked: true,
        imageSrc,
      })
    }

    if (allowed && (enabledFromUrl || enabledFromStorage)) {
      setEditorEnabled(true)
      localStorage.setItem('dndhub_banner_editor', 'on')
    } else {
      setEditorEnabled(false)
    }
  }, [defaultCrop, imageSrc, storageKey])

  function persist(nextCrop: CropPosition, nextLocked: boolean) {
    setCrop(nextCrop)
    setLocked(nextLocked)
    saveBannerPrefs(storageKey, {
      crop: nextCrop,
      locked: nextLocked,
      imageSrc,
    })
  }

  function handlePointerDown(event: React.PointerEvent<HTMLImageElement>) {
    if (!canEdit || !editorEnabled || locked) return
    const element = heroRef.current
    if (!element) return

    event.preventDefault()

    dragStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startCrop: crop,
    }

    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: React.PointerEvent<HTMLImageElement>) {
    if (!canEdit || !editorEnabled || locked || !dragStateRef.current || !heroRef.current) return

    const rect = heroRef.current.getBoundingClientRect()
    const deltaX = ((event.clientX - dragStateRef.current.startX) / rect.width) * 100
    const deltaY = ((event.clientY - dragStateRef.current.startY) / rect.height) * 100

    setCrop({
      x: clamp(dragStateRef.current.startCrop.x - deltaX, 0, 100),
      y: clamp(dragStateRef.current.startCrop.y - deltaY, 0, 100),
    })
  }

  function handlePointerUp() {
    if (!dragStateRef.current) return
    persist(crop, locked)
    dragStateRef.current = null
  }

  function resetCrop() {
    persist(defaultCrop, true)
  }

  async function copyCropValue() {
    await navigator.clipboard.writeText(`object-position: ${crop.x.toFixed(0)}% ${crop.y.toFixed(0)}%;`)
  }

  function toggleEditor() {
    if (!canEdit) return
    const next = !editorEnabled
    setEditorEnabled(next)
    localStorage.setItem('dndhub_banner_editor', next ? 'on' : 'off')
  }

  function toggleLocked() {
    persist(crop, !locked)
  }

  return (
    <div className="stack" style={{ gap: '0.75rem' }}>
      <section
        ref={heroRef}
        className={`page-hero page-hero--${variant}${sharedBannerClass}`}
        style={{ position: 'relative' }}
      >
        <img
          className="page-hero__image"
          src={imageSrc}
          alt={imageAlt}
          style={{
            objectPosition: `${crop.x}% ${crop.y}%`,
            cursor: canEdit && editorEnabled && !locked ? 'grab' : undefined,
            userSelect: 'none',
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />

        <div className="page-hero__overlay" />

        <div className="page-hero__content" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start' }}>
            <div>
              <p className="eyebrow">{eyebrow}</p>
              <h1>{title}</h1>
              <p>{description}</p>
            </div>
          </div>

          {tags.length ? (
            <div className="chip-row">
              {tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          {children}
        </div>
      </section>

      {canEdit ? (
        <section
          className="card stack"
          style={{
            position: 'relative',
            zIndex: 10,
            background: 'rgba(16, 12, 10, 0.92)',
            border: '1px solid rgba(214, 180, 96, 0.35)',
            marginBottom: '0.75rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <button type="button" className="button-link secondary" onClick={toggleEditor}>
              {editorEnabled ? 'Hide banner editor' : 'Edit banner'}
            </button>

            {editorEnabled ? (
              <>
                <button type="button" onClick={toggleLocked}>
                  {locked ? 'Unlock position' : 'Lock position'}
                </button>
                <button type="button" onClick={resetCrop}>
                  Reset
                </button>
                <button type="button" className="button-link secondary" onClick={() => void copyCropValue()}>
                  Copy CSS
                </button>
              </>
            ) : null}
          </div>

          {editorEnabled ? (
            <>
              <small>
                Banner positions stay locked after saving. They only reset when you unlock them, reset them, or the image source changes.
              </small>

              <label>
                Horizontal ({crop.x.toFixed(0)}%)
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={crop.x}
                  disabled={locked}
                  onChange={(event) => persist({ ...crop, x: Number(event.target.value) }, locked)}
                />
              </label>

              <label>
                Vertical ({crop.y.toFixed(0)}%)
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={crop.y}
                  disabled={locked}
                  onChange={(event) => persist({ ...crop, y: Number(event.target.value) }, locked)}
                />
              </label>

              <small>
                Status: <strong>{locked ? 'Locked' : 'Unlocked'}</strong>
              </small>
            </>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}
