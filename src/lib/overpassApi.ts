/**
 * OpenStreetMap Overpass API integration
 * Fetches real emergency services near a given location.
 * No API key required — completely free.
 *
 * Strategy:
 *  1. Try multiple mirrors with short 12s timeout each
 *  2. Use SEPARATE simple queries (no regex) — much faster on overloaded servers
 *  3. If all mirrors fail → throw so caller can use fallback
 */

import { EmergencyService, ServiceCategory, Coordinates } from './types';

// ── Overpass mirrors (tried in order on failure) ───────────
const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

// ── OSM → category mapping ─────────────────────────────────
type CategoryMap = Record<string, ServiceCategory | undefined>;

const AMENITY_MAP: CategoryMap = {
  hospital: 'hospital',
  clinic: 'hospital',
  doctors: 'hospital',
  healthcare: 'hospital',
  police: 'police',
  fire_station: 'fire',
  pharmacy: 'pharmacy',
  fuel: 'petrol',
  charging_station: 'ev_charging',
  townhall: 'government',
  courthouse: 'government',
  post_office: 'government',
};

const EMERGENCY_MAP: CategoryMap = {
  ambulance_station: 'ambulance',
  hospital: 'hospital',
  police: 'police',
  fire_station: 'fire',
};

// ── Build a simple Overpass query (NO regex, fast) ─────────
function buildQuery(lat: number, lng: number, radiusM: number): string {
  // Cap radius at 8km for performance on public mirrors
  const r = Math.min(Math.round(radiusM), 8000);

  // Use exact match per amenity value — avoids regex slow-path on Overpass
  return `
[out:json][timeout:15];
(
  node["amenity"="hospital"](around:${r},${lat},${lng});
  node["amenity"="clinic"](around:${r},${lat},${lng});
  node["amenity"="police"](around:${r},${lat},${lng});
  node["amenity"="fire_station"](around:${r},${lat},${lng});
  node["amenity"="pharmacy"](around:${r},${lat},${lng});
  node["amenity"="fuel"](around:${r},${lat},${lng});
  node["amenity"="charging_station"](around:${r},${lat},${lng});
  node["emergency"="ambulance_station"](around:${r},${lat},${lng});
  way["amenity"="hospital"](around:${r},${lat},${lng});
  way["amenity"="clinic"](around:${r},${lat},${lng});
  way["amenity"="police"](around:${r},${lat},${lng});
  way["amenity"="fire_station"](around:${r},${lat},${lng});
);
out center 60;
`.trim();
}

// ── Distance helper ────────────────────────────────────────
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Simple string hash for stable pseudorandom values ──────
function stableHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0x7fffffff;
  return h;
}

// ── Default values per category ────────────────────────────
const DEFAULT_PHONES: Record<string, string> = {
  hospital: '108', police: '100', fire: '101', ambulance: '108',
  pharmacy: 'N/A', petrol: 'N/A', ev_charging: 'N/A', government: 'N/A',
};
const DEFAULT_SERVICES: Record<string, string[]> = {
  hospital: ['Emergency Care', 'Outpatient', 'Ambulance'],
  police: ['Emergency Response', 'Crime Reporting'],
  fire: ['Fire Fighting', 'Rescue Operations'],
  ambulance: ['Emergency Transport', 'Paramedic'],
  pharmacy: ['Prescription Drugs', 'OTC Medicines'],
  petrol: ['Petrol', 'Diesel'],
  ev_charging: ['EV Charging'],
  government: ['Public Services'],
};
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

function defaultHours(category: string) {
  const always = ['hospital','ambulance','fire','police'];
  if (always.includes(category)) {
    return DAYS.map(day => ({ day, open: '00:00', close: '23:59', is24Hours: true }));
  }
  return DAYS.map(day => ({
    day,
    open: '08:00',
    close: day === 'Sunday' ? '13:00' : '21:00',
    is24Hours: false,
  }));
}

function fallbackName(category: string, index: number): string {
  const NAMES: Record<string, string> = {
    hospital: 'Hospital', police: 'Police Station', fire: 'Fire Station',
    ambulance: 'Ambulance Station', pharmacy: 'Pharmacy',
    petrol: 'Petrol Station', ev_charging: 'EV Charging Point', government: 'Government Office',
  };
  return `${NAMES[category] ?? 'Service'} #${index + 1}`;
}

// ── OSM types ──────────────────────────────────────────────
interface OsmTags { [key: string]: string }
interface OsmElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: OsmTags;
}

// ── Parse one OSM element ──────────────────────────────────
function parseElement(
  el: OsmElement,
  origin: Coordinates,
  index: number
): EmergencyService | null {
  const lat = el.type === 'way' ? el.center?.lat : el.lat;
  const lng = el.type === 'way' ? el.center?.lon : el.lon;
  if (lat == null || lng == null) return null;

  const tags: OsmTags = el.tags ?? {};

  // Determine category
  let category: ServiceCategory | undefined;
  if (tags.amenity) category = AMENITY_MAP[tags.amenity];
  if (!category && tags.emergency) category = EMERGENCY_MAP[tags.emergency];
  if (!category && tags.healthcare) category = 'hospital';
  if (!category) return null;

  const id = `osm-${el.type}-${el.id}`;
  const hash = stableHash(id);

  // Name
  const name = tags.name ?? tags['name:en'] ?? tags.operator ?? fallbackName(category, index);

  // Address
  const addrParts = [
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:suburb'] ?? tags['addr:city'] ?? tags['addr:district'],
  ].filter(Boolean);
  const address =
    addrParts.length > 0
      ? addrParts.join(', ')
      : tags['addr:full'] ?? tags.description ?? 'See location on map';

  // Phone
  const phone =
    tags.phone ?? tags['contact:phone'] ?? tags['phone:emergency'] ?? DEFAULT_PHONES[category] ?? 'N/A';

  // Hours
  const is24Hours =
    tags.opening_hours === '24/7' ||
    ['hospital', 'ambulance', 'fire', 'police'].includes(category);

  // Extras from tags
  const extraServices: string[] = [];
  if (tags.beds) extraServices.push(`${tags.beds} Beds`);
  if (tags.emergency === 'yes') extraServices.push('Emergency Line');
  if (tags.wheelchair === 'yes') extraServices.push('Wheelchair Access');

  const dist = haversineKm(origin.lat, origin.lng, lat, lng);

  return {
    id,
    name,
    category,
    coordinates: { lat, lng },
    address,
    phone,
    rating: Math.round((3.5 + (hash % 15) / 10) * 10) / 10,   // 3.5–5.0
    reviewCount: 20 + (hash % 480),
    isOpen: true,
    is24Hours,
    operatingHours: defaultHours(category),
    services: [...(DEFAULT_SERVICES[category] ?? []), ...extraServices],
    distance: Math.round(dist * 100) / 100,
    travelTime: Math.max(1, Math.round(dist * 2.5 + 1)),
    website: tags.website ?? tags['contact:website'],
  };
}

// ── Fetch from one mirror with timeout ─────────────────────
async function fetchFromMirror(
  url: string,
  query: string,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'EmergencyServiceLocatorApp/1.0',
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ── Main export ────────────────────────────────────────────
export async function fetchRealServices(
  location: Coordinates,
  radiusM: number
): Promise<EmergencyService[]> {
  const query = buildQuery(location.lat, location.lng, radiusM);

  let lastError: unknown;

  // Try each mirror in turn
  for (const mirror of OVERPASS_MIRRORS) {
    try {
      const res = await fetchFromMirror(mirror, query, 15_000);

      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status} from ${mirror}`);
        continue; // try next mirror
      }

      const text = await res.text();

      // Check for Overpass error response (HTML error pages)
      if (text.startsWith('<') || text.includes('runtime error') || text.includes('Not Acceptable')) {
        lastError = new Error(`Overpass error from ${mirror}`);
        continue;
      }

      const data: { elements: OsmElement[] } = JSON.parse(text);

      // Deduplicate by category+name key
      const seen = new Set<string>();
      const services: EmergencyService[] = [];

      (data.elements ?? []).forEach((el, i) => {
        const parsed = parseElement(el, location, i);
        if (!parsed) return;
        const key = `${parsed.category}::${parsed.name.toLowerCase().trim()}`;
        if (seen.has(key)) return;
        seen.add(key);
        services.push(parsed);
      });

      return services.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        lastError = new Error(`Timeout on ${mirror}`);
      } else {
        lastError = err;
      }
      // try next mirror
    }
  }

  // All mirrors failed
  throw lastError ?? new Error('All Overpass mirrors failed');
}
