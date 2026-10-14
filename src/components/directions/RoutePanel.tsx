'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { RouteInfo } from '@/lib/types';
import { CATEGORY_LABELS } from '@/lib/constants';
import { fmtDist, fmtDuration } from '@/lib/osrmRouting';
import { formatDistance } from '@/lib/utils';

// ── Shared constants ───────────────────────────────────────
const CAT_EMOJIS: Record<string, string> = {
  hospital: '🏥', police: '🚔', fire: '🚒', ambulance: '🚑',
  pharmacy: '💊', petrol: '⛽', ev_charging: '⚡', government: '🏛️',
};

const TRAFFIC_COLOR: Record<string, string> = {
  light: '#16a34a', moderate: '#d97706', heavy: '#dc2626',
};
const TRAFFIC_LABEL: Record<string, string> = {
  light: 'Light traffic', moderate: 'Moderate traffic', heavy: 'Heavy traffic',
};

// ── SVG direction arrow icons ──────────────────────────────
// Much clearer than Unicode characters
function DirectionIcon({ icon, size = 20 }: { icon: string; size?: number }) {
  const arrows: Record<string, React.ReactNode> = {
    '↑': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
      </svg>
    ),
    '↰': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6"/>
        <line x1="9" y1="12" x2="9" y2="18"/>
        <line x1="9" y1="18" x2="16" y2="18"/>
      </svg>
    ),
    '↱': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6"/>
        <line x1="15" y1="12" x2="15" y2="18"/>
        <line x1="15" y1="18" x2="8" y2="18"/>
      </svg>
    ),
    '↖': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="17" y1="17" x2="7" y2="7"/><polyline points="7 17 7 7 17 7"/>
      </svg>
    ),
    '↗': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
      </svg>
    ),
    '↩': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/>
      </svg>
    ),
    '↪': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/>
      </svg>
    ),
    '🔄': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="7"/><polyline points="12 5 12 8 15 8"/>
      </svg>
    ),
    '🚦': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="7" r="2" fill="currentColor"/><rect x="9" y="2" width="6" height="20" rx="3"/>
      </svg>
    ),
    '🏁': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
      </svg>
    ),
    'ℹ️': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
    ),
  };
  return <>{arrows[icon] ?? arrows['↑']}</>;
}

// ── Route summary card ─────────────────────────────────────
function RouteCard({
  route, selected, onSelect, index,
}: {
  route: RouteInfo; selected: boolean; onSelect: () => void; index: number;
}) {
  const tc = route.traffic;
  return (
    <div
      onClick={onSelect}
      style={{
        borderRadius: '16px',
        border: `2px solid ${selected ? '#2563eb' : '#e2e8f0'}`,
        background: selected
          ? 'linear-gradient(135deg, rgba(37,99,235,0.04), rgba(37,99,235,0.01))'
          : 'white',
        cursor: 'pointer',
        transition: 'all 0.18s',
        overflow: 'hidden',
        boxShadow: selected ? '0 4px 20px rgba(37,99,235,0.14)' : '0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      {/* Card top bar */}
      <div style={{
        background: selected ? '#2563eb' : '#f8fafc',
        padding: '8px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: selected ? 'white' : '#475569' }}>
            {index === 0 ? '🏆 Fastest Route' : `🔀 Alternative ${index}`}
          </span>
        </div>
        {route.isRecommended && (
          <span style={{
            fontSize: '9px', fontWeight: 800, letterSpacing: '0.08em',
            color: selected ? '#2563eb' : '#2563eb',
            background: selected ? 'rgba(255,255,255,0.9)' : 'rgba(37,99,235,0.08)',
            padding: '2px 8px', borderRadius: '99px',
          }}>RECOMMENDED</span>
        )}
      </div>

      {/* Stats row */}
      <div style={{ padding: '14px 16px', display: 'flex', gap: '0', alignItems: 'stretch' }}>
        {/* Distance */}
        <div style={{ flex: 1, textAlign: 'center', borderRight: '1px solid #e2e8f0', paddingRight: '14px' }}>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
            {route.distance.toFixed(1)}
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', marginLeft: '3px' }}>km</span>
          </div>
          <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '3px', fontWeight: 500 }}>by road</div>
        </div>

        {/* Duration */}
        <div style={{ flex: 1, textAlign: 'center', borderRight: '1px solid #e2e8f0', padding: '0 14px' }}>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
            {route.duration}
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', marginLeft: '3px' }}>min</span>
          </div>
          <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '3px', fontWeight: 500 }}>duration</div>
        </div>

        {/* Traffic + ETA */}
        <div style={{ flex: 1.2, textAlign: 'center', paddingLeft: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', lineHeight: 1 }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: TRAFFIC_COLOR[tc] ?? '#94a3b8', flexShrink: 0,
            }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: TRAFFIC_COLOR[tc] }}>
              {TRAFFIC_LABEL[tc]}
            </span>
          </div>
          <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '5px', fontWeight: 500 }}>
            Arrive ~{route.arrivalTime}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step type → background color ──────────────────────────
function stepColor(icon: string, isFirst: boolean, isLast: boolean): string {
  if (isFirst) return '#2563eb';
  if (isLast) return '#16a34a';
  if (icon === '🔄') return '#7c3aed';
  if (icon === '↩' || icon === '↪') return '#dc2626';
  return '#334155';
}

// ── Enhanced Steps List ────────────────────────────────────
function StepsList({ route }: { route: RouteInfo }) {
  const [expanded, setExpanded] = useState(true);
  const steps = route.steps ?? [];
  if (steps.length === 0) return null;

  const totalDist = steps.reduce((s, x) => s + x.distance, 0);

  return (
    <div style={{ marginTop: '4px' }}>
      {/* Section header */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '6px 0 10px', marginBottom: '2px',
        }}
      >
        <span style={{
          fontSize: '11px', fontWeight: 700, color: '#64748b',
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          Turn-by-Turn · {steps.length} steps
        </span>
        <span style={{
          fontSize: '11px', color: '#2563eb', fontWeight: 600,
          background: 'rgba(37,99,235,0.07)', padding: '2px 8px', borderRadius: '99px',
        }}>
          {expanded ? '▲ Collapse' : '▼ Expand'}
        </span>
      </button>

      {expanded && (
        <div style={{
          borderRadius: '14px',
          border: '1.5px solid #e2e8f0',
          overflow: 'hidden',
          background: 'white',
        }}>
          {steps.map((step, i) => {
            const isFirst = i === 0;
            const isLast = i === steps.length - 1;
            const iconColor = stepColor(step.icon, isFirst, isLast);
            const pct = totalDist > 0 ? (step.distance / totalDist) * 100 : 0;

            return (
              <div
                key={i}
                style={{
                  display: 'flex', gap: '0', alignItems: 'stretch',
                  borderBottom: isLast ? 'none' : '1px solid #f1f5f9',
                  background: isFirst ? '#eff6ff' : isLast ? '#f0fdf4' : 'white',
                  transition: 'background 0.15s',
                }}
              >
                {/* Left: step number + connector line */}
                <div style={{
                  width: '52px', flexShrink: 0,
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '14px 0 0',
                }}>
                  {/* Circle icon */}
                  <div style={{
                    width: '34px', height: '34px',
                    borderRadius: '50%',
                    background: iconColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white',
                    flexShrink: 0,
                    boxShadow: `0 2px 8px ${iconColor}44`,
                  }}>
                    <DirectionIcon icon={step.icon} size={16} />
                  </div>
                  {/* Connector line */}
                  {!isLast && (
                    <div style={{
                      width: '2px', flex: 1, minHeight: '12px', marginTop: '4px',
                      background: `linear-gradient(to bottom, ${iconColor}60, #e2e8f080)`,
                    }} />
                  )}
                </div>

                {/* Right: content */}
                <div style={{ flex: 1, padding: '14px 14px 14px 4px', minWidth: 0 }}>
                  {/* Step label */}
                  <div style={{
                    fontSize: '13px', fontWeight: isFirst || isLast ? 700 : 600,
                    color: isFirst ? '#1d4ed8' : isLast ? '#15803d' : '#0f172a',
                    lineHeight: 1.35, marginBottom: '5px',
                  }}>
                    {step.instruction}
                  </div>

                  {/* Road name badge (if different from instruction) */}
                  {step.roadName && !step.instruction.includes(step.roadName) && (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      fontSize: '10.5px', color: '#475569',
                      background: '#f1f5f9', padding: '2px 8px',
                      borderRadius: '6px', marginBottom: '6px',
                      fontWeight: 500,
                    }}>
                      🛣️ {step.roadName}
                    </div>
                  )}

                  {/* Distance + duration + progress bar */}
                  {step.distance > 2 && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                        <span style={{
                          fontSize: '12px', fontWeight: 700, color: '#334155',
                        }}>
                          {fmtDist(step.distance)}
                        </span>
                        <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>·</span>
                        <span style={{ fontSize: '10.5px', color: '#64748b' }}>
                          {fmtDuration(step.duration)}
                        </span>
                      </div>

                      {/* Mini progress bar showing this step's share of total route */}
                      <div style={{
                        height: '3px', borderRadius: '99px',
                        background: '#e2e8f0', overflow: 'hidden',
                        maxWidth: '160px',
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.min(pct, 100)}%`,
                          background: iconColor,
                          borderRadius: '99px',
                          transition: 'width 0.4s ease',
                        }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main RoutePanel ────────────────────────────────────────
export function RoutePanel() {
  const {
    showDirections, setShowDirections,
    selectedService, routes, selectedRoute, setSelectedRoute,
    startNavigation, exitNavigation,
    isLoadingRoute, routeError,
  } = useApp();

  if (!showDirections || !selectedService) return null;

  const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${selectedService.coordinates.lat},${selectedService.coordinates.lng}&travelmode=driving`;

  const Content = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Header ── */}
      <div style={{
        padding: '16px 18px 14px',
        borderBottom: '1px solid #e2e8f0',
        background: 'white',
        flexShrink: 0,
      }}>
        {/* Destination */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
            background: 'rgba(37,99,235,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
          }}>
            {CAT_EMOJIS[selectedService.category] ?? '📍'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '14px', fontWeight: 800, color: '#0f172a',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {selectedService.name}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              {CATEGORY_LABELS[selectedService.category]}
              {selectedService.distance !== undefined && (
                <span style={{ marginLeft: '6px', color: '#94a3b8' }}>
                  · {formatDistance(selectedService.distance)} straight line
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => { setShowDirections(false); exitNavigation(); }}
            style={{
              width: '30px', height: '30px', borderRadius: '8px',
              border: 'none', background: '#f1f5f9',
              cursor: 'pointer', fontSize: '16px', color: '#64748b',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
            aria-label="Close directions"
          >×</button>
        </div>

        {/* From → To visual */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '8px 12px', background: '#f8fafc', borderRadius: '10px',
          border: '1px solid #e2e8f0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb', flexShrink: 0 }} />
            <span style={{ fontSize: '11.5px', color: '#475569', fontWeight: 600 }}>Your location</span>
          </div>
          <div style={{ color: '#cbd5e1', fontSize: '12px' }}>→</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, justifyContent: 'flex-end' }}>
            <span style={{ fontSize: '11.5px', color: '#475569', fontWeight: 600, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedService.name}
            </span>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#dc2626', flexShrink: 0 }} />
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px' }}>

        {/* Loading */}
        {isLoadingRoute && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px',
              animation: 'pulse 1.5s ease-in-out infinite',
              fontSize: '24px',
            }}>🗺️</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
              Calculating route…
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              Finding the fastest road path
            </div>
          </div>
        )}

        {/* Error */}
        {!isLoadingRoute && routeError && (
          <div>
            <div style={{
              padding: '16px', borderRadius: '14px',
              background: '#fef2f2', border: '1px solid rgba(220,38,38,0.2)',
              textAlign: 'center', marginBottom: '14px',
            }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>⚠️</div>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#dc2626', marginBottom: '4px' }}>
                Route unavailable
              </p>
              <p style={{ fontSize: '11.5px', color: '#64748b' }}>{routeError}</p>
            </div>
            {/* Always show Google Maps fallback on error */}
            <a href={gmapsUrl} target="_blank" rel="noopener noreferrer" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '12px', background: '#4285F4', color: 'white',
              borderRadius: '12px', fontWeight: 700, fontSize: '13px', textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(66,133,244,0.3)',
            }}>
              🗺️ Open in Google Maps instead
            </a>
          </div>
        )}

        {/* Routes found */}
        {!isLoadingRoute && !routeError && routes.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Mismatch warning */}
            {(() => {
              const slKm = selectedService.distance ?? 0;
              const rdKm = (selectedRoute ?? routes[0])?.distance ?? 0;
              if (slKm > 0 && rdKm / slKm > 3 && rdKm > 1) {
                return (
                  <div style={{
                    padding: '12px 14px', borderRadius: '12px',
                    background: '#fffbeb', border: '1px solid rgba(245,158,11,0.35)',
                  }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <span style={{ fontSize: '16px' }}>⚠️</span>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#92400e', marginBottom: '2px' }}>
                          Road route is much longer than expected
                        </div>
                        <div style={{ fontSize: '11px', color: '#b45309', lineHeight: 1.5 }}>
                          Straight line: <strong>{formatDistance(slKm)}</strong> — Road: <strong>{rdKm.toFixed(1)} km</strong>.
                          Local roads may not be fully mapped in OpenStreetMap.
                        </div>
                      </div>
                    </div>
                    <a href={gmapsUrl} target="_blank" rel="noopener noreferrer" style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      padding: '9px', background: '#4285F4', color: 'white', borderRadius: '9px',
                      fontSize: '12px', fontWeight: 700, textDecoration: 'none',
                      boxShadow: '0 2px 8px rgba(66,133,244,0.25)',
                    }}>
                      🗺️ Try Google Maps for better routing
                    </a>
                  </div>
                );
              }
              return null;
            })()}

            {/* Route selector (only if multiple routes) */}
            {routes.length > 1 && (
              <div>
                <div style={{
                  fontSize: '11px', fontWeight: 700, color: '#94a3b8',
                  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px',
                }}>
                  {routes.length} routes found
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {routes.map((route, idx) => (
                    <RouteCard
                      key={route.id}
                      route={route}
                      index={idx}
                      selected={selectedRoute?.id === route.id}
                      onSelect={() => setSelectedRoute(route)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* If only one route, show compact summary */}
            {routes.length === 1 && (
              <div style={{
                display: 'flex', gap: '0', alignItems: 'stretch',
                background: 'linear-gradient(135deg, #eff6ff, #f8faff)',
                borderRadius: '16px', border: '1.5px solid rgba(37,99,235,0.18)',
                overflow: 'hidden',
              }}>
                <div style={{
                  background: '#2563eb', width: '6px', flexShrink: 0, borderRadius: '0',
                }} />
                <div style={{ display: 'flex', gap: '0', flex: 1, padding: '14px 16px' }}>
                  <div style={{ flex: 1, textAlign: 'center', borderRight: '1px solid rgba(37,99,235,0.15)' }}>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: '#1e3a8a' }}>
                      {routes[0].distance.toFixed(1)}
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#3b82f6', marginLeft: '2px' }}>km</span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#60a5fa', fontWeight: 500 }}>by road</div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center', borderRight: '1px solid rgba(37,99,235,0.15)', padding: '0 10px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: '#1e3a8a' }}>
                      {routes[0].duration}
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#3b82f6', marginLeft: '2px' }}>min</span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#60a5fa', fontWeight: 500 }}>drive time</div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center', paddingLeft: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <div style={{
                        width: '7px', height: '7px', borderRadius: '50%',
                        background: TRAFFIC_COLOR[routes[0].traffic] ?? '#94a3b8',
                      }} />
                      <span style={{ fontSize: '11px', fontWeight: 700, color: TRAFFIC_COLOR[routes[0].traffic] }}>
                        {TRAFFIC_LABEL[routes[0].traffic]}
                      </span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#60a5fa', marginTop: '4px', fontWeight: 500 }}>
                      Arrive ~{routes[0].arrivalTime}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Turn-by-turn steps */}
            {selectedRoute && <StepsList route={selectedRoute} />}
            {!selectedRoute && routes[0] && <StepsList route={routes[0]} />}

            {/* Google Maps link always available at the bottom */}
            <a href={gmapsUrl} target="_blank" rel="noopener noreferrer" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              padding: '10px', background: 'white', color: '#4285F4',
              border: '1.5px solid rgba(66,133,244,0.3)',
              borderRadius: '10px', fontSize: '12px', fontWeight: 700,
              textDecoration: 'none', transition: 'all 0.15s',
            }}>
              🗺️ Also open in Google Maps
            </a>
          </div>
        )}
      </div>

      {/* ── Start Navigation Button ── */}
      {!isLoadingRoute && !routeError && routes.length > 0 && (
        <div style={{
          padding: '14px 18px', borderTop: '1px solid #e2e8f0',
          background: 'white', flexShrink: 0,
        }}>
          <button
            onClick={startNavigation}
            style={{
              width: '100%', padding: '15px',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: 'white', border: 'none', borderRadius: '14px',
              fontSize: '14px', fontWeight: 800, cursor: 'pointer',
              boxShadow: '0 6px 24px rgba(37,99,235,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'transform 0.15s, box-shadow 0.15s',
              letterSpacing: '0.02em',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 10px 32px rgba(37,99,235,0.4)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'none';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 24px rgba(37,99,235,0.35)';
            }}
          >
            🧭 Start Step-by-Step Navigation
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop panel */}
      <div
        id="route-panel-desktop"
        className="anim-slide-in-right"
        style={{
          display: 'none',
          position: 'fixed', top: '56px', right: 0,
          width: '400px', height: 'calc(100vh - 56px)',
          background: 'white',
          borderLeft: '1px solid #e2e8f0',
          zIndex: 20,
          boxShadow: '-8px 0 40px rgba(0,0,0,0.08)',
          flexDirection: 'column',
        }}
      >
        <Content />
      </div>

      {/* Mobile bottom sheet */}
      <div id="route-panel-mobile" style={{ display: 'none' }}>
        <div className="esl-backdrop" onClick={() => { setShowDirections(false); exitNavigation(); }} />
        <div className="esl-bottom-sheet">
          <div className="esl-sheet-handle" />
          <div style={{ maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <Content />
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          #route-panel-desktop { display: flex !important; }
          #route-panel-mobile  { display: none !important; }
        }
        @media (max-width: 767px) {
          #route-panel-desktop { display: none !important; }
          #route-panel-mobile  { display: block !important; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.06); opacity: 0.85; }
        }
      `}</style>
    </>
  );
}
