'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { AppProvider } from '@/context/AppContext';
import { Navbar } from '@/components/layout/Navbar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { LeftPanel } from '@/components/panel/LeftPanel';
import { ServiceDetails } from '@/components/details/ServiceDetails';
import { RoutePanel } from '@/components/directions/RoutePanel';
import { NavigationPanel } from '@/components/directions/NavigationPanel';
import { BottomSheet } from '@/components/mobile/BottomSheet';

// Subcomponents for mobile sheets
import { useApp } from '@/context/AppContext';
import { FILTER_CATEGORIES, RADIUS_OPTIONS, CATEGORY_LABELS, CATEGORY_COLORS } from '@/lib/constants';
import { formatDistance, formatTravelTime } from '@/lib/utils';
import { ServiceCategory } from '@/lib/types';

// Leaflet is client-side only
const MapView = dynamic(
  () => import('@/components/map/MapView').then(m => m.MapView),
  {
    ssr: false,
    loading: () => (
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#f1f5f9',
        flexDirection: 'column', gap: '12px',
      }}>
        <div style={{ fontSize: '40px' }}>🗺️</div>
        <div style={{ fontSize: '14px', color: 'var(--c-text-2)', fontWeight: 500 }}>
          Loading map…
        </div>
      </div>
    ),
  }
);

function LocatorContent() {
  const [mobileTab, setMobileTab] = useState('map');
  const [mobileSheet, setMobileSheet] = useState<string | null>(null);

  const handleTabChange = (tab: string) => {
    setMobileTab(tab);
    if (tab === 'search' || tab === 'services') {
      setMobileSheet(tab);
    } else {
      setMobileSheet(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Navbar />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left panel — desktop */}
        <LeftPanel />

        {/* Map area */}
        <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <MapView />
          <NavigationPanel />
        </main>
      </div>

      {/* Overlays */}
      <ServiceDetails />
      <RoutePanel />

      {/* Mobile bottom nav */}
      <MobileBottomNav activeTab={mobileTab} onTabChange={handleTabChange} />

      {/* Mobile sheets */}
      <BottomSheet isOpen={mobileSheet === 'search'} onClose={() => setMobileSheet(null)} title="Search & Filter">
        <MobileSearchPanel />
      </BottomSheet>

      <BottomSheet isOpen={mobileSheet === 'services'} onClose={() => setMobileSheet(null)} title="Nearby Services">
        <MobileServiceList />
      </BottomSheet>
    </div>
  );
}

// ── Mobile search/filter panel ─────────────────────────────
function MobileSearchPanel() {
  const { searchQuery, setSearchQuery, selectedCategories, toggleCategory, selectedRadius, setSelectedRadius } = useApp();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '8px' }}>
      <div>
        <input
          type="text" placeholder="Search location…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            width: '100%', height: '44px',
            padding: '0 14px',
            border: '1.5px solid var(--c-border)',
            borderRadius: '12px', fontSize: '14px',
            background: 'var(--c-surface-2)', outline: 'none',
          }}
        />
      </div>
      <div>
        <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--c-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
          Radius
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {RADIUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSelectedRadius(opt.value)}
              style={{
                padding: '8px 14px', fontSize: '13px', fontWeight: 500,
                borderRadius: '99px',
                border: `1.5px solid ${selectedRadius === opt.value ? 'var(--c-primary)' : 'var(--c-border)'}`,
                background: selectedRadius === opt.value ? 'var(--c-primary)' : 'white',
                color: selectedRadius === opt.value ? 'white' : 'var(--c-text-2)',
                cursor: 'pointer',
              }}
            >{opt.label}</button>
          ))}
        </div>
      </div>
      <div>
        <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--c-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
          Category
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {FILTER_CATEGORIES.map(cat => {
            const active = cat.id === 'all' ? selectedCategories.includes('all') : selectedCategories.includes(cat.id as ServiceCategory);
            return (
              <button
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                style={{
                  padding: '7px 12px', fontSize: '12px', fontWeight: 500,
                  borderRadius: '99px',
                  border: `1.5px solid ${active ? cat.color : 'var(--c-border)'}`,
                  background: active ? `${cat.color}14` : 'white',
                  color: active ? cat.color : 'var(--c-text-2)',
                  cursor: 'pointer',
                }}
              >{cat.label}</button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Mobile service list ─────────────────────────────────────
function MobileServiceList() {
  const { getFilteredServices, setSelectedService, setShowDetails, requestDirections, nearestService, isLoadingServices, fetchError, refetchServices } = useApp();
  const services = getFilteredServices();

  if (isLoadingServices) {
    return (
      <div style={{ paddingTop: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ fontSize: '14px', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--c-text-2)' }}>Loading real services nearby…</span>
        </div>
        {[1,2,3].map(i => (
          <div key={i} className="skeleton" style={{ height: '76px', borderRadius: '14px', marginBottom: '10px' }} />
        ))}
      </div>
    );
  }

  if (fetchError) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <div style={{ fontSize: '32px', marginBottom: '10px' }}>⚠️</div>
        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--c-danger)', marginBottom: '8px' }}>Failed to load services</p>
        <p style={{ fontSize: '12px', color: 'var(--c-text-3)', marginBottom: '16px' }}>{fetchError}</p>
        <button onClick={refetchServices} style={{ padding: '10px 24px', background: 'var(--c-primary)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
          🔄 Retry
        </button>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0' }}>
        <div style={{ fontSize: '36px', marginBottom: '10px' }}>🔍</div>
        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--c-text-2)' }}>No services found</p>
        <p style={{ fontSize: '13px', color: 'var(--c-text-3)', marginTop: '4px' }}>Expand radius or change filters</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '8px' }}>
      {services.map(service => {
        const color = CATEGORY_COLORS[service.category] || '#6B7280';
        const isNearest = nearestService?.id === service.id;
        const EMOJIS: Record<string, string> = {
          hospital: '🏥', police: '🚔', fire: '🚒', ambulance: '🚑',
          pharmacy: '💊', petrol: '⛽', ev_charging: '⚡', government: '🏛️',
        };
        return (
          <div
            key={service.id}
            onClick={() => { setSelectedService(service); setShowDetails(true); }}
            style={{
              padding: '14px',
              borderRadius: '14px',
              border: `1.5px solid ${isNearest ? 'rgba(37,99,235,0.25)' : 'var(--c-border)'}`,
              background: 'white', cursor: 'pointer',
              display: 'flex', gap: '12px',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div style={{
              width: '44px', height: '44px', flexShrink: 0, fontSize: '22px',
              borderRadius: '11px', background: `${color}14`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{EMOJIS[service.category] || '📍'}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--c-text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{service.name}</div>
              <div style={{ fontSize: '11.5px', color: 'var(--c-text-3)', marginBottom: '5px' }}>{CATEGORY_LABELS[service.category]}</div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 700 }}>{formatDistance(service.distance ?? 0)}</span>
                <span style={{ color: 'var(--c-text-4)' }}>·</span>
                <span style={{ fontSize: '12px', color: 'var(--c-text-2)' }}>{formatTravelTime(service.travelTime ?? 0)}</span>
                <button
                  onClick={e => { e.stopPropagation(); requestDirections(service); }}
                  style={{
                    marginLeft: 'auto', padding: '4px 12px',
                    background: 'var(--c-primary)', color: 'white',
                    border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                  }}
                >Go</button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────
export default function LocatorPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'white',
        flexDirection: 'column', gap: '14px',
      }}>
        <div style={{ fontSize: '48px' }}>🚨</div>
        <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--c-text-1)' }}>Emergency Service Locator</div>
        <div style={{ fontSize: '13px', color: 'var(--c-text-3)' }}>Loading…</div>
      </div>
    );
  }

  return (
    <AppProvider>
      <LocatorContent />
    </AppProvider>
  );
}
