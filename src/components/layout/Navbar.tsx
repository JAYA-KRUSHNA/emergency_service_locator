'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';

export function Navbar() {
  const { setUserLocation } = useApp();
  const [searchValue, setSearchValue] = useState('');
  const [locState, setLocState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLocationClick = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'error');
      return;
    }
    setLocState('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocState('success');
        showToast('📍 Location found — services updated around you!', 'success');
        setTimeout(() => setLocState('idle'), 3000);
      },
      (err) => {
        setLocState('error');
        const msg =
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied. Please allow access in your browser.'
            : err.code === err.TIMEOUT
            ? 'Location request timed out. Try again.'
            : 'Unable to get your location.';
        showToast('⚠️ ' + msg, 'error');
        setTimeout(() => setLocState('idle'), 3000);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const locIcon =
    locState === 'loading'
      ? '⏳'
      : locState === 'success'
      ? '✅'
      : locState === 'error'
      ? '❌'
      : '📡';

  return (
    <>
      <header style={{
        height: '56px',
        background: 'white',
        borderBottom: '1px solid var(--c-border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: '12px',
        flexShrink: 0,
        zIndex: 30,
        position: 'relative',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div style={{
            width: '32px', height: '32px',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            borderRadius: '9px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px',
            boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
          }}>📍</div>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--c-text-1)', letterSpacing: '-0.01em' }}>
            Emergency Locator
          </span>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '2px 8px',
            background: 'var(--c-success-50)',
            border: '1px solid rgba(22,163,74,0.2)',
            borderRadius: '99px',
          }}>
            <div style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: 'var(--c-success)',
            }} />
            <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--c-success)' }}>LIVE</span>
          </div>
        </div>

        {/* Search */}
        <div style={{ flex: 1, maxWidth: '360px', display: 'flex' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <span style={{
              position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
              pointerEvents: 'none', fontSize: '14px',
            }}>🔍</span>
            <input
              type="text"
              placeholder="Search services..."
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              style={{
                width: '100%', height: '36px',
                padding: '0 12px 0 36px',
                background: 'var(--c-surface-2)',
                border: '1px solid var(--c-border)',
                borderRadius: '10px',
                fontSize: '13px', color: 'var(--c-text-1)',
                outline: 'none',
              }}
              onFocus={e => {
                e.target.style.borderColor = '#2563eb';
                e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)';
                e.target.style.background = 'white';
              }}
              onBlur={e => {
                e.target.style.borderColor = 'var(--c-border)';
                e.target.style.boxShadow = 'none';
                e.target.style.background = 'var(--c-surface-2)';
              }}
            />
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Current location button */}
          <button
            onClick={handleLocationClick}
            disabled={locState === 'loading'}
            title="Use my current location"
            aria-label="Use my current location"
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '0 12px',
              height: '34px',
              borderRadius: '10px',
              border: `1.5px solid ${
                locState === 'success' ? 'rgba(22,163,74,0.4)' :
                locState === 'error' ? 'rgba(220,38,38,0.4)' :
                'var(--c-border)'
              }`,
              background: locState === 'success' ? 'var(--c-success-50)' :
                          locState === 'error' ? 'var(--c-danger-50)' : 'white',
              cursor: locState === 'loading' ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              color: locState === 'success' ? 'var(--c-success)' :
                     locState === 'error' ? 'var(--c-danger)' : 'var(--c-text-2)',
              transition: 'all 0.2s',
              flexShrink: 0,
            }}
          >
            <span style={{
              fontSize: '14px',
              display: 'inline-block',
              animation: locState === 'loading' ? 'spin 1s linear infinite' : 'none',
            }}>{locIcon}</span>
            <span style={{ display: 'none' }} className="show-md">
              {locState === 'loading' ? 'Getting location…' :
               locState === 'success' ? 'Location set!' :
               locState === 'error' ? 'Failed' : 'My Location'}
            </span>
          </button>

          {/* Notifications */}
          <button
            style={{
              width: '36px', height: '36px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '10px', border: 'none',
              background: 'transparent',
              cursor: 'pointer', fontSize: '18px', position: 'relative',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'var(--c-surface-2)'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}
            title="Notifications"
          >
            🔔
            <span style={{
              position: 'absolute', top: '6px', right: '6px',
              width: '7px', height: '7px',
              background: 'var(--c-danger)', borderRadius: '50%',
              border: '1.5px solid white',
            }} />
          </button>

          {/* Avatar */}
          <div style={{
            width: '32px', height: '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: '12px', fontWeight: 700,
            boxShadow: 'var(--shadow-sm)',
            cursor: 'pointer', flexShrink: 0, marginLeft: '4px',
          }}>U</div>
        </div>
      </header>

      {/* Toast notification */}
      {toast && (
        <div
          className="anim-fade-in-down"
          style={{
            position: 'fixed',
            top: '64px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            padding: '10px 20px',
            borderRadius: '12px',
            background: toast.type === 'success' ? '#0f172a' : '#7f1d1d',
            color: 'white',
            fontSize: '13px',
            fontWeight: 500,
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            whiteSpace: 'nowrap',
            maxWidth: '90vw',
            textAlign: 'center',
          }}
        >
          {toast.msg}
        </div>
      )}
    </>
  );
}
