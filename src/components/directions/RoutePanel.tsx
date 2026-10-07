'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { RouteInfo } from '@/lib/types';
import { CATEGORY_LABELS } from '@/lib/constants';
import { fmtDist, fmtDuration } from '@/lib/osrmRouting';

const CAT_EMOJIS: Record<string, string> = {
  hospital: '🏥', police: '🚔', fire: '🚒', ambulance: '🚑',
  pharmacy: '💊', petrol: '⛽', ev_charging: '⚡', government: '🏛️',
};

const TRAFFIC_COLOR: Record<string, string> = {
  light: '#16a34a',
  moderate: '#d97706',
  heavy: '#dc2626',
};
const TRAFFIC_LABEL: Record<string, string> = {
  light: 'Light traffic',
  moderate: 'Moderate traffic',
  heavy: 'Heavy traffic',
};

// ── Route card ─────────────────────────────────────────────
function RouteCard({
  route,
  selected,
  onSelect,
}: {
  route: RouteInfo;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      style={{
        padding: '14px',
        borderRadius: '14px',
        border: `2px solid ${selected ? 'var(--c-primary)' : 'var(--c-border)'}`,
        background: selected ? 'rgba(37,99,235,0.03)' : 'white',
        cursor: 'pointer',
        transition: 'all 0.15s',
        boxShadow: selected ? '0 4px 16px rgba(37,99,235,0.12)' : 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {route.isRecommended && <span style={{ fontSize: '13px' }}>✅</span>}
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--c-text-1)' }}>{route.label}</span>
        </div>
        {route.isRecommended && (
          <span style={{
            fontSize: '9px', fontWeight: 800, letterSpacing: '0.06em',
            color: 'var(--c-primary)', background: 'var(--c-primary-50)',
            padding: '2px 8px', borderRadius: '99px',
          }}>RECOMMENDED</span>
        )}
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--c-text-1)', lineHeight: 1 }}>
            {route.distance.toFixed(1)} km
          </div>
          <div style={{ fontSize: '10px', color: 'var(--c-text-3)', marginTop: '2px' }}>Distance</div>
        </div>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--c-text-1)', lineHeight: 1 }}>
            {route.duration} min
          </div>
          <div style={{ fontSize: '10px', color: 'var(--c-text-3)', marginTop: '2px' }}>Duration</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: TRAFFIC_COLOR[route.traffic] ?? '#94a3b8', flexShrink: 0,
            }} />
            <span style={{ fontSize: '11px', fontWeight: 600, color: TRAFFIC_COLOR[route.traffic] }}>
              {TRAFFIC_LABEL[route.traffic]}
            </span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--c-text-3)', marginTop: '2px' }}>
            Arrive ~{route.arrivalTime}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Steps list ─────────────────────────────────────────────
function StepsList({ route }: { route: RouteInfo }) {
  const steps = route.steps ?? [];
  if (steps.length === 0) return null;

  return (
    <div style={{ marginTop: '4px' }}>
      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--c-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
        Turn-by-Turn Directions
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
        {steps.map((step, i) => (
          <div
            key={i}
            style={{
              display: 'flex', gap: '10px', alignItems: 'flex-start',
              padding: '9px 10px',
              borderRadius: '10px',
              background: i === 0 ? 'var(--c-primary-50)' : i % 2 === 0 ? 'var(--c-surface-2)' : 'white',
              border: i === 0 ? '1px solid rgba(37,99,235,0.15)' : '1px solid transparent',
            }}
          >
            {/* Step number / icon */}
            <div style={{
              width: '28px', height: '28px', flexShrink: 0,
              borderRadius: '8px',
              background: i === 0 ? 'var(--c-primary)' : 'var(--c-surface-3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: i === 0 ? '14px' : '13px',
              color: i === 0 ? 'white' : 'var(--c-text-2)',
              fontWeight: 700,
            }}>
              {step.icon || (i === steps.length - 1 ? '🏁' : i + 1)}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '12.5px', fontWeight: 600,
                color: i === 0 ? 'var(--c-primary)' : 'var(--c-text-1)',
                lineHeight: 1.3, marginBottom: '2px',
              }}>
                {step.instruction}
              </div>
              {step.distance > 5 && (
                <div style={{ fontSize: '11px', color: 'var(--c-text-3)' }}>
                  {fmtDist(step.distance)} · {fmtDuration(step.duration)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
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

  const Content = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '18px 20px 14px',
        borderBottom: '1px solid var(--c-border)',
        background: 'linear-gradient(135deg, rgba(37,99,235,0.03), white)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--c-text-1)', marginBottom: '4px' }}>
              Directions
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '16px' }}>
                {CAT_EMOJIS[selectedService.category] || '📍'}
              </span>
              <div>
                <div style={{ fontSize: '13px', color: 'var(--c-text-1)', fontWeight: 600, lineHeight: 1.2 }}>
                  {selectedService.name}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--c-text-3)' }}>
                  {CATEGORY_LABELS[selectedService.category]}
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={() => { setShowDirections(false); exitNavigation(); }}
            style={{
              width: '30px', height: '30px', borderRadius: '8px',
              border: 'none', background: 'var(--c-surface-2)',
              cursor: 'pointer', fontSize: '16px', color: 'var(--c-text-3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
            aria-label="Close"
          >×</button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

        {/* Loading state */}
        {isLoadingRoute && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px', animation: 'spin 1.5s linear infinite', display: 'inline-block' }}>🗺️</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--c-text-2)' }}>Fetching real directions…</div>
            <div style={{ fontSize: '12px', color: 'var(--c-text-3)', marginTop: '4px' }}>Calculating route via road network</div>
          </div>
        )}

        {/* Error state */}
        {!isLoadingRoute && routeError && (
          <div style={{
            padding: '16px', borderRadius: '14px',
            background: 'var(--c-danger-50)',
            border: '1px solid rgba(220,38,38,0.2)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>⚠️</div>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--c-danger)', marginBottom: '4px' }}>
              Directions unavailable
            </p>
            <p style={{ fontSize: '11.5px', color: 'var(--c-text-3)' }}>{routeError}</p>
          </div>
        )}

        {/* Routes */}
        {!isLoadingRoute && !routeError && routes.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Route cards */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--c-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                {routes.length > 1 ? `${routes.length} Routes Found` : 'Route Found'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {routes.map(route => (
                  <RouteCard
                    key={route.id}
                    route={route}
                    selected={selectedRoute?.id === route.id}
                    onSelect={() => setSelectedRoute(route)}
                  />
                ))}
              </div>
            </div>

            {/* Turn-by-turn steps for selected route */}
            {selectedRoute && <StepsList route={selectedRoute} />}
          </div>
        )}
      </div>

      {/* Start navigation button */}
      {!isLoadingRoute && !routeError && routes.length > 0 && (
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--c-border)', flexShrink: 0 }}>
          <button
            onClick={startNavigation}
            style={{
              width: '100%', padding: '14px',
              background: 'linear-gradient(135deg, var(--c-primary), #1d4ed8)',
              color: 'white', border: 'none', borderRadius: '14px',
              fontSize: '14px', fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(37,99,235,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 10px 28px rgba(37,99,235,0.36)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'none';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(37,99,235,0.3)';
            }}
          >
            🧭 Start Navigation
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <div
        id="route-panel-desktop"
        className="anim-slide-in-right"
        style={{
          display: 'none',
          position: 'fixed', top: '56px', right: 0,
          width: '420px', height: 'calc(100vh - 56px)',
          background: 'white',
          borderLeft: '1px solid var(--c-border)',
          zIndex: 20,
          boxShadow: '-8px 0 32px rgba(0,0,0,0.06)',
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
          <div style={{ maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
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
      `}</style>
    </>
  );
}
