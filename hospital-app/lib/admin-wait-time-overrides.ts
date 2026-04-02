import {
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

/** Collection the iOS app listens to for manual wait overrides. */
export const ADMIN_WAIT_TIME_OVERRIDES_COLLECTION = "adminWaitTimeOverrides";

/**
 * Upsert or delete the manual wait override for a care center.
 * Document ID must match careCenters/{careCenterID} exactly.
 * - minutes > 0: writes careCenterID, minutes (int), updatedAt (server), optional reason/updatedBy
 * - otherwise: deletes the document (revert to crowdsourced average on iOS)
 */
export async function syncAdminWaitTimeOverride(params: {
  careCenterID: string;
  minutes?: number | null | undefined;
  reason?: string | null | undefined;
  updatedBy?: string | null | undefined;
}): Promise<void> {
  const ref = doc(db, ADMIN_WAIT_TIME_OVERRIDES_COLLECTION, params.careCenterID);
  const raw = params.minutes;
  if (
    raw == null ||
    !Number.isFinite(Number(raw)) ||
    Math.round(Number(raw)) <= 0
  ) {
    await deleteDoc(ref);
    return;
  }

  const minutes = Math.round(Number(raw));
  const payload: Record<string, unknown> = {
    careCenterID: params.careCenterID,
    minutes,
    updatedAt: serverTimestamp(),
  };

  const reason = params.reason?.trim();
  if (reason) payload.reason = reason;

  const updatedBy = params.updatedBy?.trim() || "Hospital web app";
  payload.updatedBy = updatedBy;

  await setDoc(ref, payload);
}

/** Load override fields for the edit form (minutes + optional metadata). */
export async function getAdminWaitTimeOverride(careCenterID: string): Promise<{
  minutes?: number;
  reason?: string;
  updatedBy?: string;
} | null> {
  const snap = await getDoc(
    doc(db, ADMIN_WAIT_TIME_OVERRIDES_COLLECTION, careCenterID)
  );
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    minutes: typeof d.minutes === "number" ? d.minutes : undefined,
    reason: typeof d.reason === "string" ? d.reason : undefined,
    updatedBy: typeof d.updatedBy === "string" ? d.updatedBy : undefined,
  };
}

export async function deleteAdminWaitTimeOverride(
  careCenterID: string
): Promise<void> {
  await deleteDoc(doc(db, ADMIN_WAIT_TIME_OVERRIDES_COLLECTION, careCenterID));
}
