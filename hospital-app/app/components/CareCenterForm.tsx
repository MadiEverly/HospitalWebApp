"use client";

import { useState, useCallback, useMemo } from "react";
import { Country, State } from "country-state-city";
import type { CareCenter } from "@/lib/types/care-center";
import {
  createCapability,
  createEmptyCareCenter,
  PREDEFINED_CAPABILITIES,
} from "@/lib/types/care-center";
import SearchableSelect, { type SearchableOption } from "@/app/components/SearchableSelect";
import { geocodeAddress } from "@/lib/geocode";

type CareCenterFormProps = {
  initialData?: Partial<CareCenter>;
  onSubmit?: (data: CareCenter) => void;
  disabled?: boolean;
  /**
   * When set, the facility issue field is edited outside this form (e.g. on the
   * care center detail page) but still included when you save the care center.
   */
  facilityIssueDraft?: {
    value: string;
    onChange: (value: string) => void;
  };
};

export default function CareCenterForm({
  initialData,
  onSubmit,
  disabled = false,
  facilityIssueDraft,
}: CareCenterFormProps) {
  const [form, setForm] = useState<CareCenter>(() => {
    const base = createEmptyCareCenter();
    if (initialData) {
      return { ...base, ...initialData };
    }
    return base;
  });

  const update = useCallback(
    <K extends keyof CareCenter>(field: K, value: CareCenter[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const countryOptions: SearchableOption[] = useMemo(
    () =>
      Country.getAllCountries().map((c) => ({
        value: c.name,
        label: c.name,
      })),
    []
  );

  const selectedCountry = useMemo(
    () => Country.getAllCountries().find((c) => c.name === form.country),
    [form.country]
  );

  const regionOptions: SearchableOption[] = useMemo(() => {
    if (!selectedCountry) return [];
    return State.getStatesOfCountry(selectedCountry.isoCode).map((s) => ({
      value: s.name,
      label: s.name,
    }));
  }, [selectedCountry]);

  const setCountry = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, country: value, region: "" }));
  }, []);

  const toggleCapability = useCallback((name: string) => {
    setForm((prev) => {
      const has = prev.capabilities.some((c) => c.name === name);
      if (has) {
        return {
          ...prev,
          capabilities: prev.capabilities.filter((c) => c.name !== name),
        };
      }
      return {
        ...prev,
        capabilities: [...prev.capabilities, createCapability(name)],
      };
    });
  }, []);

  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);

  const canGeocode = Boolean(
    form.streetAddress?.trim() ||
      form.city?.trim() ||
      form.region?.trim() ||
      form.country?.trim()
  );

  const fillCoordinatesFromAddress = useCallback(async () => {
    if (!canGeocode) return;
    setGeocodeLoading(true);
    setGeocodeError(null);
    try {
      const result = await geocodeAddress({
        streetAddress: form.streetAddress?.trim() || undefined,
        city: form.city?.trim() || undefined,
        region: form.region?.trim() || undefined,
        country: form.country?.trim() || undefined,
      });
      if (result) {
        setForm((prev) => ({
          ...prev,
          latitude: result.latitude,
          longitude: result.longitude,
        }));
      } else {
        setGeocodeError("Could not find coordinates for this address.");
      }
    } catch {
      setGeocodeError("Failed to look up address.");
    } finally {
      setGeocodeLoading(false);
    }
  }, [
    canGeocode,
    form.streetAddress,
    form.city,
    form.region,
    form.country,
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const facilityIssueType = facilityIssueDraft
      ? facilityIssueDraft.value.trim() || undefined
      : form.facilityIssueType?.trim() || undefined;
    const payload: CareCenter = {
      ...form,
      type: form.type || undefined,
      dailyHours: form.dailyHours || undefined,
      phoneNumber: form.phoneNumber || undefined,
      email: form.email || undefined,
      waitTime:
        form.waitTime != null && form.waitTime > 0 ? form.waitTime : undefined,
      facilityIssueType,
    };
    onSubmit?.(payload);
  };

  const inputClass =
    "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm transition focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100";
  const labelClass = "mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300";

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-2xl space-y-8 rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
    >
      <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Care Center
      </h2>

      {/* Basic info */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Basic information
        </h3>
        <div>
          <label htmlFor="name" className={labelClass}>
            Name *
          </label>
          <input
            id="name"
            type="text"
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className={inputClass}
            placeholder="Care center name"
          />
        </div>
      </section>

      {/* Address */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Address
        </h3>
        <div>
          <label htmlFor="streetAddress" className={labelClass}>
            Street address *
          </label>
          <input
            id="streetAddress"
            type="text"
            required
            value={form.streetAddress}
            onChange={(e) => update("streetAddress", e.target.value)}
            className={inputClass}
            placeholder="123 Main St"
          />
        </div>
        <div>
          <SearchableSelect
            id="country"
            label="Country"
            value={form.country}
            options={countryOptions}
            onChange={setCountry}
            placeholder="Type to search countries…"
            required
            disabled={disabled}
            inputClass={inputClass}
            labelClass={labelClass}
            emptyMessage="No countries found"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="city" className={labelClass}>
              City *
            </label>
            <input
              id="city"
              type="text"
              required
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              className={inputClass}
              placeholder="City"
            />
          </div>
          <div>
            <SearchableSelect
              id="region"
              label="Region / Province"
              value={form.region}
              options={regionOptions}
              onChange={(v) => update("region", v)}
              placeholder={
                form.country
                  ? "Type to search region…"
                  : "Select a country first"
              }
              required
              disabled={disabled}
              inputClass={inputClass}
              labelClass={labelClass}
              emptyMessage={
                form.country ? "No regions found" : "Select a country first"
              }
            />
          </div>
        </div>
      </section>

      {/* Coordinates */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Location (coordinates)
          </h3>
          <button
            type="button"
            onClick={fillCoordinatesFromAddress}
            disabled={disabled || !canGeocode || geocodeLoading}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            {geocodeLoading ? "Looking up…" : "Fill from address"}
          </button>
        </div>
        {geocodeError && (
          <p className="text-sm text-amber-700 dark:text-amber-400">
            {geocodeError}
          </p>
        )}
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Enter an address above, then use &quot;Fill from address&quot; to fill
          coordinates. You can still edit them below.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="latitude" className={labelClass}>
              Latitude *
            </label>
            <input
              id="latitude"
              type="number"
              required
              step="any"
              value={form.latitude}
              onChange={(e) => update("latitude", parseFloat(e.target.value) || 0)}
              className={inputClass}
              placeholder="e.g. 37.7749"
            />
          </div>
          <div>
            <label htmlFor="longitude" className={labelClass}>
              Longitude *
            </label>
            <input
              id="longitude"
              type="number"
              required
              step="any"
              value={form.longitude}
              onChange={(e) => update("longitude", parseFloat(e.target.value) || 0)}
              className={inputClass}
              placeholder="e.g. -122.4194"
            />
          </div>
        </div>
      </section>

      {/* Optional fields */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Optional details
        </h3>
        <div>
          <label htmlFor="type" className={labelClass}>
            Type
          </label>
          <input
            id="type"
            type="text"
            value={form.type ?? ""}
            onChange={(e) => update("type", e.target.value)}
            className={inputClass}
            placeholder="e.g. Hospital, Clinic"
          />
        </div>
        <div>
          <label htmlFor="dailyHours" className={labelClass}>
            Daily hours
          </label>
          <input
            id="dailyHours"
            type="text"
            value={form.dailyHours ?? ""}
            onChange={(e) => update("dailyHours", e.target.value)}
            className={inputClass}
            placeholder="e.g. 8:00 AM – 6:00 PM"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="phoneNumber" className={labelClass}>
              Phone number
            </label>
            <input
              id="phoneNumber"
              type="tel"
              value={form.phoneNumber ?? ""}
              onChange={(e) => update("phoneNumber", e.target.value)}
              className={inputClass}
              placeholder="+1 234 567 8900"
            />
          </div>
          <div>
            <label htmlFor="email" className={labelClass}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={form.email ?? ""}
              onChange={(e) => update("email", e.target.value)}
              className={inputClass}
              placeholder="contact@example.com"
            />
          </div>
        </div>
      </section>

      {/* Wait time (Firestore: waitTime, minutes); facility issue may be edited above the form */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {facilityIssueDraft ? "Wait time" : "Wait time & facility issue"}
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Manual wait is saved to{" "}
          <span className="font-medium">adminWaitTimeOverrides</span> (same
          UUID as this care center) so the iOS app updates immediately. Leave
          hours and minutes at 0 to clear the override.
        </p>
        <DurationFields
          idPrefix="wait"
          label="Typical wait time"
          description="How long patients typically wait before being seen."
          valueMinutes={form.waitTime}
          onChange={(v) => update("waitTime", v)}
          disabled={disabled}
          inputClass={inputClass}
          labelClass={labelClass}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="waitOverrideReason" className={labelClass}>
              Override reason (optional)
            </label>
            <input
              id="waitOverrideReason"
              type="text"
              value={form.waitOverrideReason ?? ""}
              onChange={(e) => update("waitOverrideReason", e.target.value)}
              disabled={disabled}
              className={inputClass}
              placeholder="e.g. Staff entered"
            />
          </div>
          <div>
            <label htmlFor="waitOverrideUpdatedBy" className={labelClass}>
              Updated by (optional)
            </label>
            <input
              id="waitOverrideUpdatedBy"
              type="text"
              value={form.waitOverrideUpdatedBy ?? ""}
              onChange={(e) => update("waitOverrideUpdatedBy", e.target.value)}
              disabled={disabled}
              className={inputClass}
              placeholder="Defaults to Hospital web app"
            />
          </div>
        </div>
        {!facilityIssueDraft && (
          <div>
            <label htmlFor="facilityIssueType" className={labelClass}>
              Facility issue type
            </label>
            <input
              id="facilityIssueType"
              type="text"
              value={form.facilityIssueType ?? ""}
              onChange={(e) => update("facilityIssueType", e.target.value)}
              disabled={disabled}
              className={inputClass}
              placeholder="e.g. X-ray broken"
            />
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Leave blank if there is no current issue.
            </p>
          </div>
        )}
      </section>

      {/* Capabilities */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Capabilities
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Check each capability this care center has.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {PREDEFINED_CAPABILITIES.map((name) => {
            const checked = form.capabilities.some((c) => c.name === name);
            return (
              <label
                key={name}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 transition hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800/50"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleCapability(name)}
                  disabled={disabled}
                  className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800"
                />
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {name}
                </span>
              </label>
            );
          })}
        </div>
      </section>

      <div className="flex justify-end gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-700">
        <button
          type="button"
          onClick={() => setForm(createEmptyCareCenter())}
          disabled={disabled}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Reset
        </button>
        <button
          type="submit"
          disabled={disabled}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {disabled ? "Saving…" : "Submit"}
        </button>
      </div>
    </form>
  );
}

function DurationFields({
  idPrefix,
  label,
  description,
  valueMinutes,
  onChange,
  disabled,
  inputClass,
  labelClass,
}: {
  idPrefix: string;
  label: string;
  description?: string;
  valueMinutes: number | undefined;
  onChange: (v: number | undefined) => void;
  disabled?: boolean;
  inputClass: string;
  labelClass: string;
}) {
  const total = valueMinutes ?? 0;
  const h = Math.floor(total / 60);
  const m = total % 60;
  const setDuration = (hours: number, minutes: number) => {
    const hh = Math.max(0, Math.min(999, hours));
    const mm = Math.max(0, Math.min(59, minutes));
    const t = hh * 60 + mm;
    onChange(t === 0 ? undefined : t);
  };

  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-600">
      <p className={labelClass}>{label}</p>
      {description && (
        <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
      )}
      <div className="grid grid-cols-2 gap-3 sm:max-w-xs">
        <div>
          <label htmlFor={`${idPrefix}-hours`} className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">
            Hours
          </label>
          <input
            id={`${idPrefix}-hours`}
            type="number"
            min={0}
            max={999}
            disabled={disabled}
            value={h}
            onChange={(e) =>
              setDuration(parseInt(e.target.value, 10) || 0, m)
            }
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-minutes`} className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">
            Minutes
          </label>
          <input
            id={`${idPrefix}-minutes`}
            type="number"
            min={0}
            max={59}
            disabled={disabled}
            value={m}
            onChange={(e) =>
              setDuration(h, parseInt(e.target.value, 10) || 0)
            }
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
}
