/**
 * OSRM (Open Source Routing Machine) routing integration.
 * Free, no API key required. Uses the public demo server.
 * Provides real road geometry, distance, duration, and turn-by-turn steps.
 */

import { Coordinates, RouteInfo, TrafficCondition } from './types';

// ── OSRM mirrors ───────────────────────────────────────────
const OSRM_BASE = 'https://router.project-osrm.org';

// ── Types from OSRM response ───────────────────────────────
interface OsrmManeuver {
  type: string;        // 'turn', 'depart', 'arrive', 'merge', 'ramp', etc.
  modifier?: string;   // 'left', 'right', 'straight', 'slight left', etc.
  bearing_after?: number;
}

interface OsrmStep {
  distance: number;          // meters
  duration: number;          // seconds
  name: string;              // road name
  maneuver: OsrmManeuver;
  mode: string;
}

interface OsrmLeg {
  distance: number;
  duration: number;
  steps: OsrmStep[];
}

interface OsrmRoute {
  distance: number;           // meters
  duration: number;           // seconds
  geometry: {
    type: 'LineString';
    coordinates: [number, number][]; // [lng, lat]
  };
  legs: OsrmLeg[];
}

interface OsrmResponse {
  code: string;
  routes: OsrmRoute[];
}

// ── Direction step (our format) ────────────────────────────
export interface DirectionStep {
  instruction: string;
  distance: number;           // meters
  duration: number;           // seconds
  icon: string;               // emoji icon
  roadName: string;
}

// ── Parsed route result ────────────────────────────────────
export interface RealRoute extends RouteInfo {
  steps: DirectionStep[];
}

// ── Maneuver → human text + emoji ─────────────────────────
function humanInstruction(step: OsrmStep): { text: string; icon: string } {
  const { type, modifier } = step.maneuver;
  const road = step.name ? `onto ${step.name}` : '';

  const modText: Record<string, string> = {
    left: 'Turn left',
    right: 'Turn right',
    'slight left': 'Slight left',
    'slight right': 'Slight right',
    'sharp left': 'Sharp left turn',
    'sharp right': 'Sharp right turn',
    straight: 'Continue straight',
    uturn: 'Make a U-turn',
  };

  const modIcon: Record<string, string> = {
    left: '↰',
    right: '↱',
    'slight left': '↖',
    'slight right': '↗',
    'sharp left': '↩',
    'sharp right': '↪',
    straight: '↑',
    uturn: '↩',
  };

  switch (type) {
    case 'depart':
      return { text: `Head ${road || 'out'}`, icon: '🚀' };
    case 'arrive':
      return { text: 'You have arrived at your destination', icon: '🏁' };
    case 'turn':
    case 'end of road': {
      const dir = modifier ?? 'straight';
      return {
        text: `${modText[dir] ?? 'Turn'} ${road}`.trim(),
        icon: modIcon[dir] ?? '↑',
      };
    }
    case 'continue':
      return { text: `Continue ${road}`.trim(), icon: '↑' };
    case 'merge':
      return { text: `Merge ${road}`.trim(), icon: '⤵' };
    case 'ramp':
      return { text: `Take the ramp ${road}`.trim(), icon: '↗' };
    case 'fork': {
      const dir = modifier === 'left' ? 'left' : 'right';
      return { text: `Keep ${dir} at the fork ${road}`.trim(), icon: modIcon[dir] };
    }
    case 'roundabout':
    case 'rotary':
      return { text: `Enter the roundabout ${road}`.trim(), icon: '🔄' };
    case 'exit roundabout':
    case 'exit rotary':
      return { text: `Exit the roundabout ${road}`.trim(), icon: '↗' };
    default:
      return { text: `Continue ${road}`.trim() || 'Continue', icon: '↑' };
  }
}

// ── Format meters ──────────────────────────────────────────
export function fmtDist(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

// ── Format seconds ─────────────────────────────────────────
export function fmtDuration(seconds: number): string {
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}min` : `${h}h`;
}

// ── Arrival time ───────────────────────────────────────────
function arrivalTime(durationSec: number): string {
  const d = new Date(Date.now() + durationSec * 1000);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ── Fetch route from OSRM ──────────────────────────────────
export async function fetchOsrmRoute(
  from: Coordinates,
  to: Coordinates
): Promise<RealRoute[]> {
  const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  const url = `${OSRM_BASE}/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=true&alternatives=true`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);

  let res: Response;
  try {
    res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
  } catch (err) {
    clearTimeout(timer);
    throw new Error('OSRM request failed: ' + (err instanceof Error ? err.message : String(err)));
  }

  if (!res.ok) throw new Error(`OSRM HTTP error: ${res.status}`);

  const data: OsrmResponse = await res.json();

  if (data.code !== 'Ok' || !data.routes?.length) {
    throw new Error('OSRM returned no routes');
  }

  // Map traffic condition based on duration vs distance ratio (rough heuristic)
  const traffic = (route: OsrmRoute): TrafficCondition => {
    const speedKmh = (route.distance / 1000) / (route.duration / 3600);
    if (speedKmh > 40) return 'light';
    if (speedKmh > 20) return 'moderate';
    return 'heavy';
  };

  return data.routes.map((route, idx): RealRoute => {
    // Polyline from GeoJSON [lng, lat] → { lat, lng }
    const polyline: Coordinates[] = route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));

    // Steps from all legs
    const steps: DirectionStep[] = route.legs
      .flatMap(leg => leg.steps)
      .filter(s => s.distance > 5) // skip tiny steps
      .map(s => {
        const { text, icon } = humanInstruction(s);
        return {
          instruction: text,
          distance: s.distance,
          duration: s.duration,
          icon,
          roadName: s.name,
        };
      });

    const tc = traffic(route);

    return {
      id: `osrm-route-${idx}`,
      label: idx === 0 ? 'Fastest Route' : 'Alternative Route',
      distance: Math.round(route.distance / 100) / 10, // km, 1dp
      duration: Math.round(route.duration / 60),        // minutes
      traffic: tc,
      arrivalTime: arrivalTime(route.duration),
      isRecommended: idx === 0,
      polyline,
      steps,
    };
  });
}
