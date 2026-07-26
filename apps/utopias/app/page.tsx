"use client";

import {
  Bus,
  Car,
  ChevronRight,
  Footprints,
  LocateFixed,
  MapPin,
  Navigation,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

type TravelMode = "walking" | "driving" | "transit";

type Utopia = {
  id: string;
  name: string;
  borough: string;
  address: string;
  lat: number;
  lng: number;
  source: string;
  note?: string;
};

type UserLocation = {
  lat: number;
  lng: number;
};

type RouteInfo = {
  utopiaId: string;
  distanceKm: number;
  durationMinutes: number;
  estimated: boolean;
};

type LeafletModule = typeof import("leaflet");

type Category = {
  key: "very-near" | "near" | "far" | "outside";
  label: string;
  shortLabel: string;
  color: string;
};

const UTOPIAS: Utopia[] = [
  {
    id: "ixtapalcalli",
    name: "Utopía Ixtapalcalli Quetzalcóatl",
    borough: "Iztapalapa",
    address: "Av. Ermita Iztapalapa 1385, Barrio San Pablo",
    lat: 19.364750320276,
    lng: -99.089742989467,
    source: "Sistema de Información Cultural",
  },
  {
    id: "barco",
    name: "Barco Utopía",
    borough: "Iztapalapa",
    address: "Parque Lineal Vicente Guerrero, Periférico Oriente y Eje 6 Sur",
    lat: 19.362238692847654,
    lng: -99.05729070854359,
    source: "Secretaría de Turismo CDMX",
  },
  {
    id: "libertad",
    name: "Utopía Libertad",
    borough: "Iztapalapa",
    address: "Río Nilo y Av. Reforma, Lomas de San Lorenzo",
    lat: 19.325014895278,
    lng: -99.06542124437,
    source: "Sistema de Información Cultural",
  },
  {
    id: "aculco",
    name: "Utopía Cuauhtlicalli Aculco",
    borough: "Iztapalapa",
    address: "Alfonso del Toro y Fausto Vega, Escuadrón 201",
    lat: 19.366717475896614,
    lng: -99.10978517343752,
    source: "Secretaría de Turismo CDMX",
  },
  {
    id: "meyehualco",
    name: "Utopía Meyehualco",
    borough: "Iztapalapa",
    address: "Av. Genaro Estrada, Deportivo Santa Cruz Meyehualco",
    lat: 19.346012276861153,
    lng: -99.04914071045413,
    source: "Secretaría de Turismo CDMX",
  },
  {
    id: "quetzalcoatl",
    name: "Utopía Quetzalcóatl",
    borough: "Iztapalapa",
    address: "Manuel Cañas 2864, Desarrollo Urbano Quetzalcóatl",
    lat: 19.327000915070723,
    lng: -99.04330804977381,
    source: "Secretaría de Turismo CDMX",
  },
  {
    id: "tecoloxtitlan",
    name: "Utopía Tecoloxtitlán · OIHFRA",
    borough: "Iztapalapa",
    address: "Av. Colima y Culiacán, San Sebastián Tecoloxtitlán",
    lat: 19.361741202481927,
    lng: -99.02046248045951,
    source: "Secretaría de Turismo CDMX",
  },
  {
    id: "cascada",
    name: "Utopía La Cascada Xicoténcatl",
    borough: "Iztapalapa",
    address: "Calle Enna, Santa Martha Acatitla Norte",
    lat: 19.38193815031955,
    lng: -99.02516178105387,
    source: "Secretaría de Turismo CDMX",
  },
  {
    id: "teotongo",
    name: "Utopía Teotongo",
    borough: "Iztapalapa",
    address: "Dr. Fernando Villegas, San Miguel Teotongo",
    lat: 19.35555573764476,
    lng: -98.99341350067418,
    source: "Secretaría de Turismo CDMX",
  },
  {
    id: "olini",
    name: "Utopía Olini",
    borough: "Iztapalapa",
    address: "Calz. Ignacio Zaragoza 1715, Deportivo Francisco I. Madero",
    lat: 19.3810089113878,
    lng: -99.04376715709475,
    source: "Secretaría de Turismo CDMX",
  },
  {
    id: "papalotl",
    name: "Utopía Papálotl",
    borough: "Iztapalapa",
    address: "Reforma Económica 52, Reforma Política",
    lat: 19.343143021318117,
    lng: -99.03164899319053,
    source: "Secretaría de Turismo CDMX",
  },
  {
    id: "tezontli",
    name: "Utopía Tezontli",
    borough: "Iztapalapa",
    address: "Av. José Clemente Orozco y Av. de las Torres, Barrio San Antonio",
    lat: 19.309968045948285,
    lng: -99.07357297828533,
    source: "Secretaría de Turismo CDMX",
  },
  {
    id: "atzintli",
    name: "Utopía Atzintli",
    borough: "Iztapalapa",
    address: "Av. Ermita Iztapalapa s/n, La Quebradora, Xalpa",
    lat: 19.344977540738395,
    lng: -99.01934833088539,
    source: "Secretaría de Turismo CDMX",
  },
  {
    id: "mixiuhca",
    name: "Utopía Mixiuhca",
    borough: "Iztacalco",
    address: "Viad. Río de la Piedad 6, Granjas México",
    lat: 19.40710470603089,
    lng: -99.08803451956051,
    source: "Gobierno de la Ciudad de México",
    note: "Inaugurada en marzo de 2026",
  },
  {
    id: "ceylan",
    name: "Utopía Ceylán",
    borough: "Azcapotzalco",
    address: "Norte 45, Blvd. Ferrocarriles y Av. Ceylán",
    lat: 19.478032189333103,
    lng: -99.1627656354634,
    source: "Gobierno de la Ciudad de México",
    note: "Inaugurada en abril de 2026",
  },
  {
    id: "heroica",
    name: "Utopía La Heroica · Eduardo Molina",
    borough: "Venustiano Carranza",
    address: "Av. Ing. Eduardo Molina y Pelícano, colonia 20 de Noviembre",
    lat: 19.443870214558878,
    lng: -99.112085039121,
    source: "Gobierno de la Ciudad de México",
    note: "Inaugurada en mayo de 2026",
  },
  {
    id: "tlallipan",
    name: "Jardín Flotante Tlallipan",
    borough: "Cuauhtémoc",
    address: "Calz. de Tlalpan, tramo Metro Pino Suárez–Chabacano",
    lat: 19.4175,
    lng: -99.1358,
    source: "Gobierno de la Ciudad de México",
    note: "Utopía elevada · acceso central representativo",
  },
  {
    id: "cen-tlalli",
    name: "Utopía Cen Tlalli Ocotepec",
    borough: "La Magdalena Contreras",
    address: "Calle Las Cruces s/n, Ampliación Lomas de San Bernabé",
    lat: 19.3185918,
    lng: -99.2558362,
    source: "Gobierno de la Ciudad de México",
    note: "Inaugurada en junio de 2026",
  },
  {
    id: "centli-topilejo",
    name: "UTOPÍA Centli Topilejo",
    borough: "Tlalpan",
    address: "Colorines 255, San Miguel Topilejo, C.P. 14500",
    lat: 19.1954972,
    lng: -99.1437935,
    source: "Gobierno de la Ciudad de México",
    note: "UTOPÍA del Maíz · apertura anunciada para el 26 de julio de 2026",
  },
];

const MODE_OPTIONS: {
  id: TravelMode;
  label: string;
  shortLabel: string;
  icon: typeof Footprints;
}[] = [
  { id: "walking", label: "Caminando", shortLabel: "A pie", icon: Footprints },
  { id: "driving", label: "En vehículo", shortLabel: "Auto", icon: Car },
  { id: "transit", label: "Transporte público", shortLabel: "Transporte", icon: Bus },
];

const CATEGORIES: Record<Category["key"], Category> = {
  "very-near": {
    key: "very-near",
    label: "Muy cercano",
    shortLabel: "< 2 km",
    color: "#1e9d5a",
  },
  near: {
    key: "near",
    label: "Cercano",
    shortLabel: "2–5 km",
    color: "#f2c230",
  },
  far: {
    key: "far",
    label: "Lejano",
    shortLabel: "5–10 km",
    color: "#ef7d22",
  },
  outside: {
    key: "outside",
    label: "Fuera de cobertura",
    shortLabel: "> 10 km",
    color: "#8b8b95",
  },
};

const haversineDistance = (a: UserLocation, b: UserLocation) => {
  const radius = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const value =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * radius * Math.asin(Math.sqrt(value));
};

const getCategory = (distance: number): Category => {
  if (distance < 2) return CATEGORIES["very-near"];
  if (distance < 5) return CATEGORIES.near;
  if (distance <= 10) return CATEGORIES.far;
  return CATEGORIES.outside;
};

const formatDistance = (distance: number) =>
  distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`;

export default function Home() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const leafletRef = useRef<LeafletModule | null>(null);
  const markersLayerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const locationLayerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const routeLayerRef = useRef<import("leaflet").Polyline | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [locationMessage, setLocationMessage] = useState("");
  const [mode, setMode] = useState<TravelMode>("walking");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [routeStatus, setRouteStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);

  const selectedUtopia = useMemo(
    () => UTOPIAS.find((item) => item.id === selectedId) ?? null,
    [selectedId],
  );

  const getDistanceFor = useCallback(
    (utopia: Utopia) => {
      if (routeInfo?.utopiaId === utopia.id) return routeInfo.distanceKm;
      if (!userLocation) return null;
      return haversineDistance(userLocation, utopia);
    },
    [routeInfo, userLocation],
  );

  const filteredUtopias = useMemo(() => {
    const normalized = searchTerm.trim().toLocaleLowerCase("es-MX");
    return UTOPIAS.filter((utopia) => {
      const matchesSearch =
        !normalized ||
        `${utopia.name} ${utopia.borough} ${utopia.address}`
          .toLocaleLowerCase("es-MX")
          .includes(normalized);
      const distance = userLocation
        ? haversineDistance(userLocation, utopia)
        : null;
      const matchesRadius = !userLocation || showAll || (distance ?? 99) <= 10;
      return matchesSearch && matchesRadius;
    }).sort((a, b) => {
      if (!userLocation) return a.name.localeCompare(b.name, "es");
      return (
        haversineDistance(userLocation, a) -
        haversineDistance(userLocation, b)
      );
    });
  }, [searchTerm, showAll, userLocation]);

  useEffect(() => {
    let cancelled = false;
    const initializeMap = async () => {
      if (!mapContainerRef.current || mapRef.current) return;
      const L = await import("leaflet");
      if (cancelled || !mapContainerRef.current) return;

      leafletRef.current = L;
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: true,
      }).setView([19.395, -99.085], 11);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap",
      }).addTo(map);
      markersLayerRef.current = L.layerGroup().addTo(map);
      locationLayerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      setMapReady(true);
      window.setTimeout(() => map.invalidateSize(), 100);
    };

    void initializeMap();
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !leafletRef.current || !markersLayerRef.current) return;
    const L = leafletRef.current;
    markersLayerRef.current.clearLayers();

    filteredUtopias.forEach((utopia) => {
      const distance = getDistanceFor(utopia);
      const category = distance === null ? null : getCategory(distance);
      const isSelected = utopia.id === selectedId;
      const icon = L.divIcon({
        className: "utopia-marker-shell",
        html: `<span class="utopia-marker ${isSelected ? "is-selected" : ""}" style="--marker-ring:${category?.color ?? "#722f8b"}"><span>U</span></span>`,
        iconSize: [38, 44],
        iconAnchor: [19, 43],
      });
      const marker = L.marker([utopia.lat, utopia.lng], { icon })
        .bindTooltip(utopia.name, {
          direction: "top",
          offset: [0, -34],
          className: "utopia-tooltip",
        })
        .on("click", () => {
          setSelectedId(utopia.id);
          setRouteStatus("idle");
        });
      marker.addTo(markersLayerRef.current);
    });
  }, [filteredUtopias, getDistanceFor, mapReady, selectedId]);

  useEffect(() => {
    if (!mapReady || !leafletRef.current || !locationLayerRef.current) return;
    const L = leafletRef.current;
    locationLayerRef.current.clearLayers();
    if (!userLocation) return;

    const userIcon = L.divIcon({
      className: "user-marker-shell",
      html: '<span class="user-marker"><span></span></span>',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
    L.circle([userLocation.lat, userLocation.lng], {
      radius: 140,
      color: "#6e2b83",
      fillColor: "#b277c7",
      fillOpacity: 0.12,
      weight: 1,
    }).addTo(locationLayerRef.current);
    L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
      .bindTooltip("Tu ubicación", {
        direction: "top",
        className: "utopia-tooltip",
      })
      .addTo(locationLayerRef.current);
  }, [mapReady, userLocation]);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus("error");
      setLocationMessage("Tu navegador no permite usar la geolocalización.");
      return;
    }

    setLocationStatus("loading");
    setLocationMessage("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(location);
        setLocationStatus("ready");
        setShowAll(false);
        setRouteInfo(null);
        setRouteStatus("idle");
        mapRef.current?.flyTo([location.lat, location.lng], 13, {
          duration: 1.1,
        });
      },
      (error) => {
        setLocationStatus("error");
        setLocationMessage(
          error.code === 1
            ? "Activa el permiso de ubicación en tu navegador para calcular las rutas."
            : "No pudimos obtener tu ubicación. Inténtalo de nuevo.",
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }, []);

  const focusUtopia = (utopia: Utopia) => {
    setSelectedId(utopia.id);
    setRouteStatus("idle");
    mapRef.current?.flyTo([utopia.lat, utopia.lng], 15, { duration: 0.8 });
  };

  const clearRoute = useCallback(() => {
    if (routeLayerRef.current && mapRef.current) {
      mapRef.current.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
    setRouteInfo(null);
    setRouteStatus("idle");
  }, []);

  const calculateRoute = async (utopia: Utopia) => {
    if (!userLocation) {
      requestLocation();
      return;
    }

    setSelectedId(utopia.id);
    clearRoute();

    if (mode === "transit") {
      const url = new URL("https://www.google.com/maps/dir/");
      url.searchParams.set("api", "1");
      url.searchParams.set(
        "origin",
        `${userLocation.lat},${userLocation.lng}`,
      );
      url.searchParams.set("destination", `${utopia.lat},${utopia.lng}`);
      url.searchParams.set("travelmode", "transit");
      url.searchParams.set("dir_action", "navigate");
      window.open(url.toString(), "_blank", "noopener,noreferrer");
      return;
    }

    setRouteStatus("loading");
    const straightDistance = haversineDistance(userLocation, utopia);
    try {
      const baseUrl =
        mode === "walking"
          ? "https://routing.openstreetmap.de/routed-foot/route/v1/driving"
          : "https://router.project-osrm.org/route/v1/driving";
      const coordinates = `${userLocation.lng},${userLocation.lat};${utopia.lng},${utopia.lat}`;
      const response = await fetch(
        `${baseUrl}/${coordinates}?overview=full&geometries=geojson&steps=false`,
      );
      if (!response.ok) throw new Error("Route service unavailable");
      const data = await response.json();
      const route = data.routes?.[0];
      if (!route) throw new Error("No route");

      const distanceKm = route.distance / 1000;
      const category = getCategory(distanceKm);
      const points = route.geometry.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng],
      );
      const L = leafletRef.current;
      routeLayerRef.current = L.polyline(points, {
        color: category.color,
        weight: 7,
        opacity: 0.92,
        lineJoin: "round",
        lineCap: "round",
      }).addTo(mapRef.current);
      mapRef.current.fitBounds(routeLayerRef.current.getBounds(), {
        padding: [48, 48],
      });
      setRouteInfo({
        utopiaId: utopia.id,
        distanceKm,
        durationMinutes: Math.max(1, Math.round(route.duration / 60)),
        estimated: false,
      });
      setRouteStatus("ready");
    } catch {
      const distanceKm =
        mode === "walking" ? straightDistance * 1.25 : straightDistance * 1.18;
      const speed = mode === "walking" ? 4.5 : 24;
      const category = getCategory(distanceKm);
      const L = leafletRef.current;
      routeLayerRef.current = L.polyline(
        [
          [userLocation.lat, userLocation.lng],
          [utopia.lat, utopia.lng],
        ],
        {
          color: category.color,
          weight: 6,
          opacity: 0.8,
          dashArray: "10 10",
        },
      ).addTo(mapRef.current);
      mapRef.current.fitBounds(routeLayerRef.current.getBounds(), {
        padding: [48, 48],
      });
      setRouteInfo({
        utopiaId: utopia.id,
        distanceKm,
        durationMinutes: Math.max(1, Math.round((distanceKm / speed) * 60)),
        estimated: true,
      });
      setRouteStatus("error");
    }
  };

  const activeMode = MODE_OPTIONS.find((option) => option.id === mode)!;
  const ActiveModeIcon = activeMode.icon;
  const selectedDistance = selectedUtopia
    ? getDistanceFor(selectedUtopia)
    : null;
  const selectedCategory =
    selectedDistance === null ? null : getCategory(selectedDistance);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">
            <span className="brand-u">U</span>
            <span className="brand-star">✦</span>
          </div>
          <div>
            <p className="eyebrow">UTOPÍAS · CIUDAD DE MÉXICO</p>
            <h1>Encuentra tu UTOPÍA más cercana</h1>
          </div>
        </div>
        <div className="topbar-meta">
          <div
            className="government-lockup"
            aria-label="Gobierno de la Ciudad de México, Capital de la Transformación"
          >
            <div className="cdmx-symbol" aria-hidden="true">
              <span>CD</span>
              <span>MX</span>
            </div>
            <span className="government-divider" aria-hidden="true" />
            <div className="government-wordmark">
              <strong>CIUDAD DE MÉXICO</strong>
              <span>CAPITAL DE LA TRANSFORMACIÓN</span>
            </div>
          </div>
          <span className="updated-badge">
            <Sparkles size={15} /> {UTOPIAS.length} sedes
          </span>
        </div>
      </header>

      <div className="workspace">
        <aside className="sidebar">
          <div className="sidebar-intro">
            <p>
              Descubre espacios gratuitos de deporte, cultura, cuidados y
              comunidad.
            </p>
            <button
              className={`location-button ${locationStatus === "ready" ? "is-ready" : ""}`}
              onClick={requestLocation}
              disabled={locationStatus === "loading"}
            >
              <LocateFixed size={20} />
              <span>
                {locationStatus === "loading"
                  ? "Obteniendo ubicación…"
                  : locationStatus === "ready"
                    ? "Ubicación actualizada"
                    : "Usar mi ubicación"}
              </span>
            </button>
            {locationMessage && (
              <div className="location-error" role="alert">
                <span>{locationMessage}</span>
                <button
                  aria-label="Cerrar mensaje"
                  onClick={() => setLocationMessage("")}
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          <div className="controls-block">
            <div className="search-field">
              <Search size={18} />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar UTOPÍA o alcaldía"
                aria-label="Buscar UTOPÍA o alcaldía"
              />
              {searchTerm && (
                <button
                  aria-label="Limpiar búsqueda"
                  onClick={() => setSearchTerm("")}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <fieldset className="mode-fieldset">
              <legend>¿Cómo quieres llegar?</legend>
              <div className="mode-selector">
                {MODE_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.id}
                      className={mode === option.id ? "is-active" : ""}
                      onClick={() => {
                        setMode(option.id);
                        clearRoute();
                      }}
                      aria-pressed={mode === option.id}
                    >
                      <Icon size={18} />
                      <span>{option.shortLabel}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="legend" aria-label="Simbología de cercanía">
              {Object.values(CATEGORIES)
                .slice(0, 3)
                .map((category) => (
                  <span key={category.key}>
                    <i style={{ backgroundColor: category.color }} />
                    <b>{category.label}</b> {category.shortLabel}
                  </span>
                ))}
            </div>
          </div>

          <div className="results-heading">
            <div>
              <h2>
                {userLocation ? "UTOPÍAS cercanas" : "Todas las UTOPÍAS"}
              </h2>
              <p>
                {filteredUtopias.length}{" "}
                {filteredUtopias.length === 1 ? "resultado" : "resultados"}
              </p>
            </div>
            {userLocation && (
              <button
                className="scope-toggle"
                onClick={() => setShowAll((current) => !current)}
              >
                {showAll ? "Hasta 10 km" : "Ver todas"}
              </button>
            )}
          </div>

          <div className="results-list">
            {filteredUtopias.length === 0 ? (
              <div className="empty-state">
                <MapPin size={26} />
                <h3>No encontramos sedes</h3>
                <p>
                  Cambia la búsqueda o selecciona “Ver todas” para consultar las
                  {UTOPIAS.length} UTOPÍAS.
                </p>
              </div>
            ) : (
              filteredUtopias.map((utopia) => {
                const distance = getDistanceFor(utopia);
                const category =
                  distance === null ? null : getCategory(distance);
                const isSelected = selectedId === utopia.id;
                const isActiveRoute = routeInfo?.utopiaId === utopia.id;
                return (
                  <article
                    key={utopia.id}
                    className={`result-card ${isSelected ? "is-selected" : ""}`}
                    style={
                      {
                        "--category-color": category?.color ?? "#7f3b93",
                      } as React.CSSProperties
                    }
                    onClick={() => focusUtopia(utopia)}
                  >
                    <div className="card-topline">
                      <span className="borough-pill">{utopia.borough}</span>
                      {category && (
                        <span className="category-pill">
                          <i />
                          {category.label}
                        </span>
                      )}
                    </div>
                    <h3>{utopia.name}</h3>
                    <p className="address">
                      <MapPin size={15} />
                      <span>{utopia.address}</span>
                    </p>
                    <div className="card-footer">
                      <div className="distance-copy">
                        {distance === null ? (
                          <span>Selecciona tu ubicación</span>
                        ) : (
                          <>
                            <strong>{formatDistance(distance)}</strong>
                            <span>
                              {isActiveRoute
                                ? `${routeInfo.durationMinutes} min · ${activeMode.shortLabel}`
                                : "distancia aproximada"}
                            </span>
                          </>
                        )}
                      </div>
                      <button
                        className="route-button"
                        disabled={
                          routeStatus === "loading" && selectedId === utopia.id
                        }
                        onClick={(event) => {
                          event.stopPropagation();
                          void calculateRoute(utopia);
                        }}
                      >
                        {routeStatus === "loading" &&
                        selectedId === utopia.id ? (
                          <span className="button-spinner" />
                        ) : (
                          <ActiveModeIcon size={17} />
                        )}
                        {mode === "transit"
                          ? "Abrir ruta"
                          : userLocation
                            ? "Trazar ruta"
                            : "Cómo llegar"}
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>

          <div className="privacy-note">
            <ShieldCheck size={17} />
            <span>
              Tu ubicación se usa sólo durante la consulta y no se almacena.
            </span>
          </div>
        </aside>

        <section className="map-panel" aria-label="Mapa de UTOPÍAS de la CDMX">
          <div ref={mapContainerRef} className="map-container" />

          <div className="map-summary">
            <div className="map-summary-icon">
              <Navigation size={18} />
            </div>
            <div>
              <strong>
                {userLocation
                  ? `${filteredUtopias.length} UTOPÍAS en tu consulta`
                  : "Activa tu ubicación para comenzar"}
              </strong>
              <span>
                {userLocation
                  ? showAll
                    ? "Mostrando todas las sedes"
                    : "Mostrando sedes hasta 10 km"
                  : "Calcularemos distancia y ruta sin guardar tus datos"}
              </span>
            </div>
          </div>

          <div className="map-legend">
            {Object.values(CATEGORIES)
              .slice(0, 3)
              .map((category) => (
                <span key={category.key}>
                  <i style={{ background: category.color }} />
                  {category.shortLabel}
                </span>
              ))}
          </div>

          {selectedUtopia && (
            <div className="selected-drawer">
              <button
                className="drawer-close"
                aria-label="Cerrar detalle"
                onClick={() => {
                  setSelectedId(null);
                  clearRoute();
                }}
              >
                <X size={18} />
              </button>
              <div
                className="drawer-accent"
                style={{
                  background: selectedCategory?.color ?? "#7f3b93",
                }}
              />
              <div className="drawer-copy">
                <span>{selectedUtopia.borough}</span>
                <strong>{selectedUtopia.name}</strong>
                {routeInfo?.utopiaId === selectedUtopia.id && (
                  <small>
                    {formatDistance(routeInfo.distanceKm)} ·{" "}
                    {routeInfo.durationMinutes} min
                    {routeInfo.estimated ? " · estimado" : ""}
                  </small>
                )}
                {routeStatus === "error" &&
                  routeInfo?.utopiaId === selectedUtopia.id && (
                    <em>
                      El servicio de ruta no respondió; mostramos una estimación
                      directa.
                    </em>
                  )}
              </div>
              <button
                className="drawer-route"
                onClick={() => void calculateRoute(selectedUtopia)}
                disabled={routeStatus === "loading"}
              >
                <ActiveModeIcon size={18} />
                {mode === "transit" ? "Abrir en Maps" : "Calcular ruta"}
                <ChevronRight size={17} />
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
