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
    xPart === 'left'
      ? 0
      : xPart === 'right'
        ? 100
        : xPart === 'center'
          ? 50
          : Number.parseFloat(xPart)

  const y =
    yPart === 'top'
      ? 0
      : yPart === 'bottom'
        ? 100
        : yPart === 'center'
          ? 50
          : Number.parseFloat(yPart)

  return {
    x: Number.isFinite(x) ? x : 50,
    y: Number.isFinite(y) ? y : 0,
  }
}

function storageKeyForBanner(variant: string, title: string, imageSrc: string): string {
  return `dndhub_banner_crop:${variant}:${title}:${imageSrc}`
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
  const storageKey = useMemo(() => storageKeyForBanner(variant, title, imageSrc), [variant, title, imageSrc])

  const [crop, setCrop] = useState<CropPosition>(defaultCrop)
  const [editorEnabled, setEditorEnabled] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)

  const heroRef = useRef<HTMLElement | null>(null)
  const dragStateRef = useRef<{ startX: number; startY: number; startCrop: CropPosition } | null>(null)

  useEffect(() => {
    setCrop(defaultCrop)
  }, [defaultCrop])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const enabledFromUrl = params.get('editBanners') === '1'
    const enabledFromStorage = localStorage.getItem('dndhub_banner_editor') === 'on'

    const savedCrop = localStorage.getItem(storageKey)
    if (savedCrop) {
      try {
        const parsed = JSON.parse(savedCrop) as CropPosition
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          setCrop({
            x: clamp(parsed.x, 0, 100),
            y: clamp(parsed.y, 0, 100),
          })
        }
      } catch {
        // Ignore invalid saved crop values.
      }
    }

    if (enabledFromUrl || enabledFromStorage) {
      setEditorEnabled(true)
      setEditorOpen(true)
      localStorage.setItem('dndhub_banner_editor', 'on')
    }
  }, [storageKey])

  function saveCrop(nextCrop: CropPosition) {
    setCrop(nextCrop)
    localStorage.setItem(storageKey, JSON.stringify(nextCrop))
  }

  function handlePointerDown(event: React.PointerEvent<HTMLImageElement>) {
    if (!editorEnabled) return
    if (!heroRef.current) return

    event.preventDefault()

    dragStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startCrop: crop,
    }

    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: React.PointerEvent<HTMLImageElement>) {
    if (!editorEnabled || !dragStateRef.current || !heroRef.current) return

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
    saveCrop(crop)
    dragStateRef.current = null
  }

  function resetCrop() {
    saveCrop(defaultCrop)
  }

  async function copyCropValue() {
    await navigator.clipboard.writeText(`object-position: ${crop.x.toFixed(0)}% ${crop.y.toFixed(0)}%;`)
  }

  function toggleEditor() {
    const next = !editorEnabled
    setEditorEnabled(next)
    setEditorOpen(next)
    localStorage.setItem('dndhub_banner_editor', next ? 'on' : 'off')
  }

  return (
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
          cursor: editorEnabled ? 'grab' : undefined,
          userSelect: 'none',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
      <div className="page-hero__overlay" />

      <button
        type="button"
        className="button-link secondary"
        onClick={toggleEditor}
        style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          zIndex: 3,
          minHeight: '40px',
          padding: '0.55rem 0.9rem',
          boxShadow: '0 8px 22px rgba(0,0,0,0.28)',
        }}
      >
       BANNER TEST BUTTON
      </button>

      <div className="page-hero__content">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{description}</p>
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

        {editorEnabled && editorOpen ? (
          <div
            className="card stack"
            style={{
              marginTop: '1rem',
              background: 'rgba(16, 12, 10, 0.86)',
              border: '1px solid rgba(214, 180, 96, 0.3)',
              maxWidth: '28rem',
              position: 'relative',
              zIndex: 2,
            }}
          >
            <strong>Banner crop editor</strong>
            <small>Drag the image directly or use the sliders below. Values save to localStorage for this page.</small>

            <label>
              Horizontal ({crop.x.toFixed(0)}%)
              <input
                type="range"
                min="0"
                max="100"
                value={crop.x}
                onChange={(event) => saveCrop({ ...crop, x: Number(event.target.value) })}
              />
            </label>

            <label>
              Vertical ({crop.y.toFixed(0)}%)
              <input
                type="range"
                min="0"
                max="100"
                value={crop.y}
                onChange={(event) => saveCrop({ ...crop, y: Number(event.target.value) })}
              />
            </label>

            <div className="action-row">
              <button type="button" onClick={resetCrop}>
                Reset
              </button>
              <button type="button" className="button-link secondary" onClick={() => void copyCropValue()}>
                Copy CSS
              </button>
            </div>
          </div>
        ) : null}

        {children}
      </div>
    </section>
  )
}
