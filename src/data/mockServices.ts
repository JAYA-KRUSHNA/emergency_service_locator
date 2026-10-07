// ============================================================
// Emergency Service Locator — Location-Relative Fallback Data
// ============================================================
// These services are generated relative to the user's actual location.
// Used only when the Overpass API is unreachable.
// ============================================================

import { EmergencyService } from '@/lib/types';

// 1 degree of latitude ≈ 111km
// 1 degree of longitude ≈ 111km * cos(lat)
function offsetCoords(
  baseLat: number,
  baseLng: number,
  dLatKm: number,
  dLngKm: number
): { lat: number; lng: number } {
  const lngScale = Math.cos((baseLat * Math.PI) / 180);
  return {
    lat: baseLat + dLatKm / 111,
    lng: baseLng + dLngKm / (111 * lngScale),
  };
}

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

// ── Template definitions (distance offsets in km from user) ─
// Each entry has a name, category, phone, and [dLat, dLng] offsets in km
interface ServiceTemplate {
  id: string;
  name: string;
  category: EmergencyService['category'];
  phone: string;
  dLat: number;  // km offset from user latitude
  dLng: number;  // km offset from user longitude
  rating: number;
  reviewCount: number;
  services: string[];
  is24Hours: boolean;
}

const TEMPLATES: ServiceTemplate[] = [
  // Hospitals
  { id: 'fb-h1', name: 'City General Hospital', category: 'hospital', phone: '108', dLat: 0.8, dLng: 0.6, rating: 4.3, reviewCount: 3240, services: ['Emergency Care', 'ICU', 'Surgery', 'Trauma Center', 'Cardiology'], is24Hours: true },
  { id: 'fb-h2', name: 'District Medical Center', category: 'hospital', phone: '108', dLat: -1.2, dLng: 0.9, rating: 4.1, reviewCount: 1850, services: ['Emergency', 'ICU', 'Surgery', 'Orthopedics', 'Gynecology'], is24Hours: true },
  { id: 'fb-h3', name: 'Community Health Hospital', category: 'hospital', phone: '108', dLat: 1.5, dLng: -0.7, rating: 4.0, reviewCount: 1120, services: ['Emergency', 'Outpatient', 'Pediatrics', 'General Medicine'], is24Hours: true },
  { id: 'fb-h4', name: 'Primary Health Centre', category: 'hospital', phone: '108', dLat: -0.4, dLng: -1.1, rating: 3.8, reviewCount: 560, services: ['General Medicine', 'Outpatient', 'Vaccination'], is24Hours: false },
  // Police
  { id: 'fb-p1', name: 'Central Police Station', category: 'police', phone: '100', dLat: 0.3, dLng: 0.4, rating: 3.9, reviewCount: 420, services: ['Emergency Response', 'FIR Registration', 'Crime Reporting', 'Women Help Desk'], is24Hours: true },
  { id: 'fb-p2', name: 'Area Police Post', category: 'police', phone: '100', dLat: -0.9, dLng: -0.5, rating: 3.7, reviewCount: 180, services: ['Emergency Response', 'General Enquiry', 'Passport Verification'], is24Hours: true },
  { id: 'fb-p3', name: 'Traffic Police Outpost', category: 'police', phone: '100', dLat: 1.1, dLng: 0.8, rating: 3.5, reviewCount: 95, services: ['Traffic Management', 'Road Accident Response'], is24Hours: true },
  // Fire Stations
  { id: 'fb-f1', name: 'City Fire Station', category: 'fire', phone: '101', dLat: 0.6, dLng: -0.4, rating: 4.4, reviewCount: 130, services: ['Fire Response', 'Rescue Operations', 'Hazmat Response', 'Water Rescue'], is24Hours: true },
  { id: 'fb-f2', name: 'District Fire Brigade', category: 'fire', phone: '101', dLat: -1.4, dLng: 1.0, rating: 4.2, reviewCount: 85, services: ['Fire Fighting', 'Rescue', 'Building Collapse Response'], is24Hours: true },
  // Ambulance
  { id: 'fb-a1', name: 'Emergency Ambulance Service', category: 'ambulance', phone: '108', dLat: 0.2, dLng: 0.3, rating: 4.1, reviewCount: 670, services: ['Basic Life Support', 'Advanced Life Support', 'Patient Transport'], is24Hours: true },
  { id: 'fb-a2', name: 'Community Ambulance Unit', category: 'ambulance', phone: '102', dLat: -0.7, dLng: 0.8, rating: 3.9, reviewCount: 340, services: ['Emergency Transport', 'Paramedic Care'], is24Hours: true },
  // Pharmacies
  { id: 'fb-ph1', name: '24/7 Medical Store', category: 'pharmacy', phone: 'N/A', dLat: 0.1, dLng: 0.2, rating: 4.3, reviewCount: 890, services: ['Prescription Drugs', 'OTC Medicines', 'Medical Supplies'], is24Hours: true },
  { id: 'fb-ph2', name: 'City Pharmacy', category: 'pharmacy', phone: 'N/A', dLat: -0.3, dLng: -0.4, rating: 4.0, reviewCount: 450, services: ['Prescription Drugs', 'Health Supplements', 'Baby Care'], is24Hours: false },
  { id: 'fb-ph3', name: 'Health Plus Chemist', category: 'pharmacy', phone: 'N/A', dLat: 0.9, dLng: 0.5, rating: 3.9, reviewCount: 320, services: ['Medicines', 'OTC Drugs', 'Medical Devices'], is24Hours: false },
  // Petrol
  { id: 'fb-pe1', name: 'Indian Oil Fuel Station', category: 'petrol', phone: 'N/A', dLat: 0.4, dLng: 0.7, rating: 4.0, reviewCount: 1200, services: ['Petrol', 'Diesel', 'CNG', 'Air & Water'], is24Hours: true },
  { id: 'fb-pe2', name: 'HP Petrol Pump', category: 'petrol', phone: 'N/A', dLat: -0.6, dLng: -0.9, rating: 3.8, reviewCount: 780, services: ['Petrol', 'Diesel', 'Vehicle Care'], is24Hours: false },
  // EV Charging
  { id: 'fb-ev1', name: 'EV Charging Point', category: 'ev_charging', phone: 'N/A', dLat: 0.5, dLng: -0.6, rating: 4.1, reviewCount: 210, services: ['DC Fast Charging', 'AC Charging', 'Multiple Connectors'], is24Hours: true },
  // Government
  { id: 'fb-g1', name: 'Emergency Operations Center', category: 'government', phone: '112', dLat: 0.7, dLng: 0.3, rating: 4.2, reviewCount: 280, services: ['Emergency Coordination', 'Disaster Management', 'Relief Operations'], is24Hours: true },
  { id: 'fb-g2', name: 'Municipal Corporation Office', category: 'government', phone: 'N/A', dLat: -1.0, dLng: 0.6, rating: 3.6, reviewCount: 120, services: ['Public Services', 'Civil Administration', 'Utilities'], is24Hours: false },
];

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

function makeHours(is24Hours: boolean) {
  if (is24Hours) {
    return DAYS.map(day => ({ day, open: '00:00', close: '23:59', is24Hours: true }));
  }
  return DAYS.map(day => ({
    day,
    open: '09:00',
    close: day === 'Sunday' ? '13:00' : '20:00',
    is24Hours: false,
  }));
}

/**
 * Generate fallback services positioned relative to the given location.
 * This ensures services always appear near the user, regardless of where they are.
 */
export function generateFallbackServices(
  baseLat: number,
  baseLng: number
): EmergencyService[] {
  return TEMPLATES.map(tmpl => {
    const coords = offsetCoords(baseLat, baseLng, tmpl.dLat, tmpl.dLng);
    const distKm = haversineKm(baseLat, baseLng, coords.lat, coords.lng);

    return {
      id: tmpl.id,
      name: tmpl.name,
      category: tmpl.category,
      coordinates: coords,
      address: 'Near your location (estimated)',
      phone: tmpl.phone,
      rating: tmpl.rating,
      reviewCount: tmpl.reviewCount,
      isOpen: true,
      is24Hours: tmpl.is24Hours,
      operatingHours: makeHours(tmpl.is24Hours),
      services: tmpl.services,
      distance: Math.round(distKm * 100) / 100,
      travelTime: Math.max(1, Math.round(distKm * 2.5 + 1)),
    } satisfies EmergencyService;
  }).sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
}

// Legacy export kept for backward compatibility
export const MOCK_SERVICES = generateFallbackServices(28.6139, 77.209);
