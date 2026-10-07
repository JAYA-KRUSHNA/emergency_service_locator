# 🚨 Emergency Service Locator (Lifeline GPS)

A modern, high-performance, real-time **Emergency Service Locator** web application built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS v4**, and **Leaflet**.

Powered by **OpenStreetMap (OSM) Overpass API** for real-time live data and **OSRM (Open Source Routing Machine)** for genuine turn-by-turn routing and step-by-step navigation — **100% free and requires no proprietary API keys**.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.4-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)
![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?logo=leaflet)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?logo=tailwind-css)

---

## ✨ Features

- 🏥 **Real-Time OSM Emergency Data**:
  - Automatically queries OpenStreetMap via Overpass API with multi-mirror failover (`overpass-api.de`, `kumi.systems`, `mail.ru`).
  - Covers **Hospitals & Clinics**, **Ambulance Stations**, **Police Stations**, **Fire Stations**, **24/7 Pharmacies**, **Petrol Pumps**, **EV Charging Stations**, and **Government / Civic Offices**.
- 📍 **Smart Geolocation & Radius Search**:
  - Accurate browser GPS positioning with real-time location tracking and status badges.
  - Dynamic radius adjustment (1 km, 3 km, 5 km, 10 km, 15 km, 20 km) with instant live recalculation.
- 🗺️ **Interactive Leaflet Map**:
  - Custom color-coded pulsing markers and category pins.
  - Interactive popups with emergency call shortcuts, quick directions, and full metadata.
  - User location radar pulse and route polyline overlay.
- 🧭 **Real Turn-by-Turn Routing (OSRM)**:
  - Fetches authentic driving routes, distances, estimated travel times, and maneuver step breakdowns from OSRM.
  - Interactive turn-by-turn instruction list with direction icons (straight, turn right/left, roundabout, fork, arrive).
- 🚗 **Live Navigation Mode**:
  - Full-screen driving navigation HUD with step-by-step progression controls (Previous / Next).
  - Distance remaining, current step instruction, and exit navigation toggle.
- 🔍 **Instant Search & Multi-Filters**:
  - Search by service name, specialty, address, or amenity tags.
  - Filter by multiple categories simultaneously.
  - Sort by **Nearest Distance**, **Fastest Travel Time**, or **Highest Rating**.
- 📱 **Mobile-First Responsive Design**:
  - Smooth mobile bottom sheet with drag handles.
  - Quick-action bottom navigation bar for mobile emergencies.
  - Clean, accessible light theme with high-contrast emergency red accents (`#DC2626`).

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 & custom CSS tokens
- **Map & Geo**: [Leaflet](https://leafletjs.com/) & [React-Leaflet](https://react-leaflet.js.org/)
- **Live Data Source**: [OpenStreetMap Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API)
- **Routing Engine**: [OSRM (Open Source Routing Machine)](http://project-osrm.org/)

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18.18+ or 20+
- npm, yarn, or pnpm

### 2. Clone Repository
```bash
git clone https://github.com/JAYA-KRUSHNA/emergency_service_locator.git
cd emergency_service_locator
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Project Structure

```
emergency/
├── src/
│   ├── app/
│   │   ├── globals.css         # Design system, CSS tokens & Leaflet overrides
│   │   ├── layout.tsx          # Root layout & SEO meta tags
│   │   ├── page.tsx            # Landing hero page
│   │   └── locator/
│   │       └── page.tsx        # Main locator view (map + controls + panels)
│   ├── components/
│   │   ├── details/
│   │   │   └── ServiceDetails.tsx     # Full service detail drawer
│   │   ├── directions/
│   │   │   ├── NavigationPanel.tsx    # Live step-by-step navigation HUD
│   │   │   └── RoutePanel.tsx         # OSRM routes overview & steps list
│   │   ├── landing/
│   │   │   └── LandingHero.tsx        # Interactive hero landing component
│   │   ├── layout/
│   │   │   ├── Navbar.tsx             # Navbar with GPS locator trigger
│   │   │   └── MobileBottomNav.tsx    # Mobile navigation bar
│   │   ├── map/
│   │   │   └── MapView.tsx            # Interactive Leaflet map & polylines
│   │   ├── mobile/
│   │   │   └── BottomSheet.tsx        # Touch-friendly bottom sheet drawer
│   │   └── panel/
│   │       └── LeftPanel.tsx          # Search, filters, nearest alert & list
│   ├── context/
│   │   └── AppContext.tsx             # Global application state & async handlers
│   ├── hooks/
│   │   └── useGeolocation.ts          # Geolocation hook
│   └── lib/
│       ├── constants.ts               # Categories, colors, and defaults
│       ├── osrmRouting.ts             # OSRM routing client & step parser
│       ├── overpassApi.ts             # OSM Overpass client with mirror fallback
│       ├── types.ts                   # Core TypeScript interfaces
│       └── utils.ts                   # Distance & geometry helpers
├── package.json
└── tsconfig.json
```

---

## 📄 License

This project is licensed under the MIT License.
