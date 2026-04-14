import React from 'react'

type PageHeroProps = {
  variant?: 'characters' | 'campaigns' | 'dashboard'
  imageSrc: string
  imageAlt: string
  eyebrow: string
  title: string
  description: string
  tags?: string[]
  children?: React.ReactNode
}

export function PageHero({
  variant = 'dashboard',
  imageSrc,
  imageAlt,
  eyebrow,
  title,
  description,
  tags = [],
  children,
}: PageHeroProps) {
  const sharedBannerClass = imageSrc.includes('dashboard-banner')
    ? ' page-hero--shared-dashboard-art'
    : ''

  return (
    <section className={`page-hero page-hero--${variant}${sharedBannerClass}`}>
      <img className="page-hero__image" src={imageSrc} alt={imageAlt} />
      <div className="page-hero__overlay" />
      <div className="page-hero__content">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>

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
  )
}
