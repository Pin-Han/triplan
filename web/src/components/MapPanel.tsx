import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  type: "attraction" | "accommodation";
  label: string;
  day?: number;
  popup: {
    title: string;
    description: string;
    cost?: string;
  };
}

interface MapRoute {
  from: string;
  to: string;
  method: string;
  duration_min: number;
}

export interface MapData {
  center: { lat: number; lng: number };
  zoom: number;
  markers: MapMarker[];
  routes: MapRoute[];
}

const ATTRACTION_COLOR = "#3b82f6"; // blue-500
const ACCOMMODATION_COLOR = "#f97316"; // orange-500

function createMarkerIcon(type: "attraction" | "accommodation"): L.DivIcon {
  const color = type === "attraction" ? ATTRACTION_COLOR : ACCOMMODATION_COLOR;
  const emoji = type === "attraction" ? "📍" : "🏨";
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="background:${color};color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid white;">${emoji}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

function buildPopupContent(marker: MapMarker): string {
  return [
    `<strong>${marker.popup.title}</strong>`,
    marker.popup.description,
    marker.popup.cost ? `<em>${marker.popup.cost}</em>` : "",
    marker.day ? `<span style="color:#6b7280;">Day ${marker.day}</span>` : "",
  ]
    .filter(Boolean)
    .join("<br/>");
}

function routeKey(route: MapRoute): string {
  return `${route.from}|${route.to}|${route.method}`;
}

export default function MapPanel({ mapData }: { mapData: MapData }) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderedMarkers = useRef<Map<string, L.Marker>>(new Map());
  const renderedRoutes = useRef<Map<string, L.Polyline>>(new Map());

  // Init effect: create map instance once on mount
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView(
      [mapData.center.lat, mapData.center.lng],
      mapData.zoom
    );
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
      renderedMarkers.current.clear();
      renderedRoutes.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update effect: diff markers and routes on each mapData change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // ── Diff markers ──────────────────────────────────────────────
    const newMarkerIds = new Set(mapData.markers.map((m) => m.id));
    const currentMarkerIds = renderedMarkers.current;
    let hasNewMarkers = false;

    // Remove markers no longer in the data (revision round shrinkage)
    for (const [id, leafletMarker] of currentMarkerIds) {
      if (!newMarkerIds.has(id)) {
        leafletMarker.remove();
        currentMarkerIds.delete(id);
      }
    }

    // Add new markers
    for (const marker of mapData.markers) {
      if (!currentMarkerIds.has(marker.id)) {
        const icon = createMarkerIcon(marker.type);
        const lm = L.marker([marker.lat, marker.lng], { icon })
          .bindPopup(buildPopupContent(marker))
          .addTo(map);
        currentMarkerIds.set(marker.id, lm);
        hasNewMarkers = true;
      }
    }

    // ── Diff routes ───────────────────────────────────────────────
    const newRouteKeys = new Set(mapData.routes.map(routeKey));
    const currentRoutes = renderedRoutes.current;

    // Build marker position lookup for polylines
    const markerLookup = new Map(
      mapData.markers.map((m) => [m.label.toLowerCase(), { lat: m.lat, lng: m.lng }])
    );

    // Remove routes no longer in the data
    for (const [key, polyline] of currentRoutes) {
      if (!newRouteKeys.has(key)) {
        polyline.remove();
        currentRoutes.delete(key);
      }
    }

    // Add new routes
    for (const route of mapData.routes) {
      const key = routeKey(route);
      if (!currentRoutes.has(key)) {
        const fromPos = markerLookup.get(route.from.toLowerCase());
        const toPos = markerLookup.get(route.to.toLowerCase());
        if (fromPos && toPos) {
          const polyline = L.polyline(
            [
              [fromPos.lat, fromPos.lng],
              [toPos.lat, toPos.lng],
            ],
            { color: "#6b7280", weight: 2, dashArray: "6 4", opacity: 0.7 }
          )
            .bindPopup(`${route.method} · ${route.duration_min} min`)
            .addTo(map);
          currentRoutes.set(key, polyline);
        }
      }
    }

    // ── Animate to new bounds (only when markers were added) ─────
    if (hasNewMarkers) {
      const allPositions: L.LatLngExpression[] = Array.from(currentMarkerIds.values()).map(
        (lm) => lm.getLatLng()
      );
      if (allPositions.length > 1) {
        map.flyToBounds(L.latLngBounds(allPositions), {
          padding: [40, 40],
          duration: 0.6,
          maxZoom: 14,
        });
      } else if (allPositions.length === 1) {
        map.flyTo(allPositions[0], 13, { duration: 0.6 });
      }
    }
  }, [mapData]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-lg overflow-hidden"
      style={{ minHeight: "300px" }}
    />
  );
}
