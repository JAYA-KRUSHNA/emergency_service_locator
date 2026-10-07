'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from 'react';
import {
  AppState,
  Coordinates,
  EmergencyService,
  RouteInfo,
  ServiceCategory,
  SortOption,
} from '@/lib/types';
import { fetchRealServices } from '@/lib/overpassApi';
import { fetchOsrmRoute } from '@/lib/osrmRouting';
import { DEFAULT_LOCATION, DEFAULT_RADIUS, CATEGORY_LABELS } from '@/lib/constants';
import { generateFallbackServices } from '@/data/mockServices';

// ── Context type ───────────────────────────────────────────
interface AppContextType extends AppState {
  setUserLocation: (loc: Coordinates | null) => void;
  setSearchLocation: (loc: Coordinates | null) => void;
  setSelectedRadius: (radius: number) => void;
  toggleCategory: (category: ServiceCategory) => void;
  setSelectedCategories: (categories: ServiceCategory[]) => void;
  setSelectedService: (service: EmergencyService | null) => void;
  setShowDetails: (show: boolean) => void;
  setShowDirections: (show: boolean) => void;
  setIsNavigating: (nav: boolean) => void;
  setIsFullscreen: (fs: boolean) => void;
  setSortBy: (sort: SortOption) => void;
  setSearchQuery: (query: string) => void;
  setSelectedRoute: (route: RouteInfo | null) => void;
  getFilteredServices: () => EmergencyService[];
  requestDirections: (service: EmergencyService) => void;
  startNavigation: () => void;
  exitNavigation: () => void;
  isLoadingServices: boolean;
  isLoadingRoute: boolean;
  fetchError: string | null;
  routeError: string | null;
  isUsingFallback: boolean;
  refetchServices: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // ── Core state ─────────────────────────────────────────
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [searchLocation, setSearchLocation] = useState<Coordinates | null>(null);
  const [selectedRadius, setSelectedRadius] = useState<number>(DEFAULT_RADIUS);
  const [selectedCategories, setSelectedCategories] = useState<ServiceCategory[]>(['all']);
  const [selectedService, setSelectedService] = useState<EmergencyService | null>(null);
  const [nearestService, setNearestService] = useState<EmergencyService | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('nearest');
  const [searchQuery, setSearchQuery] = useState('');
  const [routes, setRoutes] = useState<RouteInfo[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  // ── Real data state ─────────────────────────────────────
  const [allServices, setAllServices] = useState<EmergencyService[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const fetchAbortRef = useRef<AbortController | null>(null);
  const lastFetchKey = useRef<string>('');

  // Effective location
  const effectiveLocation = useMemo(
    () => searchLocation || userLocation || DEFAULT_LOCATION,
    [searchLocation, userLocation]
  );

  // ── Fetch real services from Overpass API ───────────────
  const fetchServices = useCallback(async (loc: Coordinates, radius: number) => {
    const key = `${loc.lat.toFixed(4)},${loc.lng.toFixed(4)},${radius}`;
    if (key === lastFetchKey.current) return; // skip duplicate fetches
    lastFetchKey.current = key;

    // Abort any in-flight request
    if (fetchAbortRef.current) fetchAbortRef.current.abort();
    fetchAbortRef.current = new AbortController();

    setIsLoadingServices(true);
    setFetchError(null);
    setIsUsingFallback(false);

    try {
      const services = await fetchRealServices(loc, radius);
      if (services.length === 0) {
        // Empty result — use fallback so map isn't blank
        setAllServices(generateFallbackServices(loc.lat, loc.lng));
        setIsUsingFallback(true);
        setFetchError(null);
      } else {
        setAllServices(services);
        setFetchError(null);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      console.warn('Overpass API failed, using location-relative fallback:', err);
      // Use generated fallback — positioned relative to user's real location
      setAllServices(generateFallbackServices(loc.lat, loc.lng));
      setIsUsingFallback(true);
      setFetchError(null); // Don't show an error — show the fallback data instead
    } finally {
      setIsLoadingServices(false);
    }
  }, []);

  // Re-fetch whenever location or radius changes
  useEffect(() => {
    fetchServices(effectiveLocation, selectedRadius);
  }, [effectiveLocation, selectedRadius, fetchServices]);

  // Manual refetch
  const refetchServices = useCallback(() => {
    lastFetchKey.current = ''; // force re-fetch
    fetchServices(effectiveLocation, selectedRadius);
  }, [effectiveLocation, selectedRadius, fetchServices]);

  // ── Filter + sort in-memory ─────────────────────────────
  const getFilteredServices = useCallback((): EmergencyService[] => {
    let services = [...allServices];

    // Category filter
    if (!selectedCategories.includes('all' as ServiceCategory)) {
      services = services.filter(s => selectedCategories.includes(s.category));
    }

    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      services = services.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        (CATEGORY_LABELS[s.category] || '').toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q) ||
        s.services.some(svc => svc.toLowerCase().includes(q))
      );
    }

    // Sort
    switch (sortBy) {
      case 'nearest':
        services.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
        break;
      case 'fastest':
        services.sort((a, b) => (a.travelTime ?? 0) - (b.travelTime ?? 0));
        break;
      case 'highest_rated':
        services.sort((a, b) => b.rating - a.rating);
        break;
    }

    return services;
  }, [allServices, selectedCategories, searchQuery, sortBy]);

  // Update nearest service whenever filtered list changes
  useEffect(() => {
    const services = getFilteredServices();
    setNearestService(services.length > 0 ? services[0] : null);
  }, [getFilteredServices]);

  // ── Toggle category ─────────────────────────────────────
  const toggleCategory = useCallback((category: ServiceCategory) => {
    setSelectedCategories(prev => {
      if (category === 'all') return ['all'];
      const without = prev.filter(c => c !== 'all');
      if (without.includes(category)) {
        const result = without.filter(c => c !== category);
        return result.length === 0 ? ['all'] : result;
      }
      return [...without, category];
    });
  }, []);

  // ── Directions — real OSRM routes ───────────────────────
  const requestDirections = useCallback(async (service: EmergencyService) => {
    setIsLoadingRoute(true);
    setRouteError(null);
    setSelectedService(service);
    setShowDirections(true);
    setShowDetails(false);
    setRoutes([]);
    setSelectedRoute(null);

    try {
      const realRoutes = await fetchOsrmRoute(effectiveLocation, service.coordinates);
      setRoutes(realRoutes);
      setSelectedRoute(realRoutes[0] ?? null);
    } catch (err: unknown) {
      console.error('OSRM routing error:', err);
      setRouteError(
        'Could not fetch directions. Check your internet connection.'
      );
    } finally {
      setIsLoadingRoute(false);
    }
  }, [effectiveLocation]);

  // ── Navigation ──────────────────────────────────────────
  const startNavigation = useCallback(() => {
    if (!selectedRoute) return;
    setIsNavigating(true);
    setShowDirections(false);
  }, [selectedRoute]);

  const exitNavigation = useCallback(() => {
    setIsNavigating(false);
    setShowDirections(false);
    setRoutes([]);
    setSelectedRoute(null);
  }, []);

  // ── Context value ───────────────────────────────────────
  const value: AppContextType = {
    userLocation,
    setUserLocation,
    searchLocation,
    setSearchLocation,
    selectedRadius,
    setSelectedRadius,
    selectedCategories,
    setSelectedCategories,
    selectedService,
    setSelectedService,
    nearestService,
    showDetails,
    setShowDetails,
    showDirections,
    setShowDirections,
    isNavigating,
    setIsNavigating,
    isFullscreen,
    setIsFullscreen,
    sortBy,
    setSortBy,
    searchQuery,
    setSearchQuery,
    routes,
    selectedRoute,
    setSelectedRoute,
    isLoading,
    getFilteredServices,
    requestDirections,
    startNavigation,
    exitNavigation,
    toggleCategory,
    isLoadingServices,
    isLoadingRoute,
    fetchError,
    routeError,
    isUsingFallback,
    refetchServices,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
