import { NextResponse } from "next/server";

type CenterType = "pilares" | "biblioteca";

type NormalizedCenter = {
  id: string;
  name: string;
  type: CenterType;
  address: string;
  borough: string;
  lat: number;
  lng: number;
};

const PILARES_WFS =
  "https://sieg.cdmx.gob.mx/geoserver/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=geonode%3Apilares_sectei_2023&outputFormat=application%2Fjson&srsName=EPSG%3A4326";

const LIBRARIES_CSV =
  "https://www.datos.gob.mx/dataset/10d327a6-172a-4041-87e3-5107e54c4f12/resource/a4299aa9-40e5-41f0-bc9f-bd9461a3a03d/download/bibliotecas.csv";

function textValue(
  record: Record<string, unknown>,
  candidates: string[],
): string {
  const normalized = new Map(
    Object.entries(record).map(([key, value]) => [
      key
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, ""),
      value,
    ]),
  );

  for (const candidate of candidates) {
    const key = candidate
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    const value = normalized.get(key);
    if (value !== null && value !== undefined && String(value).trim()) {
      return String(value).trim();
    }
  }
  return "";
}

function numberValue(
  record: Record<string, unknown>,
  candidates: string[],
): number | null {
  const value = textValue(record, candidates)
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function inCdmx(lat: number, lng: number) {
  return lat >= 19.0 && lat <= 19.65 && lng >= -99.4 && lng <= -98.85;
}

function parseCsv(csv: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];
    const next = csv[index + 1];

    if (character === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  const headers = rows.shift()?.map((header) => header.trim()) ?? [];
  return rows.map((values) =>
    Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? ""]),
    ),
  );
}

async function fetchPilares(signal: AbortSignal): Promise<NormalizedCenter[]> {
  const response = await fetch(PILARES_WFS, {
    headers: {
      "User-Agent": "TuCentroCercano-CDMX-Prototype/1.0",
    },
    signal,
  });
  if (!response.ok) throw new Error(`PILARES ${response.status}`);

  const payload = (await response.json()) as {
    features?: Array<{
      id?: string;
      geometry?: { coordinates?: [number, number] };
      properties?: Record<string, unknown>;
    }>;
  };

  return (payload.features ?? [])
    .map((feature, index): NormalizedCenter | null => {
      const properties = feature.properties ?? {};
      const coordinates = feature.geometry?.coordinates;
      const lat =
        numberValue(properties, ["latitud", "lat", "coordenada y"]) ??
        coordinates?.[1] ??
        null;
      const lng =
        numberValue(properties, ["longitud", "lon", "lng", "coordenada x"]) ??
        coordinates?.[0] ??
        null;

      if (lat === null || lng === null || !inCdmx(lat, lng)) return null;

      const name =
        textValue(properties, [
          "nombre",
          "nombre pilar",
          "pilares",
          "nom sede",
          "sede",
        ]) || `PILARES ${index + 1}`;
      const borough =
        textValue(properties, ["alcaldia", "municipio", "demarcacion"]) ||
        "Ciudad de México";
      const address =
        textValue(properties, [
          "direccion",
          "domicilio",
          "ubicacion",
          "calle",
          "colonia",
        ]) || borough;
      const sourceId =
        textValue(properties, ["clave id", "clave", "id"]) ||
        feature.id ||
        `${lat}-${lng}`;

      return {
        id: `pilares-${sourceId}`,
        name: name.toUpperCase().startsWith("PILARES")
          ? name
          : `PILARES ${name}`,
        type: "pilares",
        address,
        borough,
        lat,
        lng,
      };
    })
    .filter((center): center is NormalizedCenter => Boolean(center));
}

async function fetchLibraries(
  signal: AbortSignal,
): Promise<NormalizedCenter[]> {
  const response = await fetch(LIBRARIES_CSV, {
    headers: {
      "User-Agent": "TuCentroCercano-CDMX-Prototype/1.0",
    },
    signal,
  });
  if (!response.ok) throw new Error(`Bibliotecas ${response.status}`);

  const records = parseCsv(await response.text());
  return records
    .map((record, index): NormalizedCenter | null => {
      const lat = numberValue(record, [
        "latitud",
        "lat",
        "latitud dec",
        "latitud decimal",
      ]);
      const lng = numberValue(record, [
        "longitud",
        "lon",
        "lng",
        "longitud dec",
        "longitud decimal",
      ]);
      if (lat === null || lng === null || !inCdmx(lat, lng)) return null;

      const state = textValue(record, [
        "estado",
        "entidad",
        "nom entidad",
        "estado nombre",
      ]);
      if (
        state &&
        !/ciudad de mexico|cdmx|distrito federal/i.test(
          state
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase(),
        )
      ) {
        return null;
      }

      const name =
        textValue(record, [
          "nombre",
          "nom centro",
          "nombre biblioteca",
          "equipamiento nombre",
        ]) || `Biblioteca ${index + 1}`;
      const borough =
        textValue(record, [
          "municipio",
          "alcaldia",
          "nom municipio",
          "delegacion",
        ]) || "Ciudad de México";
      const addressParts = [
        textValue(record, [
          "domicilio",
          "direccion",
          "calle numero",
          "calle",
        ]),
        textValue(record, ["colonia"]),
      ].filter(Boolean);
      const sourceId =
        textValue(record, ["id", "clave", "biblioteca id"]) ||
        `${lat}-${lng}`;

      return {
        id: `biblioteca-${sourceId}`,
        name: name.toLowerCase().startsWith("biblioteca")
          ? name
          : `Biblioteca ${name}`,
        type: "biblioteca",
        address: addressParts.join(", ") || borough,
        borough,
        lat,
        lng,
      };
    })
    .filter((center): center is NormalizedCenter => Boolean(center));
}

export async function GET() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const settled = await Promise.allSettled([
      fetchPilares(controller.signal),
      fetchLibraries(controller.signal),
    ]);
    const centers = settled.flatMap((result) =>
      result.status === "fulfilled" ? result.value : [],
    );

    const unique = Array.from(
      new Map(
        centers.map((center) => [
          `${center.type}-${center.lat.toFixed(5)}-${center.lng.toFixed(5)}`,
          center,
        ]),
      ).values(),
    );

    return NextResponse.json(
      {
        centers: unique,
        source: unique.length >= 10 ? "official" : "unavailable",
        counts: {
          pilares: unique.filter((center) => center.type === "pilares").length,
          bibliotecas: unique.filter((center) => center.type === "biblioteca")
            .length,
        },
      },
      {
        headers: {
          "Cache-Control": "public, max-age=900, s-maxage=3600",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { centers: [], source: "unavailable" },
      { status: 200 },
    );
  } finally {
    clearTimeout(timeout);
  }
}
