import type { CareCenter } from "@/lib/types/care-center";
import type { DocumentSnapshot } from "firebase/firestore";

export const CARE_CENTERS_COLLECTION = "careCenters";

/** Remove undefined values so Firestore accepts the document. */
export function toFirestoreData(data: CareCenter): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) out[key] = value;
  }
  return out;
}

/** Parse a Firestore document snapshot into a CareCenter. */
export function careCenterFromSnapshot(
  snapshot: DocumentSnapshot
): CareCenter | null {
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  return {
    id: snapshot.id,
    name: data.name ?? "",
    streetAddress: data.streetAddress ?? "",
    city: data.city ?? "",
    region: data.region ?? "",
    country: data.country ?? "",
    capabilities: Array.isArray(data.capabilities)
      ? data.capabilities.map((c: { id?: string; name?: string }) => ({
          id: c.id ?? crypto.randomUUID(),
          name: c.name ?? "",
        }))
      : [],
    latitude: typeof data.latitude === "number" ? data.latitude : 0,
    longitude: typeof data.longitude === "number" ? data.longitude : 0,
    type: data.type ?? undefined,
    dailyHours: data.dailyHours ?? undefined,
    phoneNumber: data.phoneNumber ?? undefined,
    email: data.email ?? undefined,
  };
}
