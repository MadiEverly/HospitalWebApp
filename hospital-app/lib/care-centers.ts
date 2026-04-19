import type { CareCenter } from "@/lib/types/care-center";
import { deleteField, type DocumentSnapshot } from "firebase/firestore";

export const CARE_CENTERS_COLLECTION = "careCenters";

/**
 * Firestore care center documents use these keys (among others):
 * - `waitTime` (number, minutes) — also mirrored to `adminWaitTimeOverrides/{id}` on save for iOS
 * - `facilityIssueType` (string)
 */

/** Fields that exist only on adminWaitTimeOverrides, not on careCenters. */
const CARE_CENTER_DOC_OMIT = new Set([
  "waitOverrideReason",
  "waitOverrideUpdatedBy",
]);

/** Remove undefined values so Firestore accepts the document. */
export function toFirestoreData(data: CareCenter): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (CARE_CENTER_DOC_OMIT.has(key)) continue;
    if (value !== undefined) out[key] = value;
  }
  return out;
}

/**
 * Fields for `updateDoc` on a care center so clearing `facilityIssueType`
 * removes the key in Firestore (plain `updateDoc` with undefined omits the field).
 * Also drops legacy `facilityIssue` when setting or clearing the issue.
 */
export function careCenterFirestoreUpdateFields(
  data: CareCenter
): Record<string, unknown> {
  const base = { ...toFirestoreData(data) };
  if (data.facilityIssueType?.trim()) {
    base.facilityIssueType = data.facilityIssueType.trim();
    base.facilityIssue = deleteField();
  } else {
    base.facilityIssueType = deleteField();
    base.facilityIssue = deleteField();
  }
  return base;
}

/** Partial update: only facility issue fields. */
export function facilityIssueFirestorePatch(issue: string | undefined) {
  const trimmed = issue?.trim();
  if (trimmed) {
    return {
      facilityIssueType: trimmed,
      facilityIssue: deleteField(),
    };
  }
  return {
    facilityIssueType: deleteField(),
    facilityIssue: deleteField(),
  };
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
    waitTime:
      typeof data.waitTime === "number"
        ? data.waitTime
        : typeof data.waitTimeMinutes === "number"
          ? data.waitTimeMinutes
          : undefined,
    facilityIssueType:
      typeof data.facilityIssueType === "string" && data.facilityIssueType.trim()
        ? data.facilityIssueType.trim()
        : typeof data.facilityIssue === "string" && data.facilityIssue.trim()
          ? data.facilityIssue.trim()
          : undefined,
  };
}
