'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { useApp } from '@/context/AppContext';
import { CATEGORY_COLORS, DEFAULT_LOCATION, MAP_CONFIG } from '@/lib/constants';
import { formatDistance, formatTravelTime } from '@/lib/utils';
import { EmergencyService } from '@/lib/types';
import 'leaflet/dist/leaflet.css';

const CAT_EMOJIS: Record<string, string> = {
  hospital: '🏥', police: '🚔', fire: '🚒', ambulance: '🚑',
  pharmacy: '💊', petrol: '⛽', ev_charging: '⚡', government: '🏛️',
};

// ── Icons ──────────────────────────────────────────────────
function makeServiceIcon(category: string, isNearest: boolean): L.DivIcon {
  const color = CATEGORY_COLORS[category] || '#6B7280';
  const emoji = CAT_EMOJIS[category] || '📍';
  const size = isNearest ? 44 : 38;
  const nearestDot = isNearest
    ? `<div style="position:absolute;top:-5px;right:-5px;width:12px;height:12px;background:#dc2626;border:2px solid white;border-radius:50%;"></div>`
    : '';

  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 6)],
    html: `
      <div class="esl-service-pin ${isNearest ? 'is-nearest' : ''}"
        style="width:${size}px;height:${size}px;background:${color};position:relative;">
        <span style="font-size:${size * 0.44}px;line-height:1;display:flex;align-items:center;justify-content:center;width:100%;height:100%;">${emoji}</span>
        ${nearestDot}
      </div>`,
  });
}

function makeUserIcon(): L.DivIcon {
  return L.divIcon({
    className: '',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    html: `<div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;">
      <div class="esl-user-ring"></div>
      <div class="esl-user-dot" style="position:relative;width:18px;height:18px;z-index:2;"></div>
    </div>`,
  });
}

// ── Map re-center ──────────────────────────────────────────
function Recenter({ center }: { center: [number, number] }) {
  const map = useMap();
  const prev = useRef(center);
  useEffect(() => {
    if (center[0] !== prev.current[0] || center[1] !== prev.current[1]) {
      map.flyTo(center, map.getZoom(), { duration: 1.2 });
      prev.current = center;
    }
  }, [center, map]);
  return null;
}

// ── Popup content ──────────────────────────────────────────
function PopupContent({
  service,
  onDetails,
  onDirections,
}: {
  service: EmergencyService;
  onDetails: () => void;
  onDirections: () => void;
}) {
  const color = CATEGORY_COLORS[service.category] || '#6B7280';
  const emoji = CAT_EMOJIS[service.category] || '📍';

  return (
    <div style={{ padding: '14px 16px', minWidth: '240px' }}>
      {/* Service header */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
        <div style={{
          width: '38px', height: '38px', flexShrink: 0,
          borderRadius: '10px', background: `${color}14`,
          border: `1px solid ${color}28`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
        }}>{emoji}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {service.name}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>
            {service.category.replace('_', ' ')}
          </div>
        </div>
      </div>

      {/* Meta row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '8px 10px', borderRadius: '9px', background: '#f8fafc',
        marginBottom: '10px', fontSize: '11.5px',
      }}>
        <span style={{ fontWeight: 700, color: '#0f172a' }}>
          {service.distance !== undefined ? formatDistance(service.distance) : '—'}
        </span>
        <span style={{ color: '#cbd5e1' }}>·</span>
        <span style={{ color: '#475569' }}>
          {service.travelTime !== undefined ? formatTravelTime(service.travelTime) : '—'}
        </span>
        <span style={{ color: '#cbd5e1' }}>·</span>
        <span style={{ color: '#f59e0b' }}>★ {service.rating.toFixed(1)}</span>
        <span style={{ marginLeft: 'auto', color: service.isOpen ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
          {service.is24Hours ? '24h' : service.isOpen ? 'Open' : 'Closed'}
        </span>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          onClick={onDirections}
          style={{
            flex: 1, padding: '8px',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            color: 'white', border: 'none', borderRadius: '9px',
            fontSize: '11.5px', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
          }}
        >🗺️ Directions</button>
        <button
          onClick={onDetails}
          style={{
            flex: 1, padding: '8px',
            background: '#f1f5f9', color: '#475569',
            border: '1px solid #e2e8f0', borderRadius: '9px',
            fontSize: '11.5px', fontWeight: 600, cursor: 'pointer',
          }}
        >Details</button>
      </div>
    </div>
  );
}

// ── Main Map ───────────────────────────────────────────────
export function MapView() {
  const {
    userLocation, searchLocation, nearestService,
    getFilteredServices, setSelectedService, setShowDetails,
    requestDirections, selectedRoute,
  } = useApp();

  const services = getFilteredServices();
  const loc = searchLocation || userLocation || DEFAULT_LOCATION;
  const center: [number, number] = [loc.lat, loc.lng];
  const userIcon = useMemo(() => makeUserIcon(), []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <MapContainer
        center={center}
        zoom={MAP_CONFIG.defaultZoom}
        minZoom={MAP_CONFIG.minZoom}
        maxZoom={MAP_CONFIG.maxZoom}
        zoomControl={true}
        style={{ width: '100%', height: '100%' }}
      >
        <Recenter center={center} />

        <TileLayer url={MAP_CONFIG.tileUrl} attribution={MAP_CONFIG.tileAttribution} />

        {/* User marker */}
        <Marker position={center} icon={userIcon}>
          <Popup>
            <div style={{ padding: '12px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '4px' }}>📍</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Your Location</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}
              </div>
            </div>
          </Popup>
        </Marker>

        {/* Service markers */}
        {services.map(service => {
          const isNearest = nearestService?.id === service.id;
          const icon = makeServiceIcon(service.category, isNearest);
          return (
            <Marker key={service.id} position={[service.coordinates.lat, service.coordinates.lng]} icon={icon}>
              <Popup>
                <PopupContent
                  service={service}
                  onDetails={() => { setSelectedService(service); setShowDetails(true); }}
                  onDirections={() => requestDirections(service)}
                />
              </Popup>
            </Marker>
          );
        })}

        {/* Route polylines */}
        {selectedRoute && (
          <Polyline
            positions={selectedRoute.polyline.map(p => [p.lat, p.lng] as [number, number])}
            pathOptions={{
              color: '#2563EB',
              weight: 5,
              opacity: 0.85,
              lineJoin: 'round',
              lineCap: 'round',
            }}
          />
        )}
      </MapContainer>

      {/* Count badge */}
      <div style={{
        position: 'absolute', bottom: '24px', left: '16px', zIndex: 10,
        background: 'white', border: '1px solid var(--c-border)',
        borderRadius: '10px', padding: '6px 12px',
        boxShadow: 'var(--shadow-md)',
        fontSize: '12px', fontWeight: 600, color: 'var(--c-text-2)',
        display: 'flex', alignItems: 'center', gap: '6px',
      }}>
        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--c-primary)', display: 'inline-block' }} />
        {services.length} service{services.length !== 1 ? 's' : ''} nearby
      </div>
    </div>
  );
}
