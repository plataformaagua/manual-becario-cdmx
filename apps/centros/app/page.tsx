"use client";

import type { Map as LeafletMap, Marker, Polyline } from "leaflet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

type CenterType = "pilares" | "biblioteca";
type Proximity = "muy-cercano" | "cercano" | "lejano";
type TravelMode = "walking" | "driving" | "transit";

type Center = {
  id: string;
  name: string;
  type: CenterType;
  address: string;
  borough: string;
  lat: number;
  lng: number;
};

type CenterResult = Center & {
  distanceKm: number;
  walkingMinutes: number;
  proximity: Proximity;
};

type UserLocation = {
  lat: number;
  lng: number;
  accuracy?: number;
  source: "demo" | "gps";
};

type RouteInfo = {
  centerId: string;
  mode: Exclude<TravelMode, "transit">;
  distanceKm: number;
  durationMinutes: number;
  coordinates: Array<[number, number]>;
};

type NetworkMetric = {
  distanceKm: number;
  durationMinutes: number;
};

const DEMO_LOCATION: UserLocation = {
  lat: 19.43262,
  lng: -99.13321,
  source: "demo",
};

const DEMO_CENTERS: Center[] = [
  {
    id: "biblio-lerdo",
    name: "Biblioteca Miguel Lerdo de Tejada",
    type: "biblioteca",
    address: "República de El Salvador 49, Centro Histórico",
    borough: "Cuauhtémoc",
    lat: 19.42944,
    lng: -99.1374,
  },
  {
    id: "biblio-mexico",
    name: "Biblioteca de México",
    type: "biblioteca",
    address: "Plaza de la Ciudadela 4, Centro",
    borough: "Cuauhtémoc",
    lat: 19.42972,
    lng: -99.14969,
  },
  {
    id: "pilares-candelaria",
    name: "PILARES Candelaria",
    type: "pilares",
    address: "Zona Candelaria de los Patos",
    borough: "Venustiano Carranza",
    lat: 19.42365,
    lng: -99.12412,
  },
  {
    id: "biblio-vasconcelos",
    name: "Biblioteca Vasconcelos",
    type: "biblioteca",
    address: "Eje 1 Norte Mosqueta 160, Buenavista",
    borough: "Cuauhtémoc",
    lat: 19.44732,
    lng: -99.15087,
  },
  {
    id: "pilares-avenida-taller",
    name: "PILARES Avenida del Taller",
    type: "pilares",
    address: "Francisco del Paso y Troncoso y Av. del Taller",
    borough: "Venustiano Carranza",
    lat: 19.40469,
    lng: -99.10974,
  },
  {
    id: "biblio-artes",
    name: "Biblioteca de las Artes",
    type: "biblioteca",
    address: "Río Churubusco 79, Country Club",
    borough: "Coyoacán",
    lat: 19.35522,
    lng: -99.14332,
  },
  {
    id: "pilares-casa-amarilla",
    name: "PILARES Casa Amarilla",
    type: "pilares",
    address: "Avenida Parque Lira 94",
    borough: "Miguel Hidalgo",
    lat: 19.40588,
    lng: -99.19022,
  },
  {
    id: "pilares-20-noviembre",
    name: "PILARES 20 de Noviembre",
    type: "pilares",
    address: "Avenida Gran Canal s/n, 5.º tramo",
    borough: "Venustiano Carranza",
    lat: 19.4705,
    lng: -99.1022,
  },
  {
    id: "biblio-franklin",
    name: "Biblioteca Benjamín Franklin",
    type: "biblioteca",
    address: "Liverpool 31, Juárez",
    borough: "Cuauhtémoc",
    lat: 19.42743,
    lng: -99.16535,
  },
  {
    id: "pilares-revolucion",
    name: "PILARES Revolución",
    type: "pilares",
    address: "Calle Río Rivera s/n, Guadalupe Victoria",
    borough: "Gustavo A. Madero",
    lat: 19.50682,
    lng: -99.11144,
  },
  {
    id: "biblio-central-unam",
    name: "Biblioteca Central UNAM",
    type: "biblioteca",
    address: "Circuito Interior, Ciudad Universitaria",
    borough: "Coyoacán",
    lat: 19.3321,
    lng: -99.18715,
  },
  {
    id: "pilares-san-jose",
    name: "PILARES San José",
    type: "pilares",
    address: "Calle Agustín Lara s/n, San José",
    borough: "Tláhuac",
    lat: 19.28196,
    lng: -99.00124,
  },
];

const proximityLabel: Record<Proximity, string> = {
  "muy-cercano": "Muy cercano",
  cercano: "Cercano",
  lejano: "Lejano",
};

const proximityColor: Record<Proximity, string> = {
  "muy-cercano": "#218c4b",
  cercano: "#d4a300",
  lejano: "#e56a1f",
};

const travelModeLabel: Record<TravelMode, string> = {
  walking: "Caminando",
  driving: "En vehículo",
  transit: "En transporte público",
};

const travelModeIcon: Record<TravelMode, string> = {
  walking: "🚶",
  driving: "🚗",
  transit: "Ⓜ",
};

function haversineKm(
  origin: Pick<UserLocation, "lat" | "lng">,
  destination: Pick<Center, "lat" | "lng">,
) {
  const earthRadiusKm = 6371;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const deltaLat = toRadians(destination.lat - origin.lat);
  const deltaLng = toRadians(destination.lng - origin.lng);
  const lat1 = toRadians(origin.lat);
  const lat2 = toRadians(destination.lat);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function classifyDistance(distanceKm: number): Proximity {
  if (distanceKm < 2) return "muy-cercano";
  if (distanceKm <= 5) return "cercano";
  return "lejano";
}

function formatDistance(distanceKm: number) {
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m`;
  return `${distanceKm.toFixed(distanceKm < 2 ? 1 : 1)} km`;
}

function googleMapsDirectionsUrl(
  origin: Pick<UserLocation, "lat" | "lng">,
  destination: Pick<Center, "lat" | "lng">,
  mode: TravelMode,
) {
  const parameters = new URLSearchParams({
    api: "1",
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    travelmode:
      mode === "driving" ? "driving" : mode === "transit" ? "transit" : "walking",
  });
  return `https://www.google.com/maps/dir/?${parameters.toString()}`;
}

export default function Home() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerLayerRef = useRef<{ clearLayers: () => void } | null>(null);
  const userMarkerRef = useRef<Marker | null>(null);
  const routeRef = useRef<Polyline | null>(null);
  const routeAbortRef = useRef<AbortController | null>(null);

  const [centers, setCenters] = useState<Center[]>(DEMO_CENTERS);
  const [dataStatus, setDataStatus] = useState<
    "loading" | "official" | "fallback"
  >("loading");
  const [location, setLocation] = useState<UserLocation>(DEMO_LOCATION);
  const [selectedId, setSelectedId] = useState(DEMO_CENTERS[0].id);
  const [activeTypes, setActiveTypes] = useState<Set<CenterType>>(
    new Set(["pilares", "biblioteca"]),
  );
  const [isLocating, setIsLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState(
    "Vista demostrativa en el Centro Histórico",
  );
  const [showAll, setShowAll] = useState(false);
  const [travelMode, setTravelMode] = useState<TravelMode>("walking");
  const [networkMetrics, setNetworkMetrics] = useState<
    Record<string, NetworkMetric>
  >({});
  const [distanceStatus, setDistanceStatus] = useState<
    "loading" | "network" | "estimated"
  >("loading");
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [routeStatus, setRouteStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");

  const results = useMemo<CenterResult[]>(() => {
    return centers.map((center) => {
      const fallbackDistanceKm = haversineKm(location, center);
      const networkMetric = networkMetrics[center.id];
      const distanceKm = networkMetric?.distanceKm ?? fallbackDistanceKm;
      return {
        ...center,
        distanceKm,
        walkingMinutes:
          networkMetric?.durationMinutes ??
          Math.max(1, Math.round((distanceKm / 4.5) * 60)),
        proximity: classifyDistance(distanceKm),
      };
    })
      .filter(
        (center) =>
          center.distanceKm <= 10 && activeTypes.has(center.type),
      )
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [activeTypes, centers, location, networkMetrics]);

  const visibleResults = showAll ? results : results.slice(0, 5);
  const selected =
    results.find((center) => center.id === selectedId) ?? results[0] ?? null;

  useEffect(() => {
    if (selected && selected.id !== selectedId) {
      // Keep the persisted selection aligned when filters remove the active center.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedId(selected.id);
    }
  }, [selected, selectedId]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadOfficialCenters() {
      try {
        const response = await fetch("/api/centers", {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Directorio no disponible");
        const payload = (await response.json()) as {
          centers?: Center[];
          source?: "official" | "unavailable";
        };

        if (payload.source === "official" && (payload.centers?.length ?? 0) >= 10) {
          setCenters(payload.centers ?? DEMO_CENTERS);
          setDataStatus("official");
        } else {
          setDataStatus("fallback");
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setDataStatus("fallback");
        }
      }
    }

    loadOfficialCenters();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (dataStatus === "loading") return;
    const controller = new AbortController();
    const candidates = centers
      .map((center) => ({
        center,
        straightDistanceKm: haversineKm(location, center),
      }))
      .filter(({ straightDistanceKm }) => straightDistanceKm <= 12)
      .sort((a, b) => a.straightDistanceKm - b.straightDistanceKm)
      .slice(0, 40)
      .map(({ center }) => ({
        id: center.id,
        lat: center.lat,
        lng: center.lng,
      }));

    if (!candidates.length) {
      // This branch resets stale metrics when no center remains in the search radius.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNetworkMetrics({});
      setDistanceStatus("estimated");
      return;
    }

    setDistanceStatus("loading");
    setNetworkMetrics({});

    async function loadWalkingDistances() {
      try {
        const response = await fetch("/api/walking/table", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            origin: { lat: location.lat, lng: location.lng },
            destinations: candidates,
          }),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Matriz no disponible");
        const payload = (await response.json()) as {
          metrics?: Record<string, NetworkMetric>;
        };
        if (payload.metrics && Object.keys(payload.metrics).length) {
          setNetworkMetrics(payload.metrics);
          setDistanceStatus("network");
        } else {
          setDistanceStatus("estimated");
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setDistanceStatus("estimated");
        }
      }
    }

    loadWalkingDistances();
    return () => controller.abort();
  }, [centers, dataStatus, location]);

  useEffect(() => {
    let cancelled = false;

    async function createMap() {
      if (!mapContainerRef.current || mapRef.current) return;
      const L = await import("leaflet");
      if (cancelled || !mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        preferCanvas: true,
      }).setView([DEMO_LOCATION.lat, DEMO_LOCATION.lng], 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      L.control.zoom({ position: "topright" }).addTo(map);
      markerLayerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
    }

    createMap();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function drawMap() {
      const map = mapRef.current;
      const markerLayer = markerLayerRef.current;
      if (!map || !markerLayer) {
        window.setTimeout(drawMap, 80);
        return;
      }

      const L = await import("leaflet");
      if (cancelled) return;

      markerLayer.clearLayers();

      if (userMarkerRef.current) {
        userMarkerRef.current.removeFrom(map);
      }

      const userIcon = L.divIcon({
        className: "map-pin-shell",
        html: '<span class="user-pin" aria-hidden="true"><span></span></span>',
        iconSize: [46, 52],
        iconAnchor: [23, 48],
      });

      userMarkerRef.current = L.marker([location.lat, location.lng], {
        icon: userIcon,
        zIndexOffset: 1000,
        title: "Tu ubicación",
      })
        .addTo(map)
        .bindTooltip("Tú estás aquí", {
          permanent: true,
          direction: "top",
          offset: [0, -42],
          className: "user-tooltip",
        });

      results.forEach((center) => {
        const icon = L.divIcon({
          className: "map-pin-shell",
          html: `<button class="center-pin ${center.type} ${center.proximity} ${
            center.id === selected?.id ? "is-selected" : ""
          }" aria-label="${center.name}"><span>${
            center.type === "pilares" ? "⌂" : "▤"
          }</span></button>`,
          iconSize: [42, 48],
          iconAnchor: [21, 44],
        });

        L.marker([center.lat, center.lng], {
          icon,
          title: center.name,
        })
          .addTo(markerLayer)
          .bindTooltip(center.name, {
            direction: "top",
            offset: [0, -38],
          })
          .on("click", () => setSelectedId(center.id));
      });

      if (routeRef.current) {
        routeRef.current.removeFrom(map);
        routeRef.current = null;
      }

      if (
        selected &&
        routeInfo?.centerId === selected.id &&
        routeInfo.mode === travelMode &&
        routeInfo.coordinates.length
      ) {
        routeRef.current = L.polyline(routeInfo.coordinates, {
          color: proximityColor[selected.proximity],
          weight: 5,
          opacity: 0.95,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(map);
      } else if (selected) {
        routeRef.current = L.polyline(
          [
            [location.lat, location.lng],
            [selected.lat, selected.lng],
          ],
          {
            color: proximityColor[selected.proximity],
            weight: 5,
            opacity: 0.92,
            dashArray: "10 8",
            lineCap: "round",
          },
        ).addTo(map);
      }
    }

    drawMap();
    return () => {
      cancelled = true;
    };
  }, [location, results, routeInfo, selected, travelMode]);

  const locateUser = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationMessage("Este dispositivo no permite obtener la ubicación.");
      return;
    }

    setIsLocating(true);
    setLocationMessage("Buscando tu ubicación…");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation: UserLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          source: "gps",
        };
        setLocation(nextLocation);
        setNetworkMetrics({});
        setDistanceStatus("loading");
        setRouteInfo(null);
        setRouteStatus("idle");
        setIsLocating(false);
        setShowAll(false);
        setLocationMessage(
          `Ubicación detectada con precisión aproximada de ${Math.round(
            position.coords.accuracy,
          )} m`,
        );
        mapRef.current?.setView(
          [nextLocation.lat, nextLocation.lng],
          14,
          { animate: true },
        );
      },
      () => {
        setIsLocating(false);
        setLocationMessage(
          "No pudimos usar tu ubicación. Revisa el permiso del navegador.",
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 60000,
      },
    );
  }, []);

  function toggleType(type: CenterType) {
    setActiveTypes((current) => {
      const next = new Set(current);
      if (next.has(type) && next.size > 1) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  function selectCenter(center: CenterResult) {
    setSelectedId(center.id);
    setRouteInfo(null);
    setRouteStatus("idle");
    mapRef.current?.flyTo([center.lat, center.lng], 15, {
      animate: true,
      duration: 0.7,
    });
  }

  async function calculateRoute(
    center: CenterResult,
    mode: Exclude<TravelMode, "transit"> = "walking",
  ) {
    routeAbortRef.current?.abort();
    const controller = new AbortController();
    routeAbortRef.current = controller;
    setSelectedId(center.id);
    setRouteStatus("loading");
    setRouteInfo(null);

    try {
      const parameters = new URLSearchParams({
        originLat: String(location.lat),
        originLng: String(location.lng),
        destinationLat: String(center.lat),
        destinationLng: String(center.lng),
        mode,
      });
      const response = await fetch(`/api/walking/route?${parameters}`, {
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("Ruta no disponible");
      const payload = (await response.json()) as Omit<RouteInfo, "centerId">;

      setRouteInfo({
        centerId: center.id,
        mode,
        distanceKm: payload.distanceKm,
        durationMinutes: payload.durationMinutes,
        coordinates: payload.coordinates,
      });
      setRouteStatus("ready");

      const bounds = payload.coordinates;
      const L = await import("leaflet");
      if (mapRef.current && bounds.length) {
        mapRef.current.fitBounds(L.latLngBounds(bounds), {
          animate: true,
          padding: [55, 55],
        });
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setRouteStatus("error");
      }
    }
  }

  function changeTravelMode(mode: TravelMode) {
    routeAbortRef.current?.abort();
    setTravelMode(mode);
    setRouteInfo(null);

    if (!selected || mode === "transit") {
      setRouteStatus("idle");
      return;
    }

    void calculateRoute(selected, mode);
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <span>⌂</span>
            <span>⌄</span>
          </div>
          <div>
            <p className="eyebrow">Apoyo para estudiantes</p>
            <h1>Encuentra tu centro más cercano</h1>
            <p>Encuentra PILARES y bibliotecas a máximo 10 km</p>
          </div>
        </div>

        <button
          className="location-button"
          type="button"
          onClick={locateUser}
          disabled={isLocating}
        >
          <span className={isLocating ? "target is-locating" : "target"} />
          {isLocating ? "Localizando…" : "Usar mi ubicación"}
        </button>
      </header>

      <section className="workspace" aria-label="Buscador de centros cercanos">
        <aside className="results-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">
                <span aria-hidden="true">⌖</span> Cerca de ti
              </p>
              <h2>
                {results.length} {results.length === 1 ? "centro" : "centros"}{" "}
                a tu alcance
              </h2>
            </div>
            <span
              className={
                dataStatus === "official"
                  ? "demo-badge is-official"
                  : "demo-badge"
              }
            >
              {dataStatus === "loading"
                ? "Cargando datos"
                : dataStatus === "official"
                  ? "Datos oficiales"
                  : "Prototipo"}
            </span>
          </div>

          <div className="type-filters" aria-label="Filtrar por tipo">
            <button
              type="button"
              className={activeTypes.has("pilares") ? "is-active" : ""}
              onClick={() => toggleType("pilares")}
              aria-pressed={activeTypes.has("pilares")}
            >
              <span className="filter-icon pilares">⌂</span> PILARES
            </button>
            <button
              type="button"
              className={activeTypes.has("biblioteca") ? "is-active" : ""}
              onClick={() => toggleType("biblioteca")}
              aria-pressed={activeTypes.has("biblioteca")}
            >
              <span className="filter-icon biblioteca">▤</span> Bibliotecas
            </button>
          </div>

          <p className="location-status" role="status">
            <span
              className={location.source === "gps" ? "status-dot gps" : "status-dot"}
            />
            {locationMessage}
          </p>
          <p
            className={
              distanceStatus === "network"
                ? "distance-mode is-network"
                : "distance-mode"
            }
          >
            <span aria-hidden="true">
              {distanceStatus === "loading"
                ? "◌"
                : distanceStatus === "network"
                  ? "✓"
                  : "~"}
            </span>
            {distanceStatus === "loading"
              ? "Calculando distancias caminando…"
              : distanceStatus === "network"
                ? "Clasificación por recorrido caminando"
                : "Clasificación con distancia estimada"}
          </p>

          <div className="result-list">
            {visibleResults.length ? (
              visibleResults.map((center, index) => (
                <article
                  className={
                    center.id === selected?.id
                      ? "center-card is-selected"
                      : "center-card"
                  }
                  key={center.id}
                >
                  <button
                    type="button"
                    className="card-main"
                    onClick={() => {
                      selectCenter(center);
                      if (travelMode !== "transit") {
                        void calculateRoute(center, travelMode);
                      }
                    }}
                    aria-label={`Ver ${center.name} en el mapa`}
                  >
                    <span className={`facility-icon ${center.type}`}>
                      {center.type === "pilares" ? "⌂" : "▤"}
                    </span>
                    <span className="card-copy">
                      <span className="card-topline">
                        {index === 0 && <strong>★ Más cercano</strong>}
                        <span className={`distance-chip ${center.proximity}`}>
                          {formatDistance(center.distanceKm)}
                        </span>
                      </span>
                      <span className="center-name">{center.name}</span>
                      <span className="center-address">
                        {center.address}
                        <br />
                        {center.borough}
                      </span>
                      <span className="card-meta">
                        <span>
                          🚶 {center.walkingMinutes} min a pie{" "}
                          {distanceStatus === "network" ? "" : "estimados"}
                        </span>
                        <span>
                          ● {formatDistance(center.distanceKm)}{" "}
                          {distanceStatus === "network" ? "" : "aprox."}
                        </span>
                        <span className="route-cta">Ver ruta →</span>
                      </span>
                      <span className={`type-chip ${center.type}`}>
                        {center.type === "pilares" ? "⌂ PILARES" : "▤ Biblioteca"}
                      </span>
                    </span>
                  </button>
                </article>
              ))
            ) : (
              <div className="empty-state">
                <span aria-hidden="true">⌖</span>
                <h3>No encontramos centros en este radio</h3>
                <p>Activa el otro tipo de espacio o prueba otra ubicación.</p>
              </div>
            )}
          </div>

          {results.length > 5 && (
            <button
              className="show-all-button"
              type="button"
              onClick={() => setShowAll((current) => !current)}
            >
              {showAll ? "Mostrar menos" : `Ver los ${results.length} centros`}
              <span aria-hidden="true">{showAll ? " ↑" : " ↓"}</span>
            </button>
          )}
        </aside>

        <section className="map-panel" aria-label="Mapa de centros cercanos">
          <div ref={mapContainerRef} className="map" />

          <div className="map-note">
            <span className="map-note-icon" aria-hidden="true">
              i
            </span>
            <span>
              Selecciona un centro y elige cómo quieres llegar.
            </span>
          </div>

          <div className="legend" aria-label="Clasificación de distancia">
            <p>Distancia desde ti</p>
            <span>
              <i className="legend-dot muy-cercano" /> Muy cercano{" "}
              <strong>&lt;2 km</strong>
            </span>
            <span>
              <i className="legend-dot cercano" /> Cercano{" "}
              <strong>2–5 km</strong>
            </span>
            <span>
              <i className="legend-dot lejano" /> Lejano{" "}
              <strong>5–10 km</strong>
            </span>
          </div>

          {selected && (
            <div
              className={`selected-route ${selected.proximity}`}
              aria-live="polite"
            >
              <div
                className="travel-mode-picker"
                role="group"
                aria-label="Modo de viaje"
              >
                {(["walking", "driving", "transit"] as TravelMode[]).map(
                  (mode) => (
                    <button
                      type="button"
                      className={travelMode === mode ? "is-active" : ""}
                      onClick={() => changeTravelMode(mode)}
                      aria-pressed={travelMode === mode}
                      key={mode}
                    >
                      <span aria-hidden="true">{travelModeIcon[mode]}</span>
                      {mode === "walking"
                        ? "Caminando"
                        : mode === "driving"
                          ? "Vehículo"
                          : "Transporte público"}
                    </button>
                  ),
                )}
              </div>
              <span className={`facility-icon ${selected.type}`}>
                {selected.type === "pilares" ? "⌂" : "▤"}
              </span>
              <div className="route-summary">
                <small>
                  {proximityLabel[selected.proximity]} ·{" "}
                  {travelModeLabel[travelMode]}
                </small>
                <strong>{selected.name}</strong>
                <span>
                  {travelMode === "transit" ? (
                    <>
                      Consulta Metro, Metrobús, RTP, Trolebús y otras opciones
                      disponibles en Google Maps.
                    </>
                  ) : routeStatus === "ready" &&
                  routeInfo?.centerId === selected.id ? (
                    <>
                      {travelModeIcon[travelMode]} {routeInfo.durationMinutes} min{" "}
                      {travelMode === "walking" ? "caminando" : "en vehículo"} ·{" "}
                      {formatDistance(routeInfo.distanceKm)}
                    </>
                  ) : routeStatus === "loading" ? (
                    `Calculando ruta ${travelModeLabel[travelMode].toLowerCase()}…`
                  ) : routeStatus === "error" ? (
                    "No se pudo trazar la ruta dentro del mapa. Intenta de nuevo."
                  ) : (
                    <>
                      {travelModeIcon[travelMode]}{" "}
                      {travelMode === "walking"
                        ? `${selected.walkingMinutes} min estimados · `
                        : ""}
                      {formatDistance(selected.distanceKm)} aprox.
                    </>
                  )}
                </span>
              </div>
              {travelMode === "transit" ? (
                <a
                  className="calculate-route"
                  href={googleMapsDirectionsUrl(location, selected, travelMode)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Abrir ruta en transporte público hacia ${selected.name}`}
                >
                  Abrir ruta ↗
                </a>
              ) : (
                <button
                  type="button"
                  className="calculate-route"
                  onClick={() => void calculateRoute(selected, travelMode)}
                  disabled={routeStatus === "loading"}
                >
                  {routeStatus === "loading" ? "Calculando…" : "Calcular ruta"}
                </button>
              )}
            </div>
          )}
        </section>
      </section>

      <footer className="app-footer">
        <p>
          <strong>Versión demostrativa.</strong> No guarda tu ubicación.
          {distanceStatus === "network"
            ? " La clasificación usa distancias de recorrido caminando."
            : " La clasificación usa distancias estimadas."}
        </p>
        <p>
          {dataStatus === "official"
            ? "Directorios públicos consultados correctamente."
            : "Usando sedes de muestra mientras se conecta el directorio oficial."}{" "}
          Mapa y rutas internas: OpenStreetMap. Transporte público: Google Maps.
        </p>
      </footer>
    </main>
  );
}
