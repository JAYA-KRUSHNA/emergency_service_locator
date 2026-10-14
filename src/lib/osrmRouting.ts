/**
 * OSRM (Open Source Routing Machine) routing integration.
 * Free, no API key required. Uses the public demo server.
 * Provides real road geometry, distance, duration, and turn-by-turn steps.
 */

import { Coordinates, RouteInfo, TrafficCondition } from './types';

// ── OSRM base URL ──────────────────────────────────────────
const OSRM_BASE = 'https://router.project-osrm.org';

// ── Types from OSRM response ───────────────────────────────
interface OsrmManeuver {
  type: string;        // 'turn', 'depart', 'arrive', 'merge', 'ramp', 'roundabout', etc.
  modifier?: string;   // 'left', 'right', 'straight', 'slight left', etc.
  bearing_after?: number;
  exit?: number;       // roundabout exit number
}

interface OsrmStep {
  distance: number;          // meters
  duration: number;          // seconds
  name: string;              // road name (may be empty string)
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
  icon: string;               // emoji / arrow icon
  roadName: string;
}

// ── Parsed route result ────────────────────────────────────
export interface RealRoute extends RouteInfo {
  steps: DirectionStep[];
}

// ── Modifier text & icon tables ────────────────────────────
const MOD_TEXT: Record<string, string> = {
  left:          'Turn left',
  right:         'Turn right',
  'slight left': 'Keep left',
  'slight right':'Keep right',
  'sharp left':  'Sharp left',
  'sharp right': 'Sharp right',
  straight:      'Continue straight',
  uturn:         'Make a U-turn',
};

const MOD_ICON: Record<string, string> = {
  left:          '↰',
  right:         '↱',
  'slight left': '↖',
  'slight right':'↗',
  'sharp left':  '↩',
  'sharp right': '↪',
  straight:      '↑',
  uturn:         '↩',
};

// ── Maneuver → human-readable instruction + icon ──────────
function humanInstruction(step: OsrmStep): { text: string; icon: string } {
  const type = step.maneuver.type;
  const modifier = step.maneuver.modifier ?? '';
  const road = step.name || ''; // empty string when road has no name

  switch (type) {
    // ── Departure
    case 'depart':
      return {
        text: road ? `Head out on ${road}` : 'Start your journey',
        icon: '🚦',
      };

    // ── Arrival
    case 'arrive':
      return { text: 'You have arrived at your destination', icon: '🏁' };

    // ── Standard turns
    case 'turn':
    case 'end of road': {
      const base = MOD_TEXT[modifier] ?? 'Turn';
      return {
        text: road ? `${base} onto ${road}` : base,
        icon: MOD_ICON[modifier] ?? '↑',
      };
    }

    // ── Continue / road name change
    case 'continue':
    case 'new name': {
      if (road) {
        return {
          text: modifier === 'straight' || !modifier
            ? `Continue on ${road}`
            : `${MOD_TEXT[modifier] ?? 'Continue'} on ${road}`,
          icon: MOD_ICON[modifier] ?? '↑',
        };
      }
      return { text: 'Continue straight', icon: '↑' };
    }

    // ── Merge onto road
    case 'merge':
      return {
        text: road ? `Merge onto ${road}` : `Merge ${modifier}`.trim(),
        icon: modifier.includes('left') ? '↰' : '↱',
      };

    // ── On-ramp
    case 'ramp':
    case 'on ramp':
      return {
        text: road ? `Take the ramp onto ${road}` : 'Take the on-ramp',
        icon: modifier.includes('left') ? '↖' : '↗',
      };

    // ── Off-ramp / exit
    case 'off ramp':
      return {
        text: road ? `Take the exit onto ${road}` : 'Take the exit',
        icon: modifier.includes('left') ? '↖' : '↗',
      };

    // ── Fork in road
    case 'fork': {
      const dir = modifier.includes('left') ? 'left' : 'right';
      return {
        text: road ? `Keep ${dir} at the fork onto ${road}` : `Keep ${dir} at the fork`,
        icon: MOD_ICON[dir] ?? '↗',
      };
    }

    // ── Roundabout entry
    case 'roundabout':
    case 'rotary': {
      const exitNum = step.maneuver.exit;
      const exitTxt = exitNum ? ` — take exit ${exitNum}` : '';
      return {
        text: road
          ? `Enter the roundabout${exitTxt}, continue onto ${road}`
          : `Enter the roundabout${exitTxt}`,
        icon: '🔄',
      };
    }

    // ── Roundabout exit
    case 'exit roundabout':
    case 'exit rotary':
      return {
        text: road ? `Exit the roundabout onto ${road}` : 'Exit the roundabout',
        icon: '↗',
      };

    // ── Lane instruction
    case 'use lane':
      return {
        text: `Use the ${modifier} lane`.trim(),
        icon: MOD_ICON[modifier] ?? '↑',
      };

    // ── Zone / administrative boundary notification
    case 'notification':
      return { text: road ? `Entering ${road}` : 'Proceed', icon: 'ℹ️' };

    // ── Fallback
    default:
      return {
        text: road ? `Continue on ${road}` : 'Continue',
        icon: '↑',
      };
  }
}

// ── Format meters → human distance ────────────────────────
export function fmtDist(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

// ── Format seconds → human duration ───────────────────────
export function fmtDuration(seconds: number): string {
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}min` : `${h}h`;
}

// ── Estimate arrival time ──────────────────────────────────
function arrivalTime(durationSec: number): string {
  const d = new Date(Date.now() + durationSec * 1000);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ── Fetch route from OSRM ──────────────────────────────────
export async function fetchOsrmRoute(
  from: Coordinates,
  to: Coordinates
): Promise<RealRoute[]> {
  // OSRM expects coordinates as lng,lat
  const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  const url =
    `${OSRM_BASE}/route/v1/driving/${coords}` +
    `?overview=full&geometries=geojson&steps=true&alternatives=true`;

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

  // Traffic heuristic: estimate based on average speed
  const trafficLevel = (route: OsrmRoute): TrafficCondition => {
    const speedKmh = (route.distance / 1000) / (route.duration / 3600);
    if (speedKmh > 40) return 'light';
    if (speedKmh > 20) return 'moderate';
    return 'heavy';
  };

  return data.routes.map((route, idx): RealRoute => {
    // Convert GeoJSON [lng, lat] → { lat, lng }
    const polyline: Coordinates[] = route.geometry.coordinates.map(
      ([lng, lat]) => ({ lat, lng })
    );

    // Flatten steps from all legs, filter trivial steps, build instructions
    const steps: DirectionStep[] = route.legs
      .flatMap(leg => leg.steps)
      .filter(s => s.distance > 2 || s.maneuver.type === 'arrive') // keep arrive even at 0m
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

    const tc = trafficLevel(route);

    return {
      id: `osrm-route-${idx}`,
      label: idx === 0 ? 'Fastest Route' : `Alternative Route ${idx}`,
      distance: Math.round(route.distance / 100) / 10,  // km, 1 decimal
      duration: Math.round(route.duration / 60),         // minutes
      traffic: tc,
      arrivalTime: arrivalTime(route.duration),
      isRecommended: idx === 0,
      polyline,
      steps,
    };
  });
}
