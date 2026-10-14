'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';

// ── Nominatim result type ──────────────────────────────────
interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  class: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
}

// ── Debounce hook ──────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Location type icon ─────────────────────────────────────
function placeIcon(type: string, cls: string): string {
  if (cls === 'amenity') {
    if (type === 'hospital') return '🏥';
    if (type === 'police') return '🚔';
    if (type === 'fire_station') return '🚒';
    if (type === 'pharmacy') return '💊';
  }
  if (cls === 'place') return '📍';
  if (cls === 'highway') return '🛣️';
  if (cls === 'boundary' || cls === 'administrative') return '🗺️';
  if (cls === 'railway') return '🚉';
  if (cls === 'aeroway') return '✈️';
  return '📌';
}

// ── Short display label from Nominatim result ──────────────
function shortLabel(result: NominatimResult): string {
  const parts = result.display_name.split(', ');
  // Return first 2-3 meaningful parts
  return parts.slice(0, 3).join(', ');
}

function subLabel(result: NominatimResult): string {
  const parts = result.display_name.split(', ');
  return parts.slice(3).join(', ') || result.address?.country || '';
}

// ── Main LocationSearchBar ─────────────────────────────────
export function LocationSearchBar() {
  const { setSearchLocation, setUserLocation } = useApp();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const [locState, setLocState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const debouncedQuery = useDebounce(query, 350);

  // ── Geocode query via Nominatim ────────────────────────
  const geocode = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    // Cancel previous request
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setIsLoading(true);
    try {
      const url = new URL('https://nominatim.openstreetmap.org/search');
      url.searchParams.set('q', q);
      url.searchParams.set('format', 'json');
      url.searchParams.set('addressdetails', '1');
      url.searchParams.set('limit', '7');
      url.searchParams.set('accept-language', 'en');

      const res = await fetch(url.toString(), {
        signal: abortRef.current.signal,
        headers: { 'User-Agent': 'EmergencyServiceLocatorApp/1.0' },
      });

      if (!res.ok) throw new Error('Nominatim error');
      const data: NominatimResult[] = await res.json();
      setResults(data);
      setIsOpen(data.length > 0);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Trigger geocode when debounced query changes
  useEffect(() => {
    if (!selectedLabel || query !== selectedLabel) {
      geocode(debouncedQuery);
    }
  }, [debouncedQuery, geocode, selectedLabel, query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Select a result ─────────────────────────────────────
  const selectResult = (result: NominatimResult) => {
    const coords = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
    const label = shortLabel(result);
    setQuery(label);
    setSelectedLabel(label);
    setSearchLocation(coords);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  // ── Clear search ────────────────────────────────────────
  const clearSearch = () => {
    setQuery('');
    setSelectedLabel('');
    setResults([]);
    setIsOpen(false);
    setSearchLocation(null);
    inputRef.current?.focus();
  };

  // ── GPS location button ─────────────────────────────────
  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleGPS = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation not supported by your browser', 'error');
      return;
    }
    setLocState('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocState('success');
        // Clear the search box so user sees GPS is active
        setQuery('');
        setSelectedLabel('');
        setSearchLocation(null);
        showToast('📍 Location found — finding services near you!', 'success');
        setTimeout(() => setLocState('idle'), 3000);
      },
      (err) => {
        setLocState('error');
        const msg =
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied. Allow access in browser settings.'
            : err.code === err.TIMEOUT
            ? 'Location request timed out. Try again.'
            : 'Unable to get your location.';
        showToast('⚠️ ' + msg, 'error');
        setTimeout(() => setLocState('idle'), 3000);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const locIcon = locState === 'loading' ? '⏳' : locState === 'success' ? '✅' : locState === 'error' ? '❌' : '📡';

  return (
    <>
      <header style={{
        height: '56px',
        background: 'white',
        borderBottom: '1px solid var(--c-border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 14px',
        gap: '10px',
        flexShrink: 0,
        zIndex: 30,
        position: 'relative',
      }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <div style={{
            width: '32px', height: '32px',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            borderRadius: '9px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px',
            boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
          }}>📍</div>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em' }}
            className="hidden-mobile">
            Emergency Locator
          </span>
        </div>

        {/* ── Location Search Input ── */}
        <div style={{ flex: 1, maxWidth: '480px', position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            {/* Search icon */}
            <span style={{
              position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)',
              pointerEvents: 'none', fontSize: '13px',
              color: isLoading ? '#2563eb' : '#94a3b8',
              transition: 'color 0.2s',
            }}>
              {isLoading ? '⏳' : '🔍'}
            </span>

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setSelectedLabel(''); }}
              onFocus={() => { if (results.length > 0) setIsOpen(true); }}
              onKeyDown={e => {
                if (e.key === 'Escape') { setIsOpen(false); inputRef.current?.blur(); }
                if (e.key === 'Enter' && results.length > 0) selectResult(results[0]);
              }}
              placeholder="Search any location, city, address…"
              autoComplete="off"
              spellCheck={false}
              style={{
                width: '100%',
                height: '38px',
                padding: '0 36px 0 34px',
                background: '#f8fafc',
                border: '1.5px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '13px',
                color: '#0f172a',
                outline: 'none',
                transition: 'all 0.18s',
              }}
              onFocusCapture={e => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.borderColor = '#2563eb';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)';
              }}
              onBlurCapture={e => {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />

            {/* Clear button */}
            {query && (
              <button
                onClick={clearSearch}
                style={{
                  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '14px', color: '#94a3b8', padding: '0', lineHeight: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '18px', height: '18px', borderRadius: '50%',
                }}
                title="Clear search"
              >✕</button>
            )}
          </div>

          {/* ── Dropdown results ── */}
          {isOpen && (
            <div
              ref={dropdownRef}
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                right: 0,
                background: 'white',
                borderRadius: '14px',
                boxShadow: '0 16px 48px rgba(0,0,0,0.14), 0 4px 16px rgba(0,0,0,0.06)',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                zIndex: 9999,
                maxHeight: '360px',
                overflowY: 'auto',
              }}
            >
              {/* Header */}
              <div style={{
                padding: '8px 14px 6px',
                fontSize: '10px', fontWeight: 700, color: '#94a3b8',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                borderBottom: '1px solid #f1f5f9',
                background: '#f8fafc',
              }}>
                {results.length} location{results.length !== 1 ? 's' : ''} found
              </div>

              {results.map((result, i) => (
                <button
                  key={result.place_id}
                  onMouseDown={e => { e.preventDefault(); selectResult(result); }}
                  style={{
                    width: '100%', textAlign: 'left',
                    padding: '11px 14px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    borderBottom: i < results.length - 1 ? '1px solid #f1f5f9' : 'none',
                    display: 'flex', alignItems: 'flex-start', gap: '10px',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  {/* Icon */}
                  <div style={{
                    width: '34px', height: '34px', flexShrink: 0,
                    borderRadius: '9px',
                    background: 'rgba(37,99,235,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px', marginTop: '1px',
                  }}>
                    {placeIcon(result.type, result.class)}
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '13px', fontWeight: 600, color: '#0f172a',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      marginBottom: '2px',
                    }}>
                      {shortLabel(result)}
                    </div>
                    <div style={{
                      fontSize: '11px', color: '#94a3b8',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {subLabel(result)}
                    </div>
                  </div>

                  {/* Arrow */}
                  <span style={{ color: '#cbd5e1', fontSize: '14px', flexShrink: 0, marginTop: '6px' }}>›</span>
                </button>
              ))}

              {/* Powered by */}
              <div style={{
                padding: '6px 14px',
                fontSize: '9.5px', color: '#cbd5e1', textAlign: 'right',
                background: '#f8fafc', borderTop: '1px solid #f1f5f9',
              }}>
                Powered by OpenStreetMap Nominatim
              </div>
            </div>
          )}
        </div>

        <div style={{ flex: 1 }} />

        {/* GPS button */}
        <button
          onClick={handleGPS}
          disabled={locState === 'loading'}
          title="Use my current GPS location"
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '0 12px', height: '36px',
            borderRadius: '10px',
            border: `1.5px solid ${
              locState === 'success' ? 'rgba(22,163,74,0.4)' :
              locState === 'error'   ? 'rgba(220,38,38,0.4)' :
              '#e2e8f0'
            }`,
            background:
              locState === 'success' ? '#f0fdf4' :
              locState === 'error'   ? '#fef2f2' : 'white',
            cursor: locState === 'loading' ? 'not-allowed' : 'pointer',
            fontWeight: 600, flexShrink: 0,
            color:
              locState === 'success' ? '#16a34a' :
              locState === 'error'   ? '#dc2626' : '#475569',
            transition: 'all 0.2s',
          }}
        >
          <span style={{
            fontSize: '14px',
            animation: locState === 'loading' ? 'spin 1s linear infinite' : 'none',
            display: 'inline-block',
          }}>{locIcon}</span>
          <span style={{ fontSize: '12px' }} className="hidden-mobile">
            {locState === 'loading' ? 'Getting…' :
             locState === 'success' ? 'Located!' :
             locState === 'error'   ? 'Failed' : 'My Location'}
          </span>
        </button>

        {/* Notification bell */}
        <button
          style={{
            width: '36px', height: '36px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '10px', border: 'none',
            background: 'transparent', cursor: 'pointer', fontSize: '18px', position: 'relative',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          title="Notifications"
        >
          🔔
          <span style={{
            position: 'absolute', top: '6px', right: '6px',
            width: '7px', height: '7px',
            background: '#dc2626', borderRadius: '50%',
            border: '1.5px solid white',
          }} />
        </button>

        {/* Avatar */}
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontSize: '12px', fontWeight: 700,
          boxShadow: '0 2px 8px rgba(37,99,235,0.2)',
          cursor: 'pointer', flexShrink: 0,
        }}>U</div>
      </header>

      {/* Toast */}
      {toast && (
        <div
          className="anim-fade-in-down"
          style={{
            position: 'fixed', top: '64px', left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999, padding: '10px 20px',
            borderRadius: '12px',
            background: toast.type === 'success' ? '#0f172a' : '#7f1d1d',
            color: 'white', fontSize: '13px', fontWeight: 500,
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            whiteSpace: 'nowrap', maxWidth: '90vw', textAlign: 'center',
          }}
        >
          {toast.msg}
        </div>
      )}
    </>
  );
}

// Export as Navbar for backward compatibility
export { LocationSearchBar as Navbar };
