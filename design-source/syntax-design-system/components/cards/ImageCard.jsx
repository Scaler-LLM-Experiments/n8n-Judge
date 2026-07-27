import React from 'react';

/**
 * ImageCard — an image-led content card for landing pages (course, article,
 * event, story). Full-bleed photo on top, content beneath. Zero radius, 1px
 * hairline border, no resting shadow; a soft navy lift appears on hover when
 * `href`/`onClick` make it interactive. Two layouts via `variant`:
 * "stacked" (default — photo on top, content beneath) and "overlay"
 * (full-bleed photo fills the card, content sits inside over a dark scrim).
 */
export function ImageCard({
  image,
  alt = '',
  eyebrow,
  title,
  excerpt,
  meta,
  cta,
  ratio = '16 / 10',
  variant = 'stacked',
  href,
  onClick,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const interactive = !!(href || onClick);
  const overlay = variant === 'overlay';
  const Wrapper = href ? 'a' : 'div';

  return (
    <Wrapper
      href={href}
      onClick={onClick}
      onMouseEnter={() => interactive && setHover(true)}
      onMouseLeave={() => interactive && setHover(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        aspectRatio: overlay ? ratio : undefined,
        background: 'var(--surface-0)',
        border: '1px solid',
        borderColor: interactive && hover ? 'var(--border-strong)' : 'var(--border-subtle)',
        boxShadow: interactive && hover ? 'var(--shadow-md)' : 'none',
        borderRadius: 0,
        overflow: 'hidden',
        cursor: interactive ? 'pointer' : 'default',
        transition: 'border-color 140ms var(--ease-standard,ease), box-shadow 140ms var(--ease-standard,ease)',
        color: 'inherit',
        textDecoration: 'none',
        ...style,
      }}
      {...rest}
    >
      {overlay ? (
        <>
          <img
            src={image}
            alt={alt}
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block',
              transition: 'transform 400ms var(--ease-standard,ease)',
              transform: interactive && hover ? 'scale(1.04)' : 'none',
            }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(8,12,24,0.88) 0%, rgba(8,12,24,0.45) 38%, rgba(8,12,24,0) 70%)' }} />
          <div style={{ position: 'relative', marginTop: 'auto', padding: 22, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {eyebrow ? (
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9DC0FF' }}>
                {eyebrow}
              </span>
            ) : null}
            {title ? (
              <h4 style={{ fontFamily: 'var(--font-headline)', fontSize: 22, fontWeight: 500, lineHeight: 1.18, letterSpacing: '-0.01em', color: '#fff', margin: 0 }}>
                {title}
              </h4>
            ) : null}
            {excerpt ? (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.55, color: 'rgba(255,255,255,0.82)', margin: 0 }}>{excerpt}</p>
            ) : null}
            {(meta || cta) ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 4 }}>
                {meta ? <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.62)' }}>{meta}</span> : <span />}
                {cta ? <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 6 }}>{cta}</span> : null}
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <>
          <div style={{ position: 'relative', width: '100%', aspectRatio: ratio, overflow: 'hidden', background: 'var(--surface-2)' }}>
            <img
              src={image}
              alt={alt}
              style={{
                width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                transition: 'transform 400ms var(--ease-standard,ease)',
                transform: interactive && hover ? 'scale(1.04)' : 'none',
              }}
            />
          </div>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
            {eyebrow ? (
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--brand-primary)' }}>
                {eyebrow}
              </span>
            ) : null}
            {title ? (
              <h4 style={{ fontFamily: 'var(--font-headline)', fontSize: 20, fontWeight: 500, lineHeight: 1.2, letterSpacing: '-0.01em', color: 'var(--fg-1)', margin: 0 }}>
                {title}
              </h4>
            ) : null}
            {excerpt ? (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.55, color: 'var(--fg-3)', margin: 0 }}>{excerpt}</p>
            ) : null}
            {(meta || cta) ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 'auto', paddingTop: 12 }}>
                {meta ? <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--fg-4)' }}>{meta}</span> : <span />}
                {cta ? <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--brand-primary)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>{cta}</span> : null}
              </div>
            ) : null}
          </div>
        </>
      )}
    </Wrapper>
  );
}
