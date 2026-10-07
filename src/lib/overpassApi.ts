/**
 * OpenStreetMap Overpass API integration
 * Fetches ALL emergency services in the selected radius.
 * No API key required — completely free.
 *
 * Strategy:
 *  1. Run a FULL comprehensive query with NO radius cap
 *  2. Use nwr (node/way/relation) union type to get ALL mapped features
 *  3. High output limit (500) to return as many as possible
 *  4. Try each mirror with 25s timeout
 *  5. On total failure → throw so caller falls back to generated data
 */

import { EmergencyService, ServiceCategory, Coordinates } from './types';

// ── Overpass mirrors (tried in order on failure) ───────────
const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

// ── OSM → app category mapping ─────────────────────────────
type CategoryMap = Record<string, ServiceCategory | undefined>;

const AMENITY_MAP: CategoryMap = {
  // Medical
  hospital:           'hospital',
  clinic:             'hospital',
  doctors:            'hospital',
  dentist:            'hospital',
  veterinary:         'hospital',
  health_centre:      'hospital',
  nursing_home:       'hospital',
  // Emergency
  police:             'police',
  fire_station:       'fire',
  // Pharmacy
  pharmacy:           'pharmacy',
  // Fuel / EV
  fuel:               'petrol',
  charging_station:   'ev_charging',
  // Government
  townhall:           'government',
  courthouse:         'government',
  post_office:        'government',
  community_centre:   'government',
  social_facility:    'government',
  embassy:            'government',
};

const EMERGENCY_MAP: CategoryMap = {
  ambulance_station:  'ambulance',
  hospital:           'hospital',
  police:             'police',
  fire_station:       'fire',
  yes:                'ambulance', // emergency=yes on a node
};

const HEALTHCARE_MAP: CategoryMap = {
  hospital:           'hospital',
  clinic:             'hospital',
  doctor:             'hospital',
  pharmacy:           'pharmacy',
  laboratory:         'hospital',
  physiotherapy:      'hospital',
  rehabilitation:     'hospital',
  blood_bank:         'hospital',
  dialysis:           'hospital',
};

// ── Build comprehensive Overpass query ─────────────────────
// Uses nwr (node + way + relation) to capture ALL feature types.
// No radius cap — uses the full user-selected radius.
function buildQuery(lat: number, lng: number, radiusM: number): string {
  const r = Math.round(radiusM); // NO cap — user controls this

  return `
[out:json][timeout:25][maxsize:33554432];
(
  nwr["amenity"="hospital"](around:${r},${lat},${lng});
  nwr["amenity"="clinic"](around:${r},${lat},${lng});
  nwr["amenity"="doctors"](around:${r},${lat},${lng});
  nwr["amenity"="dentist"](around:${r},${lat},${lng});
  nwr["amenity"="health_centre"](around:${r},${lat},${lng});
  nwr["amenity"="nursing_home"](around:${r},${lat},${lng});
  nwr["amenity"="police"](around:${r},${lat},${lng});
  nwr["amenity"="fire_station"](around:${r},${lat},${lng});
  nwr["amenity"="pharmacy"](around:${r},${lat},${lng});
  nwr["amenity"="fuel"](around:${r},${lat},${lng});
  nwr["amenity"="charging_station"](around:${r},${lat},${lng});
  nwr["amenity"="townhall"](around:${r},${lat},${lng});
  nwr["amenity"="courthouse"](around:${r},${lat},${lng});
  nwr["amenity"="post_office"](around:${r},${lat},${lng});
  nwr["amenity"="community_centre"](around:${r},${lat},${lng});
  nwr["emergency"="ambulance_station"](around:${r},${lat},${lng});
  nwr["emergency"="fire_station"](around:${r},${lat},${lng});
  nwr["emergency"="police"](around:${r},${lat},${lng});
  nwr["healthcare"="hospital"](around:${r},${lat},${lng});
  nwr["healthcare"="clinic"](around:${r},${lat},${lng});
  nwr["healthcare"="pharmacy"](around:${r},${lat},${lng});
  nwr["healthcare"="doctor"](around:${r},${lat},${lng});
  nwr["healthcare"="blood_bank"](around:${r},${lat},${lng});
  nwr["healthcare"="dialysis"](around:${r},${lat},${lng});
  nwr["landuse"="hospital"](around:${r},${lat},${lng});
  nwr["building"="hospital"](around:${r},${lat},${lng});
  nwr["building"="fire_station"](around:${r},${lat},${lng});
  nwr["building"="police"](around:${r},${lat},${lng});
  nwr["building"="government"](around:${r},${lat},${lng});
);
out center 500;
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
  hospital:    ['Emergency Care', 'Outpatient', 'Ambulance'],
  police:      ['Emergency Response', 'Crime Reporting', 'FIR Registration'],
  fire:        ['Fire Fighting', 'Rescue Operations', 'Hazmat Response'],
  ambulance:   ['Emergency Transport', 'Paramedic Care', 'Patient Pickup'],
  pharmacy:    ['Prescription Drugs', 'OTC Medicines', 'First Aid'],
  petrol:      ['Petrol', 'Diesel', 'CNG'],
  ev_charging: ['EV Charging', 'Fast Charge'],
  government:  ['Public Services', 'Civil Administration'],
};
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

function defaultHours(category: string) {
  const always = ['hospital', 'ambulance', 'fire', 'police'];
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

// ── Determine category from all possible OSM tag combinations ──
function resolveCategory(tags: OsmTags): ServiceCategory | undefined {
  // 1. amenity tag (most common)
  if (tags.amenity) {
    const cat = AMENITY_MAP[tags.amenity];
    if (cat) return cat;
  }
  // 2. emergency tag
  if (tags.emergency && tags.emergency !== 'no') {
    const cat = EMERGENCY_MAP[tags.emergency];
    if (cat) return cat;
  }
  // 3. healthcare tag
  if (tags.healthcare) {
    const cat = HEALTHCARE_MAP[tags.healthcare];
    if (cat) return cat;
  }
  // 4. building tag
  if (tags.building === 'hospital' || tags.building === 'health_centre') return 'hospital';
  if (tags.building === 'fire_station') return 'fire';
  if (tags.building === 'police') return 'police';
  if (tags.building === 'government') return 'government';
  // 5. landuse tag
  if (tags.landuse === 'hospital') return 'hospital';
  // 6. office tag
  if (tags.office === 'government') return 'government';
  if (tags.office === 'police') return 'police';

  return undefined;
}

// ── Parse one OSM element ──────────────────────────────────
function parseElement(
  el: OsmElement,
  origin: Coordinates,
  index: number
): EmergencyService | null {
  // Determine coordinates — nodes have lat/lon, ways/relations have center
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  if (lat == null || lng == null) return null;

  const tags: OsmTags = el.tags ?? {};

  const category = resolveCategory(tags);
  if (!category) return null;

  const id = `osm-${el.type}-${el.id}`;
  const hash = stableHash(id);

  // Name — try multiple tag keys
  const name =
    tags.name ??
    tags['name:en'] ??
    tags.operator ??
    tags['operator:en'] ??
    tags.brand ??
    fallbackName(category, index);

  // Address — assemble from parts or use full address tag
  const addrParts = [
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:suburb'] ?? tags['addr:neighbourhood'],
    tags['addr:city'] ?? tags['addr:district'] ?? tags['addr:state'],
  ].filter(Boolean);

  const address =
    addrParts.length > 0
      ? addrParts.join(', ')
      : tags['addr:full'] ?? tags.description ?? 'See location on map';

  // Phone
  const phone =
    tags.phone ??
    tags['contact:phone'] ??
    tags['phone:emergency'] ??
    tags['contact:emergency'] ??
    DEFAULT_PHONES[category] ??
    'N/A';

  // Hours
  const is24Hours =
    tags.opening_hours === '24/7' ||
    ['hospital', 'ambulance', 'fire', 'police'].includes(category);

  // Extra services from tags
  const extraServices: string[] = [];
  if (tags.beds)                     extraServices.push(`${tags.beds} Beds`);
  if (tags.emergency === 'yes')      extraServices.push('Emergency Line');
  if (tags.wheelchair === 'yes')     extraServices.push('Wheelchair Access');
  if (tags.air_conditioning === 'yes') extraServices.push('Air Conditioned');
  if (tags.speciality)               extraServices.push(tags.speciality);
  if (tags.dispensing === 'yes')     extraServices.push('Dispensing Pharmacy');

  const dist = haversineKm(origin.lat, origin.lng, lat, lng);

  return {
    id,
    name,
    category,
    coordinates: { lat, lng },
    address,
    phone,
    rating: Math.round((3.0 + (hash % 20) / 10) * 10) / 10,  // 3.0–5.0
    reviewCount: 10 + (hash % 990),
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
async function fetchFromMirror(url: string, query: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'EmergencyServiceLocatorApp/1.0 (open-source)',
        'Accept': 'application/json',
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

  for (const mirror of OVERPASS_MIRRORS) {
    try {
      const res = await fetchFromMirror(mirror, query, 25_000);

      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status} from ${mirror}`);
        continue;
      }

      const text = await res.text();

      // Detect HTML error pages from Overpass
      if (
        text.startsWith('<') ||
        text.includes('runtime error') ||
        text.includes('Not Acceptable') ||
        text.includes('Dispatcher_Client')
      ) {
        lastError = new Error(`Overpass server error from ${mirror}: ${text.slice(0, 120)}`);
        continue;
      }

      let data: { elements: OsmElement[] };
      try {
        data = JSON.parse(text);
      } catch {
        lastError = new Error(`Invalid JSON from ${mirror}`);
        continue;
      }

      if (!Array.isArray(data.elements)) {
        lastError = new Error(`No elements array from ${mirror}`);
        continue;
      }

      // Parse all elements
      const seen = new Set<string>();
      const services: EmergencyService[] = [];

      data.elements.forEach((el, i) => {
        const parsed = parseElement(el, location, i);
        if (!parsed) return;

        // Deduplicate: same category + same name at nearly the same spot
        const roundedLat = parsed.coordinates.lat.toFixed(4);
        const roundedLng = parsed.coordinates.lng.toFixed(4);
        const key = `${parsed.category}::${parsed.name.toLowerCase().replace(/\s+/g, '')}::${roundedLat},${roundedLng}`;
        if (seen.has(key)) return;
        seen.add(key);
        services.push(parsed);
      });

      console.info(`[Overpass] ${mirror}: fetched ${data.elements.length} elements → ${services.length} unique services within ${radiusM / 1000}km`);

      return services.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        lastError = new Error(`Timeout (25s) on ${mirror}`);
      } else {
        lastError = err;
      }
      console.warn(`[Overpass] Mirror ${mirror} failed:`, lastError);
    }
  }

  // All mirrors failed
  throw lastError ?? new Error('All Overpass mirrors failed');
}
