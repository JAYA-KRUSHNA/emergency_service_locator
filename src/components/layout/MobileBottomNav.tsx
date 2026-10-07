'use client';

import React from 'react';

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TABS = [
  { id: 'map',      emoji: '🗺️', label: 'Map' },
  { id: 'search',   emoji: '🔍', label: 'Search' },
  { id: 'services', emoji: '📋', label: 'Services' },
  { id: 'profile',  emoji: '👤', label: 'Profile' },
];

export function MobileBottomNav({ activeTab, onTabChange }: MobileBottomNavProps) {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'white',
      borderTop: '1px solid var(--c-border)',
      display: 'flex',
      zIndex: 40,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }} className="md-hidden">
      {TABS.map(tab => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            aria-label={tab.label}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: '3px', height: '56px', border: 'none',
              background: 'transparent', cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: '20px', lineHeight: 1 }}>{tab.emoji}</span>
            <span style={{
              fontSize: '10px', fontWeight: active ? 700 : 500,
              color: active ? 'var(--c-primary)' : 'var(--c-text-3)',
              transition: 'color 0.15s',
            }}>{tab.label}</span>
            {active && (
              <div style={{
                position: 'absolute', bottom: 0,
                width: '20px', height: '2px',
                background: 'var(--c-primary)',
                borderRadius: '1px 1px 0 0',
              }} />
            )}
          </button>
        );
      })}
    </nav>
  );
}
