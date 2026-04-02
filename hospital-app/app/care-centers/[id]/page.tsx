"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  CARE_CENTERS_COLLECTION,
  toFirestoreData,
  careCenterFromSnapshot,
} from "@/lib/care-centers";
import {
  syncAdminWaitTimeOverride,
  getAdminWaitTimeOverride,
  deleteAdminWaitTimeOverride,
} from "@/lib/admin-wait-time-overrides";
import CareCenterForm from "@/app/components/CareCenterForm";
import type { CareCenter } from "@/lib/types/care-center";
import { formatDurationMinutes } from "@/lib/duration";

export default function CareCenterEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : null;

  const [careCenter, setCareCenter] = useState<CareCenter | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    async function fetchCareCenter(docId: string) {
      setLoading(true);
      setError(null);
      try {
        const snapshot = await getDoc(doc(db, CARE_CENTERS_COLLECTION, docId));
        const data = careCenterFromSnapshot(snapshot);
        if (data) {
          try {
            const override = await getAdminWaitTimeOverride(docId);
            if (override) {
              if (
                override.minutes != null &&
                override.minutes > 0 &&
                Number.isFinite(override.minutes)
              ) {
                data.waitTime = override.minutes;
              }
              if (override.reason != null) {
                data.waitOverrideReason = override.reason;
              }
              if (override.updatedBy != null) {
                data.waitOverrideUpdatedBy = override.updatedBy;
              }
            }
          } catch {
            // Still show the care center if override read fails (e.g. rules not deployed).
          }
          setCareCenter(data);
        } else {
          setNotFound(true);
        }
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Failed to load care center."
        );
      } finally {
        setLoading(false);
      }
    }
    fetchCareCenter(id);
  }, [id]);

  const handleSubmit = async (data: CareCenter) => {
    if (!id) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = toFirestoreData(data);
      await updateDoc(doc(db, CARE_CENTERS_COLLECTION, id), payload);
      await syncAdminWaitTimeOverride({
        careCenterID: id,
        minutes: data.waitTime,
        reason: data.waitOverrideReason,
        updatedBy: data.waitOverrideUpdatedBy,
      });
      router.push("/care-centers");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to save care center."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm("Delete this care center? This cannot be undone.")) return;
    setIsDeleting(true);
    setError(null);
    try {
      await deleteAdminWaitTimeOverride(id);
      await deleteDoc(doc(db, CARE_CENTERS_COLLECTION, id));
      router.push("/care-centers");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to delete care center."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 py-12 dark:bg-zinc-950">
        <div className="mx-auto max-w-2xl px-4">
          <p className="text-zinc-500 dark:text-zinc-400">
            Loading care center…
          </p>
        </div>
      </div>
    );
  }

  if (notFound || !careCenter) {
    return (
      <div className="min-h-screen bg-zinc-50 py-12 dark:bg-zinc-950">
        <div className="mx-auto max-w-2xl px-4">
          <Link
            href="/care-centers"
            className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m12 19-7-7 7-7" />
            </svg>
            Back to Care Centers
          </Link>
          <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Care center not found
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              It may have been deleted or the link is invalid.
            </p>
            <Link
              href="/care-centers"
              className="mt-4 inline-block text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-100"
            >
              View all care centers
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-12 dark:bg-zinc-950">
      <div className="mx-auto max-w-2xl px-4">
        <Link
          href="/care-centers"
          className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m12 19-7-7 7-7" />
          </svg>
          Back to Care Centers
        </Link>

        {error && (
          <div
            className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200"
            role="alert"
          >
            {error}
          </div>
        )}

        {(formatDurationMinutes(careCenter.waitTime) ||
          (careCenter.facilityIssueType?.trim() ?? "")) && (
          <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Wait & facility status
            </h2>
            <dl className="mt-3 space-y-2 text-sm">
              {formatDurationMinutes(careCenter.waitTime) && (
                <div className="flex flex-wrap gap-2">
                  <dt className="font-medium text-zinc-700 dark:text-zinc-300">
                    Typical wait time
                  </dt>
                  <dd className="text-zinc-900 dark:text-zinc-100">
                    {formatDurationMinutes(careCenter.waitTime)}
                  </dd>
                </div>
              )}
              {careCenter.facilityIssueType?.trim() && (
                <div className="flex flex-wrap gap-2">
                  <dt className="font-medium text-zinc-700 dark:text-zinc-300">
                    Facility issue
                  </dt>
                  <dd className="text-zinc-900 dark:text-zinc-100">
                    {careCenter.facilityIssueType.trim()}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}

        <CareCenterForm
          key={careCenter.id}
          initialData={careCenter}
          onSubmit={handleSubmit}
          disabled={isSubmitting}
        />

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            {isDeleting ? "Deleting…" : "Delete care center"}
          </button>
        </div>
      </div>
    </div>
  );
}
