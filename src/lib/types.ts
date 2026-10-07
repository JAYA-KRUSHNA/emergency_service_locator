// ============================================================
// Emergency Service Locator — Core Type Definitions
// ============================================================

export type ServiceCategory =
  | 'all'
  | 'hospital'
  | 'police'
  | 'fire'
  | 'ambulance'
  | 'pharmacy'
  | 'petrol'
  | 'ev_charging'
  | 'government';

export type TrafficCondition = 'light' | 'moderate' | 'heavy';

export type SortOption = 'nearest' | 'fastest' | 'highest_rated';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface OperatingHours {
  day: string;
  open: string;
  close: string;
  is24Hours?: boolean;
}

export interface EmergencyService {
  id: string;
  name: string;
  category: ServiceCategory;
  address: string;
  coordinates: Coordinates;
  phone: string;
  rating: number;
  reviewCount: number;
  operatingHours: OperatingHours[];
  isOpen: boolean;
  is24Hours: boolean;
  distance?: number; // km
  travelTime?: number; // minutes
  services: string[];
  photos?: string[];
  website?: string;
}

export interface DirectionStep {
  instruction: string;
  distance: number;  // meters
  duration: number;  // seconds
  icon: string;
  roadName: string;
}

export interface RouteInfo {
  id: string;
  label: string;
  distance: number; // km
  duration: number; // minutes
  traffic: TrafficCondition;
  arrivalTime: string;
  isRecommended: boolean;
  polyline: Coordinates[];
  steps: DirectionStep[];
}

export interface NavigationState {
  isActive: boolean;
  destination: EmergencyService | null;
  route: RouteInfo | null;
  nextDirection: string;
  nextDirectionDistance: number; // meters
  remainingDistance: number; // km
  eta: string;
  traffic: TrafficCondition;
}

export interface RadiusOption {
  label: string;
  value: number; // meters
}

export interface FilterCategory {
  id: ServiceCategory;
  label: string;
  icon: string;
  color: string;
}

export interface AppState {
  userLocation: Coordinates | null;
  searchLocation: Coordinates | null;
  selectedRadius: number;
  selectedCategories: ServiceCategory[];
  selectedService: EmergencyService | null;
  nearestService: EmergencyService | null;
  showDetails: boolean;
  showDirections: boolean;
  isNavigating: boolean;
  isFullscreen: boolean;
  sortBy: SortOption;
  searchQuery: string;
  routes: RouteInfo[];
  selectedRoute: RouteInfo | null;
  isLoading: boolean;
}
