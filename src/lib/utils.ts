// ============================================================
// Emergency Service Locator — Utility Functions
// ============================================================

import { Coordinates, TrafficCondition } from './types';

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(from: Coordinates, to: Coordinates): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Estimate travel time based on distance
 * Assumes average speed of 30 km/h in city traffic
 */
export function estimateTravelTime(distanceKm: number): number {
  const avgSpeedKmH = 30;
  return Math.round((distanceKm / avgSpeedKmH) * 60);
}

/**
 * Format distance for display
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

/**
 * Format travel time for display
 */
export function formatTravelTime(minutes: number): string {
  if (minutes < 1) {
    return '< 1 min';
  }
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins}m`;
}

/**
 * Get arrival time string
 */
export function getArrivalTime(minutes: number): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() + minutes);
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Get traffic condition based on random simulation
 */
export function getTrafficCondition(): TrafficCondition {
  const rand = Math.random();
  if (rand < 0.4) return 'light';
  if (rand < 0.8) return 'moderate';
  return 'heavy';
}

/**
 * Get traffic color
 */
export function getTrafficColor(condition: TrafficCondition): string {
  switch (condition) {
    case 'light': return '#16A34A';
    case 'moderate': return '#F59E0B';
    case 'heavy': return '#DC2626';
  }
}

/**
 * Get traffic label
 */
export function getTrafficLabel(condition: TrafficCondition): string {
  switch (condition) {
    case 'light': return 'Light Traffic';
    case 'moderate': return 'Moderate Traffic';
    case 'heavy': return 'Heavy Traffic';
  }
}

/**
 * Generate star rating display
 */
export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Generate a simple route polyline between two points
 * In production, this would come from the Directions API
 */
export function generateMockRoute(from: Coordinates, to: Coordinates): Coordinates[] {
  const points: Coordinates[] = [from];
  const steps = 5 + Math.floor(Math.random() * 5);
  
  for (let i = 1; i < steps; i++) {
    const ratio = i / steps;
    const jitter = 0.001 * (Math.random() - 0.5);
    points.push({
      lat: from.lat + (to.lat - from.lat) * ratio + jitter,
      lng: from.lng + (to.lng - from.lng) * ratio + jitter,
    });
  }
  
  points.push(to);
  return points;
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
