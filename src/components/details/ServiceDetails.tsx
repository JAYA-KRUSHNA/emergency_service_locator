'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '@/lib/constants';
import { formatDistance, formatTravelTime } from '@/lib/utils';

const CAT_EMOJIS: Record<string, string> = {
  all: '🏙️', hospital: '🏥', police: '🚔', fire: '🚒',
  ambulance: '🚑', pharmacy: '💊', petrol: '⛽', ev_charging: '⚡', government: '🏛️',
};

export function ServiceDetails() {
  const { selectedService, showDetails, setShowDetails, requestDirections, startNavigation } = useApp();
  if (!showDetails || !selectedService) return null;

  const color = CATEGORY_COLORS[selectedService.category] || '#6B7280';
  const emoji = CAT_EMOJIS[selectedService.category] || '📍';

  const PanelContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: '1px solid var(--c-border)',
        background: 'white',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: 0 }}>
            <div style={{
              width: '52px', height: '52px', flexShrink: 0,
              borderRadius: '14px',
              background: `${color}14`,
              border: `1.5px solid ${color}28`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '26px',
            }}>{emoji}</div>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--c-text-1)', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedService.name}
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--c-text-3)' }}>
                {CATEGORY_LABELS[selectedService.category]}
              </span>
              <div style={{ marginTop: '5px' }}>
                <span style={{
                  fontSize: '11px', fontWeight: 600, padding: '2px 9px', borderRadius: '99px',
                  background: selectedService.isOpen ? 'var(--c-success-50)' : 'var(--c-danger-50)',
                  color: selectedService.isOpen ? 'var(--c-success)' : 'var(--c-danger)',
                }}>
                  {selectedService.is24Hours ? '🟢 Open 24 hours' : selectedService.isOpen ? '🟢 Open' : '🔴 Closed'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowDetails(false)}
            aria-label="Close"
            style={{
              width: '30px', height: '30px', flexShrink: 0,
              borderRadius: '8px', border: 'none',
              background: 'var(--c-surface-2)', color: 'var(--c-text-3)',
              cursor: 'pointer', fontSize: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.12s',
            }}
          >×</button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          <StatCard label="Distance" value={selectedService.distance !== undefined ? formatDistance(selectedService.distance) : '—'} emoji="📏" />
          <StatCard label="Travel Time" value={selectedService.travelTime !== undefined ? formatTravelTime(selectedService.travelTime) : '—'} emoji="⏱️" />
          <StatCard label="Rating" value={`★ ${selectedService.rating.toFixed(1)} (${selectedService.reviewCount.toLocaleString()})`} emoji="⭐" />
          <StatCard label="Status" value={selectedService.is24Hours ? '24 Hours' : 'See hours'} emoji="🕐" />
        </div>

        {/* Address */}
        <InfoRow emoji="📍" label="Address" value={selectedService.address} />

        {/* Phone */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--c-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
            📞 Phone
          </div>
          <a href={`tel:${selectedService.phone}`} style={{ fontSize: '14px', fontWeight: 600, color: 'var(--c-primary)', textDecoration: 'none' }}>
            {selectedService.phone}
          </a>
        </div>

        {/* Hours */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--c-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
            🕐 Operating Hours
          </div>
          {selectedService.operatingHours.map((h, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: 'var(--c-text-2)', padding: '3px 0' }}>
              <span>{h.day}</span>
              <span style={{ fontWeight: 600, color: 'var(--c-text-1)' }}>{h.is24Hours ? 'Open 24 hours' : `${h.open} – ${h.close}`}</span>
            </div>
          ))}
        </div>

        {/* Services */}
        {selectedService.services.length > 0 && (
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--c-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
              ✅ Available Services
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {selectedService.services.map(svc => (
                <span key={svc} style={{
                  padding: '4px 10px', fontSize: '11.5px', fontWeight: 500,
                  background: 'var(--c-surface-2)',
                  border: '1px solid var(--c-border)',
                  borderRadius: '99px',
                  color: 'var(--c-text-2)',
                }}>{svc}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid var(--c-border)',
        background: 'white',
        display: 'flex', flexDirection: 'column', gap: '8px',
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <PanelBtn
            label="📞 Call"
            variant="outline"
            onClick={() => window.open(`tel:${selectedService.phone}`)}
          />
          <PanelBtn
            label="🗺️ Google Maps"
            variant="outline"
            onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedService.coordinates.lat},${selectedService.coordinates.lng}`, '_blank')}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <PanelBtn
            label="Get Directions"
            variant="secondary"
            onClick={() => { requestDirections(selectedService); setShowDetails(false); }}
          />
          <PanelBtn
            label="🧭 Start Navigation"
            variant="primary"
            onClick={() => { requestDirections(selectedService); setShowDetails(false); setTimeout(() => startNavigation(), 600); }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop side panel */}
      <div
        className="anim-slide-in-right"
        style={{
          display: 'none',
          position: 'fixed',
          top: '56px', right: 0,
          width: '400px',
          height: 'calc(100vh - 56px)',
          background: 'white',
          borderLeft: '1px solid var(--c-border)',
          zIndex: 20,
          boxShadow: '-8px 0 32px rgba(0,0,0,0.06)',
          flexDirection: 'column',
        }}
        id="service-details-desktop"
      >
        <PanelContent />
      </div>
      <style>{`
        @media (min-width: 768px) {
          #service-details-desktop { display: flex !important; }
          #service-details-mobile { display: none !important; }
        }
        @media (max-width: 767px) {
          #service-details-desktop { display: none !important; }
          #service-details-mobile { display: block !important; }
        }
      `}</style>

      {/* Mobile bottom sheet */}
      <div id="service-details-mobile" style={{ display: 'none' }}>
        <div className="esl-backdrop" onClick={() => setShowDetails(false)} />
        <div className="esl-bottom-sheet">
          <div className="esl-sheet-handle" />
          <div style={{ maxHeight: '70vh', overflow: 'hidden' }}>
            <PanelContent />
          </div>
        </div>
      </div>
    </>
  );
}

function StatCard({ label, value, emoji }: { label: string; value: string; emoji: string }) {
  return (
    <div style={{
      padding: '12px',
      borderRadius: '12px',
      background: 'var(--c-surface-2)',
      border: '1px solid var(--c-border)',
    }}>
      <div style={{ fontSize: '18px', marginBottom: '4px' }}>{emoji}</div>
      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--c-text-1)', marginBottom: '1px' }}>{value}</div>
      <div style={{ fontSize: '10px', color: 'var(--c-text-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
    </div>
  );
}

function InfoRow({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--c-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
        {emoji} {label}
      </div>
      <div style={{ fontSize: '13px', color: 'var(--c-text-1)', lineHeight: 1.5 }}>{value}</div>
    </div>
  );
}

function PanelBtn({ label, variant, onClick }: { label: string; variant: 'primary' | 'secondary' | 'outline'; onClick: () => void }) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: 'linear-gradient(135deg, var(--c-primary), #1d4ed8)', color: 'white', border: 'none', boxShadow: '0 4px 14px rgba(37,99,235,0.3)' },
    secondary: { background: 'var(--c-surface-2)', color: 'var(--c-text-1)', border: '1px solid var(--c-border)' },
    outline: { background: 'white', color: 'var(--c-text-2)', border: '1px solid var(--c-border)' },
  };
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: '10px 8px',
        fontSize: '12.5px', fontWeight: 600,
        borderRadius: '10px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        ...styles[variant],
      }}
    >{label}</button>
  );
}
