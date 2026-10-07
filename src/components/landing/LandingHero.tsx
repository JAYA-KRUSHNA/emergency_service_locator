'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const STATS = [
  { value: '50+', label: 'Service Types' },
  { value: '24/7', label: 'Available' },
  { value: '<1 min', label: 'Response Time' },
  { value: '100%', label: 'Free to Use' },
];

const FEATURES = [
  {
    icon: '📍',
    title: 'Instant Location',
    desc: 'Auto-detect your GPS location',
  },
  {
    icon: '🏥',
    title: '8 Categories',
    desc: 'Hospitals, Police, Fire & more',
  },
  {
    icon: '🗺️',
    title: 'Live Navigation',
    desc: 'Turn-by-turn directions',
  },
];

export function LandingHero() {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleGetStarted = () => {
    setIsNavigating(true);
    setTimeout(() => router.push('/locator'), 300);
  };

  if (!mounted) return null;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        padding: '24px',
      }}
    >
      {/* ── Background decoration ── */}
      {/* Top-right gradient blob */}
      <div style={{
        position: 'absolute',
        top: '-120px',
        right: '-120px',
        width: '560px',
        height: '560px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(37,99,235,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      {/* Bottom-left blob */}
      <div style={{
        position: 'absolute',
        bottom: '-100px',
        left: '-100px',
        width: '480px',
        height: '480px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(220,38,38,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      {/* Subtle dot grid */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(circle, rgba(148,163,184,0.35) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
        pointerEvents: 'none',
        maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)',
      }} />

      {/* ── Content ── */}
      <div
        className="anim-fade-in-up"
        style={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          maxWidth: '600px',
          width: '100%',
        }}
      >
        {/* Logo mark */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            {/* Outer ring */}
            <div style={{
              position: 'absolute',
              inset: '-8px',
              borderRadius: '28px',
              background: 'rgba(37,99,235,0.08)',
              border: '1px solid rgba(37,99,235,0.12)',
            }} />
            {/* Icon box */}
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 16px 40px rgba(37,99,235,0.28), 0 4px 12px rgba(37,99,235,0.18)',
              fontSize: '30px',
              position: 'relative',
            }}>
              📍
              {/* Emergency badge */}
              <div style={{
                position: 'absolute',
                top: '-6px',
                right: '-6px',
                width: '22px',
                height: '22px',
                background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                borderRadius: '50%',
                border: '2.5px solid white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(220,38,38,0.4)',
              }}>
                <span style={{ color: 'white', fontSize: '10px', fontWeight: 800 }}>!</span>
              </div>
            </div>
          </div>
        </div>

        {/* Eye-brow label */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(37,99,235,0.07)',
          border: '1px solid rgba(37,99,235,0.15)',
          borderRadius: '99px',
          padding: '5px 14px',
          marginBottom: '20px',
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--c-primary)', letterSpacing: '0.02em' }}>
            Always Available · No Sign-up Required
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 'clamp(2.2rem, 5vw, 3.4rem)',
          fontWeight: 800,
          color: 'var(--c-text-1)',
          lineHeight: 1.15,
          letterSpacing: '-0.03em',
          marginBottom: '16px',
        }}>
          Emergency Service
          <br />
          <span style={{
            background: 'linear-gradient(135deg, var(--c-primary) 0%, #1e40af 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Locator
          </span>
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: '1.05rem',
          color: 'var(--c-text-2)',
          lineHeight: 1.65,
          marginBottom: '36px',
          maxWidth: '420px',
          margin: '0 auto 36px',
        }}>
          Find nearby emergency services quickly and get there safely. Hospitals, police, fire stations, and more — all in one place.
        </p>

        {/* CTA */}
        <div style={{ marginBottom: '48px' }}>
          <button
            onClick={handleGetStarted}
            disabled={isNavigating}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '15px 36px',
              fontSize: '1rem',
              fontWeight: 700,
              color: 'white',
              background: isNavigating
                ? 'var(--c-primary-hover)'
                : 'linear-gradient(135deg, var(--c-primary) 0%, #1d4ed8 100%)',
              border: 'none',
              borderRadius: '14px',
              cursor: isNavigating ? 'not-allowed' : 'pointer',
              boxShadow: '0 8px 28px rgba(37,99,235,0.32), 0 2px 8px rgba(37,99,235,0.16)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              letterSpacing: '0.02em',
              transform: isNavigating ? 'scale(0.98)' : 'scale(1)',
            }}
            onMouseEnter={e => {
              if (!isNavigating) {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.03) translateY(-1px)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 36px rgba(37,99,235,0.38), 0 4px 12px rgba(37,99,235,0.20)';
              }
            }}
            onMouseLeave={e => {
              if (!isNavigating) {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 28px rgba(37,99,235,0.32), 0 2px 8px rgba(37,99,235,0.16)';
              }
            }}
          >
            {isNavigating ? (
              <>
                <svg style={{ width: 18, height: 18, animation: 'spin 0.8s linear infinite' }} viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                  <path d="M4 12a8 8 0 018-8" stroke="white" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Opening Locator…
              </>
            ) : (
              <>
                GET STARTED
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </div>

        {/* Feature pills */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '48px' }}>
          {FEATURES.map((f) => (
            <div key={f.title} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: 'var(--c-surface-2)',
              border: '1px solid var(--c-border)',
              borderRadius: '99px',
            }}>
              <span style={{ fontSize: '16px' }}>{f.icon}</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--c-text-1)' }}>{f.title}</div>
                <div style={{ fontSize: '10px', color: 'var(--c-text-3)' }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1px',
          background: 'var(--c-border)',
          border: '1px solid var(--c-border)',
          borderRadius: '16px',
          overflow: 'hidden',
        }}>
          {STATS.map((s) => (
            <div key={s.label} style={{
              padding: '16px 12px',
              background: 'white',
              textAlign: 'center',
            }}>
              <div style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                color: 'var(--c-primary)',
                lineHeight: 1,
                letterSpacing: '-0.02em',
                marginBottom: '4px',
              }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: 'var(--c-text-3)', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
