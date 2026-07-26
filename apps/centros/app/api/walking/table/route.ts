import { NextRequest, NextResponse } from "next/server";

type Coordinate = {
  id: string;
  lat: number;
  lng: number;
};

function validCoordinate(value: unknown, kind: "lat" | "lng") {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    (kind === "lat"
      ? value >= -90 && value <= 90
      : value >= -180 && value <= 180)
  );
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | {
        origin?: { lat?: number; lng?: number };
        destinations?: Coordinate[];
      }
    | null;

  const origin = body?.origin;
  const destinations = (body?.destinations ?? []).slice(0, 40);
  if (
    !origin ||
    !validCoordinate(origin.lat, "lat") ||
    !validCoordinate(origin.lng, "lng") ||
    !destinations.length ||
    destinations.some(
      (destination) =>
        !destination.id ||
        !validCoordinate(destination.lat, "lat") ||
        !validCoordinate(destination.lng, "lng"),
    )
  ) {
    return NextResponse.json(
      { error: "Coordenadas inválidas" },
      { status: 400 },
    );
  }

  const coordinates = [
    `${origin.lng},${origin.lat}`,
    ...destinations.map(
      (destination) => `${destination.lng},${destination.lat}`,
    ),
  ].join(";");
  const destinationIndexes = destinations
    .map((_, index) => String(index + 1))
    .join(";");
  const endpoint =
    "https://routing.openstreetmap.de/routed-foot/table/v1/driving/" +
    `${coordinates}?annotations=distance,duration&sources=0&destinations=${destinationIndexes}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(endpoint, {
      headers: {
        "User-Agent": "TuCentroCercano-CDMX-Prototype/1.0",
      },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Routing table ${response.status}`);

    const payload = (await response.json()) as {
      distances?: Array<Array<number | null>>;
      durations?: Array<Array<number | null>>;
    };
    const distances = payload.distances?.[0] ?? [];
    const durations = payload.durations?.[0] ?? [];

    const metrics = Object.fromEntries(
      destinations.flatMap((destination, index) => {
        const distance = distances[index];
        const duration = durations[index];
        if (distance === null || duration === null) return [];
        return [
          [
            destination.id,
            {
              distanceKm: distance / 1000,
              durationMinutes: Math.max(1, Math.round(duration / 60)),
            },
          ],
        ];
      }),
    );

    return NextResponse.json(
      { metrics, provider: "FOSSGIS OSRM / OpenStreetMap" },
      {
        headers: {
          "Cache-Control": "private, max-age=300",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "No fue posible calcular las distancias peatonales." },
      { status: 502 },
    );
  } finally {
    clearTimeout(timeout);
  }
}
