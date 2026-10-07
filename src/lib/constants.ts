// ============================================================
// Emergency Service Locator — Constants
// ============================================================

import { RadiusOption, FilterCategory } from './types';

// ── Radius Options ──────────────────────────────────────────
export const RADIUS_OPTIONS: RadiusOption[] = [
  { label: '1 km', value: 1000 },
  { label: '2 km', value: 2000 },
  { label: '5 km', value: 5000 },
  { label: '10 km', value: 10000 },
  { label: '20 km', value: 20000 },
];

export const DEFAULT_RADIUS = 15000; // 15km default — shows all mock services

// ── Filter Categories ───────────────────────────────────────
export const FILTER_CATEGORIES: FilterCategory[] = [
  { id: 'all', label: 'All', icon: 'LayoutGrid', color: '#2563EB' },
  { id: 'hospital', label: 'Hospitals', icon: 'Hospital', color: '#DC2626' },
  { id: 'police', label: 'Police Stations', icon: 'Shield', color: '#1D4ED8' },
  { id: 'fire', label: 'Fire Stations', icon: 'Flame', color: '#EA580C' },
  { id: 'ambulance', label: 'Ambulance', icon: 'Siren', color: '#DC2626' },
  { id: 'pharmacy', label: 'Pharmacies', icon: 'Pill', color: '#16A34A' },
  { id: 'petrol', label: 'Petrol Stations', icon: 'Fuel', color: '#854D0E' },
  { id: 'ev_charging', label: 'EV Charging', icon: 'Zap', color: '#7C3AED' },
  { id: 'government', label: 'Government', icon: 'Landmark', color: '#0F766E' },
];

// ── Category Labels Map ─────────────────────────────────────
export const CATEGORY_LABELS: Record<string, string> = {
  all: 'All Services',
  hospital: 'Hospital',
  police: 'Police Station',
  fire: 'Fire Station',
  ambulance: 'Ambulance Service',
  pharmacy: 'Pharmacy',
  petrol: 'Petrol Station',
  ev_charging: 'EV Charging Station',
  government: 'Government Emergency Service',
};

// ── Category Colors ─────────────────────────────────────────
export const CATEGORY_COLORS: Record<string, string> = {
  hospital: '#DC2626',
  police: '#1D4ED8',
  fire: '#EA580C',
  ambulance: '#DC2626',
  pharmacy: '#16A34A',
  petrol: '#854D0E',
  ev_charging: '#7C3AED',
  government: '#0F766E',
};

// ── Default Coordinates (New Delhi, India) ──────────────────
export const DEFAULT_LOCATION = {
  lat: 28.6139,
  lng: 77.209,
};

// ── Map Config ──────────────────────────────────────────────
export const MAP_CONFIG = {
  defaultZoom: 14,
  minZoom: 3,
  maxZoom: 19,
  tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  tileAttribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
};
