'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { fmtDist, fmtDuration } from '@/lib/osrmRouting';
import { DirectionStep } from '@/lib/types';

const TRAFFIC_COLOR: Record<string, string> = {
  light: '#16a34a', moderate: '#d97706', heavy: '#dc2626',
};

// ── SVG arrow icons ─────────────────────────────────────────
function NavIcon({ icon }: { icon: string }) {
  const s = { width: 28, height: 28 };
  const stroke = { fill: 'none', stroke: 'white', strokeWidth: 2.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  switch (icon) {
    case '↑': return (
      <svg {...s} viewBox="0 0 24 24" {...stroke}>
        <line x1="12" y1="19" x2="12" y2="5"/>
        <polyline points="5 12 12 5 19 12"/>
      </svg>
    );
    case '↰': return (
      <svg {...s} viewBox="0 0 24 24" {...stroke}>
        <polyline points="15 18 9 12 15 6"/>
        <line x1="9" y1="12" x2="9" y2="18"/><line x1="9" y1="18" x2="16" y2="18"/>
      </svg>
    );
    case '↱': return (
      <svg {...s} viewBox="0 0 24 24" {...stroke}>
        <polyline points="9 18 15 12 9 6"/>
        <line x1="15" y1="12" x2="15" y2="18"/><line x1="15" y1="18" x2="8" y2="18"/>
      </svg>
    );
    case '↖': return (
      <svg {...s} viewBox="0 0 24 24" {...stroke}>
        <line x1="17" y1="17" x2="7" y2="7"/><polyline points="7 17 7 7 17 7"/>
      </svg>
    );
    case '↗': return (
      <svg {...s} viewBox="0 0 24 24" {...stroke}>
        <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
      </svg>
    );
    case '↩': return (
      <svg {...s} viewBox="0 0 24 24" {...stroke}>
        <polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/>
      </svg>
    );
    case '↪': return (
      <svg {...s} viewBox="0 0 24 24" {...stroke}>
        <polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/>
      </svg>
    );
    case '🔄': return (
      <svg {...s} viewBox="0 0 24 24" {...stroke}>
        <circle cx="12" cy="12" r="7"/>
        <polyline points="12 5 12 9 15 9"/>
      </svg>
    );
    case '🚦': return (
      <svg {...s} viewBox="0 0 24 24" {...stroke}>
        <rect x="9" y="2" width="6" height="20" rx="3"/>
        <circle cx="12" cy="7" r="1.8" fill="white"/>
      </svg>
    );
    case '🏁': return (
      <svg {...s} viewBox="0 0 24 24" {...stroke}>
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
        <line x1="4" y1="22" x2="4" y2="15"/>
      </svg>
    );
    default: return (
      <svg {...s} viewBox="0 0 24 24" {...stroke}>
        <line x1="12" y1="19" x2="12" y2="5"/>
        <polyline points="5 12 12 5 19 12"/>
      </svg>
    );
  }
}

export function NavigationPanel() {
  const { isNavigating, selectedService, selectedRoute, exitNavigation } = useApp();
  const [stepIndex, setStepIndex] = useState(0);
  const [swipeHint, setSwipeHint] = useState(true);

  useEffect(() => { setStepIndex(0); setSwipeHint(true); }, [selectedRoute]);
  useEffect(() => {
    if (swipeHint) {
      const t = setTimeout(() => setSwipeHint(false), 2500);
      return () => clearTimeout(t);
    }
  }, [swipeHint]);

  if (!isNavigating || !selectedService || !selectedRoute) return null;

  const steps: DirectionStep[] = selectedRoute.steps ?? [];
  const current: DirectionStep | undefined = steps[stepIndex];
  const next: DirectionStep | undefined = steps[stepIndex + 1];
  const totalSteps = steps.length;
  const isLastStep = stepIndex >= totalSteps - 1;
  const progress = totalSteps > 1 ? ((stepIndex) / (totalSteps - 1)) * 100 : 100;

  const handleNext = () => { if (!isLastStep) setStepIndex(i => i + 1); };
  const handlePrev = () => { if (stepIndex > 0) setStepIndex(i => i - 1); };

  // Step icon background color
  const iconBg = (() => {
    if (stepIndex === 0) return '#2563eb';
    if (isLastStep) return '#16a34a';
    if (current?.icon === '🔄') return '#7c3aed';
    if (current?.icon === '↩' || current?.icon === '↪') return '#dc2626';
    return '#1e293b';
  })();

  return (
    <div style={{
      position: 'absolute',
      top: '14px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 32px)',
      maxWidth: '520px',
      zIndex: 30,
      pointerEvents: 'none',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '22px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.20), 0 4px 16px rgba(0,0,0,0.10)',
        border: '1px solid rgba(255,255,255,0.8)',
        overflow: 'hidden',
        pointerEvents: 'all',
      }}>

        {/* ── Overall progress bar ── */}
        <div style={{ height: '4px', background: '#e2e8f0' }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #2563eb, #3b82f6)',
            transition: 'width 0.4s ease',
          }} />
        </div>

        {/* ── Current step ── */}
        <div style={{
          background: `linear-gradient(135deg, ${iconBg} 0%, ${iconBg}dd 100%)`,
          padding: '16px 18px',
          display: 'flex', alignItems: 'center', gap: '14px',
        }}>
          {/* Direction icon */}
          <div style={{
            width: '54px', height: '54px', flexShrink: 0,
            borderRadius: '16px',
            background: 'rgba(255,255,255,0.18)',
            border: '1.5px solid rgba(255,255,255,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <NavIcon icon={current?.icon ?? '↑'} />
          </div>

          {/* Instruction text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '15px', fontWeight: 800, color: 'white',
              lineHeight: 1.3, marginBottom: '4px',
            }}>
              {current?.instruction ?? 'Continue to destination'}
            </div>
            {current && current.distance > 2 && (
              <div style={{
                fontSize: '13px', color: 'rgba(255,255,255,0.8)', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                <span>{fmtDist(current.distance)}</span>
                <span style={{ opacity: 0.5 }}>·</span>
                <span>{fmtDuration(current.duration)}</span>
              </div>
            )}
          </div>

          {/* Step counter */}
          <div style={{
            flexShrink: 0, textAlign: 'center',
            background: 'rgba(255,255,255,0.18)',
            borderRadius: '10px', padding: '6px 10px',
          }}>
            <div style={{ fontSize: '16px', fontWeight: 900, color: 'white', lineHeight: 1 }}>
              {stepIndex + 1}
            </div>
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
              of {totalSteps}
            </div>
          </div>
        </div>

        {/* ── Next step preview ── */}
        {next && (
          <div style={{
            padding: '10px 18px',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '8px',
              background: '#334155',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: 0.7, flexShrink: 0,
            }}>
              <NavIcon icon={next.icon ?? '↑'} />
            </div>
            <div>
              <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, marginRight: '4px' }}>
                THEN
              </span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                {next.instruction}
              </span>
            </div>
            {next.distance > 2 && (
              <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#94a3b8', flexShrink: 0, fontWeight: 600 }}>
                {fmtDist(next.distance)}
              </span>
            )}
          </div>
        )}

        {/* ── Info + controls row ── */}
        <div style={{
          padding: '12px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'white',
        }}>
          {/* Route stats */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                {selectedRoute.distance.toFixed(1)} <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>km</span>
              </div>
              <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: 500 }}>total</div>
            </div>
            <div style={{ width: '1px', height: '28px', background: '#e2e8f0' }} />
            <div>
              <div style={{ fontSize: '15px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                {selectedRoute.duration} <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>min</span>
              </div>
              <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: 500 }}>ETA: {selectedRoute.arrivalTime}</div>
            </div>
            <div style={{ width: '1px', height: '28px', background: '#e2e8f0' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{
                width: '7px', height: '7px', borderRadius: '50%',
                background: TRAFFIC_COLOR[selectedRoute.traffic] ?? '#94a3b8',
              }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: TRAFFIC_COLOR[selectedRoute.traffic] }}>
                {selectedRoute.traffic === 'light' ? 'Clear' : selectedRoute.traffic === 'moderate' ? 'Moderate' : 'Heavy'}
              </span>
            </div>
          </div>

          {/* Navigation controls */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button
              onClick={handlePrev}
              disabled={stepIndex === 0}
              title="Previous step"
              style={{
                width: '36px', height: '36px', borderRadius: '10px',
                border: '1.5px solid #e2e8f0',
                background: stepIndex === 0 ? '#f8fafc' : 'white',
                cursor: stepIndex === 0 ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px', color: stepIndex === 0 ? '#cbd5e1' : '#334155',
                transition: 'all 0.12s',
              }}
            >‹</button>

            <button
              onClick={handleNext}
              disabled={isLastStep}
              title="Next step"
              style={{
                width: '36px', height: '36px', borderRadius: '10px',
                border: '1.5px solid #e2e8f0',
                background: isLastStep ? '#f8fafc' : 'white',
                cursor: isLastStep ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px', color: isLastStep ? '#cbd5e1' : '#334155',
                transition: 'all 0.12s',
              }}
            >›</button>

            <button
              onClick={exitNavigation}
              title="Exit navigation"
              style={{
                width: '36px', height: '36px', borderRadius: '10px',
                border: '1.5px solid rgba(220,38,38,0.25)',
                background: '#fef2f2',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', color: '#dc2626',
                transition: 'all 0.12s',
              }}
            >✕</button>
          </div>
        </div>

        {/* ── Destination name ── */}
        <div style={{
          padding: '8px 18px 12px',
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>DESTINATION</span>
          <span style={{
            fontSize: '12px', fontWeight: 700, color: '#334155',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {selectedService.name}
          </span>
          {isLastStep && (
            <span style={{
              marginLeft: 'auto', fontSize: '10px', fontWeight: 800,
              color: '#16a34a', background: '#f0fdf4',
              padding: '2px 8px', borderRadius: '99px', flexShrink: 0,
            }}>YOU&apos;VE ARRIVED!</span>
          )}
        </div>
      </div>
    </div>
  );
}
