/**
 * Geocode an address using OpenStreetMap Nominatim.
 * Usage policy: https://operations.osmfoundation.org/policies/nominatim/
 * Max 1 request per second; provide a valid User-Agent.
 */

export type GeocodeResult = { latitude: number; longitude: number };

export async function geocodeAddress(params: {
  streetAddress?: string;
  city?: string;
  region?: string;
  country?: string;
}): Promise<GeocodeResult | null> {
  const parts = [
    params.streetAddress,
    params.city,
    params.region,
    params.country,
  ].filter(Boolean);
  if (parts.length === 0) return null;

  const query = parts.join(", ");
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": "HospitalWebApp/1.0 (https://github.com/hospital-web-app)",
    },
  });
  if (!res.ok) return null;

  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;

  const first = data[0];
  const lat = parseFloat(first.lat);
  const lon = parseFloat(first.lon);
  if (Number.isNaN(lat) || Number.isNaN(lon)) return null;

  return { latitude: lat, longitude: lon };
}
