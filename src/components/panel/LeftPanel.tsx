'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { FILTER_CATEGORIES, RADIUS_OPTIONS, CATEGORY_LABELS, CATEGORY_COLORS } from '@/lib/constants';
import { formatDistance, formatTravelTime } from '@/lib/utils';
import { ServiceCategory } from '@/lib/types';

// ── Search Bar ─────────────────────────────────────────────
function SearchBar() {
  const { searchQuery, setSearchQuery, setUserLocation } = useApp();
  const [focused, setFocused] = useState(false);
  const [locState, setLocState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [locMsg, setLocMsg] = useState('');

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocState('error');
      setLocMsg('Geolocation not supported');
      return;
    }
    setLocState('loading');
    setLocMsg('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocState('success');
        setLocMsg('Location found! Services updated around you.');
        setTimeout(() => { setLocState('idle'); setLocMsg(''); }, 4000);
      },
      (err) => {
        setLocState('error');
        setLocMsg(
          err.code === err.PERMISSION_DENIED
            ? 'Permission denied — allow location in browser settings.'
            : err.code === err.TIMEOUT
            ? 'Timed out — please try again.'
            : 'Unable to get location.'
        );
        setTimeout(() => { setLocState('idle'); setLocMsg(''); }, 4000);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const locEmoji = locState === 'loading' ? '⏳' : locState === 'success' ? '✅' : locState === 'error' ? '❌' : '📡';
  const locLabel = locState === 'loading' ? 'Getting your location…' : locState === 'success' ? 'Location set!' : locState === 'error' ? 'Location failed' : 'Use My Current Location';

  return (
    <div style={{ padding: '16px 16px 0' }}>
      {/* Search input */}
      <div style={{ position: 'relative', marginBottom: '8px' }}>
        <span style={{
          position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
          color: focused ? 'var(--c-primary)' : 'var(--c-text-3)',
          pointerEvents: 'none', transition: 'color 0.15s', fontSize: '15px',
        }}>🔍</span>
        <input
          type="text"
          placeholder="Search services (hospital, police…)"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-label="Search emergency services"
          style={{
            width: '100%', height: '42px',
            padding: '0 36px 0 38px',
            background: focused ? 'white' : 'var(--c-surface-2)',
            border: `1.5px solid ${focused ? 'var(--c-primary)' : 'var(--c-border)'}`,
            borderRadius: '12px',
            fontSize: '13.5px',
            color: 'var(--c-text-1)',
            outline: 'none',
            boxShadow: focused ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none',
            transition: 'all 0.15s',
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{
              position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
              background: 'var(--c-surface-3)', border: 'none', borderRadius: '50%',
              width: '20px', height: '20px', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: 'var(--c-text-3)',
              fontSize: '12px',
            }}
            aria-label="Clear search"
          >×</button>
        )}
      </div>

      {/* Location button */}
      <button
        onClick={handleCurrentLocation}
        disabled={locState === 'loading'}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
          padding: '9px 12px',
          background: locState === 'success' ? 'var(--c-success-50)'
            : locState === 'error' ? 'var(--c-danger-50)'
            : 'var(--c-primary-50)',
          border: `1px solid ${
            locState === 'success' ? 'rgba(22,163,74,0.25)'
            : locState === 'error' ? 'rgba(220,38,38,0.25)'
            : 'rgba(37,99,235,0.15)'
          }`,
          borderRadius: '10px',
          cursor: locState === 'loading' ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
        }}
      >
        <span style={{
          fontSize: '15px',
          animation: locState === 'loading' ? 'spin 1s linear infinite' : 'none',
          display: 'inline-block',
        }}>{locEmoji}</span>
        <span style={{
          fontSize: '12.5px', fontWeight: 600,
          color: locState === 'success' ? 'var(--c-success)'
            : locState === 'error' ? 'var(--c-danger)'
            : 'var(--c-primary)',
        }}>{locLabel}</span>
      </button>

      {/* Status message */}
      {locMsg && (
        <div
          className="anim-fade-in"
          style={{
            marginTop: '6px',
            padding: '8px 12px',
            borderRadius: '8px',
            background: locState === 'success' ? 'var(--c-success-50)' : 'var(--c-danger-50)',
            border: `1px solid ${
              locState === 'success' ? 'rgba(22,163,74,0.2)' : 'rgba(220,38,38,0.2)'
            }`,
            fontSize: '11.5px',
            color: locState === 'success' ? 'var(--c-success)' : 'var(--c-danger)',
            lineHeight: 1.4,
          }}
        >{locMsg}</div>
      )}
    </div>
  );
}

// ── Radius Selector ────────────────────────────────────────
function RadiusSelector() {
  const { selectedRadius, setSelectedRadius } = useApp();
  const [customMode, setCustomMode] = useState(false);
  const [customVal, setCustomVal] = useState('');
  const isCustom = !RADIUS_OPTIONS.find(r => r.value === selectedRadius);

  return (
    <div style={{ padding: '0 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--c-text-2)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Search Radius
        </span>
        <span style={{
          fontSize: '11px', fontWeight: 600,
          color: 'var(--c-primary)',
          background: 'var(--c-primary-50)',
          padding: '2px 8px',
          borderRadius: '99px',
        }}>
          {selectedRadius >= 1000 ? `${selectedRadius / 1000} km` : `${selectedRadius} m`}
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {RADIUS_OPTIONS.map(opt => {
          const active = selectedRadius === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => { setSelectedRadius(opt.value); setCustomMode(false); }}
              style={{
                padding: '6px 12px',
                fontSize: '12px', fontWeight: 500,
                borderRadius: '99px',
                border: `1.5px solid ${active ? 'var(--c-primary)' : 'var(--c-border)'}`,
                background: active ? 'var(--c-primary)' : 'white',
                color: active ? 'white' : 'var(--c-text-2)',
                cursor: 'pointer',
                transition: 'all 0.15s',
                boxShadow: active ? '0 2px 8px rgba(37,99,235,0.25)' : 'none',
              }}
            >{opt.label}</button>
          );
        })}
        <button
          onClick={() => setCustomMode(!customMode)}
          style={{
            padding: '6px 12px', fontSize: '12px', fontWeight: 500,
            borderRadius: '99px',
            border: `1.5px solid ${isCustom ? 'var(--c-primary)' : 'var(--c-border)'}`,
            background: isCustom ? 'var(--c-primary)' : 'white',
            color: isCustom ? 'white' : 'var(--c-text-2)',
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          {isCustom ? `${(selectedRadius / 1000).toFixed(1)} km` : 'Custom'}
        </button>
      </div>
      {customMode && (
        <div className="anim-fade-in" style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
          <input
            type="number" placeholder="km (e.g. 3)"
            value={customVal}
            onChange={e => setCustomVal(e.target.value)}
            min="0.1" max="50" step="0.1"
            style={{
              flex: 1, height: '34px', padding: '0 10px',
              background: 'var(--c-surface-2)',
              border: '1.5px solid var(--c-border)',
              borderRadius: '8px', fontSize: '13px',
              outline: 'none', color: 'var(--c-text-1)',
            }}
          />
          <button
            onClick={() => {
              const v = parseFloat(customVal);
              if (v > 0 && v <= 50) { setSelectedRadius(v * 1000); setCustomMode(false); }
            }}
            style={{
              padding: '0 14px', height: '34px',
              background: 'var(--c-primary)', color: 'white',
              border: 'none', borderRadius: '8px',
              fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            }}
          >Apply</button>
        </div>
      )}
    </div>
  );
}

// ── Filter Panel ───────────────────────────────────────────
const CAT_EMOJIS: Record<string, string> = {
  all: '🏙️', hospital: '🏥', police: '🚔', fire: '🚒',
  ambulance: '🚑', pharmacy: '💊', petrol: '⛽', ev_charging: '⚡', government: '🏛️',
};

function FilterPanel() {
  const { selectedCategories, toggleCategory } = useApp();

  return (
    <div style={{ padding: '0 16px' }}>
      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--c-text-2)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: '8px' }}>
        Service Type
      </span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {FILTER_CATEGORIES.map(cat => {
          const active = cat.id === 'all'
            ? selectedCategories.includes('all')
            : selectedCategories.includes(cat.id as ServiceCategory);
          return (
            <button
              key={cat.id}
              onClick={() => toggleCategory(cat.id)}
              aria-pressed={active}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '6px 10px',
                fontSize: '11.5px', fontWeight: 500,
                borderRadius: '99px',
                border: `1.5px solid ${active ? cat.color : 'var(--c-border)'}`,
                background: active ? `${cat.color}14` : 'white',
                color: active ? cat.color : 'var(--c-text-2)',
                cursor: 'pointer',
                transition: 'all 0.15s',
                boxShadow: active ? `0 2px 8px ${cat.color}28` : 'none',
              }}
            >
              <span style={{ fontSize: '13px' }}>{CAT_EMOJIS[cat.id]}</span>
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Nearest Service ────────────────────────────────────────
function NearestService() {
  const { nearestService, setSelectedService, setShowDetails, requestDirections, startNavigation } = useApp();
  if (!nearestService) return null;
  const color = CATEGORY_COLORS[nearestService.category] || '#6B7280';
  const emoji = CAT_EMOJIS[nearestService.category] || '📍';

  return (
    <div style={{
      margin: '0 16px',
      padding: '14px',
      borderRadius: '14px',
      border: '1.5px solid rgba(37,99,235,0.2)',
      background: 'linear-gradient(135deg, rgba(37,99,235,0.04) 0%, white 100%)',
      boxShadow: '0 2px 12px rgba(37,99,235,0.08)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--c-primary)', animation: 'pulseRing 2s ease-out infinite' }} />
        <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--c-primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Nearest Service
        </span>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
        {/* Icon */}
        <div style={{
          width: '44px', height: '44px', flexShrink: 0,
          borderRadius: '12px',
          background: `${color}16`,
          border: `1px solid ${color}28`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '22px',
        }}>{emoji}</div>

        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--c-text-1)', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {nearestService.name}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--c-text-3)', marginBottom: '6px' }}>
            {CATEGORY_LABELS[nearestService.category]}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--c-text-1)' }}>
              {nearestService.distance !== undefined ? formatDistance(nearestService.distance) : '—'}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--c-text-3)' }}>
              {nearestService.travelTime !== undefined ? formatTravelTime(nearestService.travelTime) : '—'}
            </span>
            <span style={{ fontSize: '11px', color: '#f59e0b' }}>
              ★ {nearestService.rating.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
        <ActionBtn
          label="Details" emoji="ℹ️" variant="ghost"
          onClick={() => { setSelectedService(nearestService); setShowDetails(true); }}
        />
        <ActionBtn
          label="Directions" emoji="🗺️" variant="secondary"
          onClick={() => requestDirections(nearestService)}
        />
        <ActionBtn
          label="Navigate" emoji="🧭" variant="primary"
          onClick={() => { requestDirections(nearestService); setTimeout(() => startNavigation(), 600); }}
        />
      </div>
    </div>
  );
}

function ActionBtn({ label, emoji, variant, onClick }: { label: string; emoji: string; variant: 'primary' | 'secondary' | 'ghost'; onClick: () => void }) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: 'var(--c-primary)', color: 'white', border: 'none', boxShadow: '0 2px 8px rgba(37,99,235,0.28)' },
    secondary: { background: 'var(--c-surface-2)', color: 'var(--c-text-1)', border: '1px solid var(--c-border)' },
    ghost: { background: 'transparent', color: 'var(--c-text-2)', border: '1px solid var(--c-border)' },
  };
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
        padding: '7px 4px',
        borderRadius: '10px',
        cursor: 'pointer',
        fontSize: '10px', fontWeight: 600,
        transition: 'all 0.15s',
        ...styles[variant],
      }}
    >
      <span style={{ fontSize: '14px' }}>{emoji}</span>
      {label}
    </button>
  );
}

// ── Service List ────────────────────────────────────────────
function ServiceList() {
  const {
    getFilteredServices, nearestService,
    setSelectedService, setShowDetails, requestDirections,
    isLoadingServices, isUsingFallback, refetchServices,
  } = useApp();
  const services = getFilteredServices();
  const [sortBy, setSortBy] = useState<'nearest' | 'fastest' | 'rated'>('nearest');

  const sorted = [...services].sort((a, b) => {
    if (sortBy === 'nearest') return (a.distance ?? 99) - (b.distance ?? 99);
    if (sortBy === 'fastest') return (a.travelTime ?? 99) - (b.travelTime ?? 99);
    return b.rating - a.rating;
  });

  // ── Loading state ────────────────────────────────────────
  if (isLoadingServices) {
    return (
      <div style={{ padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ fontSize: '14px', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--c-text-2)' }}>Loading real services…</span>
        </div>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ marginBottom: '8px' }}>
            <div className="skeleton" style={{ height: '88px', borderRadius: '12px' }} />
          </div>
        ))}
      </div>
    );
  }



  return (
    <div style={{ padding: '0 16px' }}>
      {/* Fallback banner */}
      {isUsingFallback && (
        <div style={{
          marginBottom: '10px',
          padding: '8px 12px',
          borderRadius: '10px',
          background: '#fffbeb',
          border: '1px solid rgba(245,158,11,0.3)',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <span style={{ fontSize: '14px' }}>📡</span>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#92400e' }}>Estimated data — live search unavailable</div>
            <div style={{ fontSize: '10.5px', color: '#b45309' }}>Positions are approximate. <button onClick={refetchServices} style={{ background: 'none', border: 'none', color: 'var(--c-primary)', fontWeight: 700, cursor: 'pointer', fontSize: '10.5px', padding: 0 }}>Retry live search →</button></div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: 'var(--c-text-3)' }}>
            {services.length} service{services.length !== 1 ? 's' : ''}
          </span>
          <span style={{
            fontSize: '9px', fontWeight: 700,
            color: isUsingFallback ? '#92400e' : '#16a34a',
            background: isUsingFallback ? '#fffbeb' : '#f0fdf4',
            padding: '1px 6px', borderRadius: '99px',
            border: `1px solid ${isUsingFallback ? 'rgba(245,158,11,0.3)' : 'rgba(22,163,74,0.2)'}`,
          }}>{isUsingFallback ? 'ESTIMATED' : 'LIVE'}</span>
        </div>
        <div style={{ display: 'flex', gap: '2px' }}>
          {(['nearest', 'fastest', 'rated'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              style={{
                padding: '3px 8px', fontSize: '10.5px', fontWeight: 500,
                borderRadius: '6px', border: 'none', cursor: 'pointer',
                background: sortBy === s ? 'var(--c-primary-50)' : 'transparent',
                color: sortBy === s ? 'var(--c-primary)' : 'var(--c-text-3)',
                transition: 'all 0.12s',
                textTransform: 'capitalize',
              }}
            >{s === 'rated' ? 'Top Rated' : s.charAt(0).toUpperCase() + s.slice(1)}</button>
          ))}
        </div>
      </div>

      {/* List */}
      {sorted.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 16px' }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔍</div>
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--c-text-2)', marginBottom: '4px' }}>No services found</p>
          <p style={{ fontSize: '12px', color: 'var(--c-text-3)' }}>Try expanding the radius or changing filters</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {sorted.map(service => {
            const isNearest = nearestService?.id === service.id;
            const color = CATEGORY_COLORS[service.category] || '#6B7280';
            const emoji = CAT_EMOJIS[service.category] || '📍';

            return (
              <div
                key={service.id}
                onClick={() => { setSelectedService(service); setShowDetails(true); }}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  border: `1.5px solid ${isNearest ? 'rgba(37,99,235,0.25)' : 'var(--c-border)'}`,
                  background: isNearest ? 'rgba(37,99,235,0.02)' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  boxShadow: isNearest ? '0 2px 10px rgba(37,99,235,0.08)' : 'none',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
                  el.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.boxShadow = isNearest ? '0 2px 10px rgba(37,99,235,0.08)' : 'none';
                  el.style.transform = 'none';
                }}
                role="button" tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && setShowDetails(true)}
                aria-label={`${service.name}, ${CATEGORY_LABELS[service.category]}`}
              >
                <div style={{ display: 'flex', gap: '10px' }}>
                  {/* Icon */}
                  <div style={{
                    width: '40px', height: '40px', flexShrink: 0,
                    borderRadius: '10px',
                    background: `${color}14`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '20px',
                    border: `1px solid ${color}22`,
                  }}>{emoji}</div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '4px' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--c-text-1)' }}>{service.name}</span>
                      </div>
                      {isNearest && (
                        <span style={{
                          flexShrink: 0, fontSize: '9px', fontWeight: 800,
                          color: 'var(--c-primary)', background: 'var(--c-primary-50)',
                          padding: '2px 6px', borderRadius: '99px', letterSpacing: '0.05em',
                        }}>NEAREST</span>
                      )}
                    </div>
                    <span style={{ fontSize: '10.5px', color: 'var(--c-text-3)' }}>{CATEGORY_LABELS[service.category]}</span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--c-text-1)' }}>
                        {service.distance !== undefined ? formatDistance(service.distance) : '—'}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--c-text-3)' }}>·</span>
                      <span style={{ fontSize: '11px', color: 'var(--c-text-2)' }}>
                        {service.travelTime !== undefined ? formatTravelTime(service.travelTime) : '—'}
                      </span>
                      <span style={{ fontSize: '11px', color: '#f59e0b' }}>★ {service.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                {/* Status & actions row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--c-border-2)' }}>
                  <span style={{
                    fontSize: '10.5px', fontWeight: 600,
                    color: service.isOpen ? 'var(--c-success)' : 'var(--c-danger)',
                    background: service.isOpen ? 'var(--c-success-50)' : 'var(--c-danger-50)',
                    padding: '2px 8px', borderRadius: '99px',
                  }}>
                    {service.is24Hours ? 'Open 24h' : service.isOpen ? 'Open' : 'Closed'}
                  </span>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button
                      onClick={e => { e.stopPropagation(); requestDirections(service); }}
                      style={{
                        padding: '4px 10px', fontSize: '11px', fontWeight: 600,
                        background: 'var(--c-primary)', color: 'white',
                        border: 'none', borderRadius: '7px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '4px',
                      }}
                    >🗺️ Go</button>
                    <button
                      onClick={e => { e.stopPropagation(); setSelectedService(service); setShowDetails(true); }}
                      style={{
                        padding: '4px 10px', fontSize: '11px', fontWeight: 600,
                        background: 'var(--c-surface-2)', color: 'var(--c-text-2)',
                        border: '1px solid var(--c-border)', borderRadius: '7px', cursor: 'pointer',
                      }}
                    >Details</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Left Panel ─────────────────────────────────────────────
export function LeftPanel() {
  return (
    <aside style={{
      width: '360px',
      flexShrink: 0,
      height: '100%',
      background: 'white',
      borderRight: '1px solid var(--c-border)',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      paddingBottom: '24px',
    }} className="hidden-mobile">
      <div style={{ paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <SearchBar />
        <Divider />
        <RadiusSelector />
        <Divider />
        <FilterPanel />
        <Divider />
        <NearestService />
        <Divider />
        <ServiceList />
      </div>
    </aside>
  );
}

function Divider() {
  return <div style={{ height: '1px', background: 'var(--c-border-2)', margin: '0 16px' }} />;
}
