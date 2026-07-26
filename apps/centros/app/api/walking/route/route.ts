import { NextRequest, NextResponse } from "next/server";

function coordinate(value: string | null, kind: "lat" | "lng") {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  if (kind === "lat" && (parsed < -90 || parsed > 90)) return null;
  if (kind === "lng" && (parsed < -180 || parsed > 180)) return null;
  return parsed;
}

export async function GET(request: NextRequest) {
  const requestedMode = request.nextUrl.searchParams.get("mode");
  const mode = requestedMode === "driving" ? "driving" : "walking";
  const originLat = coordinate(request.nextUrl.searchParams.get("originLat"), "lat");
  const originLng = coordinate(request.nextUrl.searchParams.get("originLng"), "lng");
  const destinationLat = coordinate(
    request.nextUrl.searchParams.get("destinationLat"),
    "lat",
  );
  const destinationLng = coordinate(
    request.nextUrl.searchParams.get("destinationLng"),
    "lng",
  );

  if (
    originLat === null ||
    originLng === null ||
    destinationLat === null ||
    destinationLng === null
  ) {
    return NextResponse.json(
      { error: "Coordenadas inválidas" },
      { status: 400 },
    );
  }

  const profile = mode === "driving" ? "routed-car" : "routed-foot";
  const endpoint =
    `https://routing.openstreetmap.de/${profile}/route/v1/driving/` +
    `${originLng},${originLat};${destinationLng},${destinationLat}` +
    "?overview=full&geometries=geojson&steps=false";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(endpoint, {
      headers: {
        "User-Agent": "TuCentroCercano-CDMX-Prototype/1.0",
      },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Routing ${response.status}`);

    const payload = (await response.json()) as {
      routes?: Array<{
        distance: number;
        duration: number;
        geometry?: {
          coordinates?: Array<[number, number]>;
        };
      }>;
    };
    const route = payload.routes?.[0];
    if (!route?.geometry?.coordinates?.length) {
      throw new Error("Ruta sin geometría");
    }

    return NextResponse.json(
      {
        distanceKm: route.distance / 1000,
        durationMinutes: Math.max(1, Math.round(route.duration / 60)),
        coordinates: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
        mode,
        provider: "FOSSGIS OSRM / OpenStreetMap",
      },
      {
        headers: {
          "Cache-Control": "private, max-age=300",
        },
      },
    );
  } catch {
    return NextResponse.json(
      {
        error:
          mode === "driving"
            ? "No fue posible calcular la ruta en vehículo."
            : "No fue posible calcular la ruta peatonal.",
      },
      { status: 502 },
    );
  } finally {
    clearTimeout(timeout);
  }
}
