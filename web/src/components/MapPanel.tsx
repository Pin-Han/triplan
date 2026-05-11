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

export default function MapPanel({ mapData }: { mapData: MapData }) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up previous map instance
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(containerRef.current).setView(
      [mapData.center.lat, mapData.center.lng],
      mapData.zoom
    );
    mapRef.current = map;

    // OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Add markers
    const bounds: L.LatLngExpression[] = [];

    for (const marker of mapData.markers) {
      const icon = createMarkerIcon(marker.type);
      const popupContent = [
        `<strong>${marker.popup.title}</strong>`,
        marker.popup.description,
        marker.popup.cost ? `<em>${marker.popup.cost}</em>` : "",
        marker.day ? `<span style="color:#6b7280;">Day ${marker.day}</span>` : "",
      ]
        .filter(Boolean)
        .join("<br/>");

      L.marker([marker.lat, marker.lng], { icon })
        .bindPopup(popupContent)
        .addTo(map);

      bounds.push([marker.lat, marker.lng]);
    }

    // Draw route lines (match from/to by marker label)
    const markerLookup = new Map(
      mapData.markers.map((m) => [m.label.toLowerCase(), { lat: m.lat, lng: m.lng }])
    );

    for (const route of mapData.routes) {
      const fromPos = markerLookup.get(route.from.toLowerCase());
      const toPos = markerLookup.get(route.to.toLowerCase());
      if (fromPos && toPos) {
        L.polyline(
          [
            [fromPos.lat, fromPos.lng],
            [toPos.lat, toPos.lng],
          ],
          { color: "#6b7280", weight: 2, dashArray: "6 4", opacity: 0.7 }
        )
          .bindPopup(`${route.method} · ${route.duration_min} min`)
          .addTo(map);
      }
    }

    // Fit bounds if we have markers
    if (bounds.length > 1) {
      map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [40, 40] });
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [mapData]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-lg overflow-hidden"
      style={{ minHeight: "300px" }}
    />
  );
}
