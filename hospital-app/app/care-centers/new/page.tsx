"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  CARE_CENTERS_COLLECTION,
  toFirestoreData,
} from "@/lib/care-centers";
import { syncAdminWaitTimeOverride } from "@/lib/admin-wait-time-overrides";
import CareCenterForm from "@/app/components/CareCenterForm";
import type { CareCenter } from "@/lib/types/care-center";

export default function NewCareCenterPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CareCenter) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = toFirestoreData(data);
      await setDoc(doc(db, CARE_CENTERS_COLLECTION, data.id), payload);
      await syncAdminWaitTimeOverride({
        careCenterID: data.id,
        minutes: data.waitTime,
        reason: data.waitOverrideReason,
        updatedBy: data.waitOverrideUpdatedBy,
      });
      router.push("/care-centers");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to save care center.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <CareCenterForm onSubmit={handleSubmit} disabled={isSubmitting} />
      </div>
    </div>
  );
}
