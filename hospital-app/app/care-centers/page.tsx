"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  CARE_CENTERS_COLLECTION,
  careCenterFromSnapshot,
} from "@/lib/care-centers";
import type { CareCenter } from "@/lib/types/care-center";

function filterCareCenters(
  list: CareCenter[],
  searchQuery: string,
  filters: {
    country: string;
    region: string;
    type: string;
    capability: string;
  }
): CareCenter[] {
  let result = list;

  const q = searchQuery.trim().toLowerCase();
  if (q) {
    result = result.filter((cc) => {
      const name = (cc.name ?? "").toLowerCase();
      const city = (cc.city ?? "").toLowerCase();
      const region = (cc.region ?? "").toLowerCase();
      const country = (cc.country ?? "").toLowerCase();
      const type = (cc.type ?? "").toLowerCase();
      const capabilityNames = (cc.capabilities ?? [])
        .map((c) => c.name.toLowerCase())
        .join(" ");
      return (
        name.includes(q) ||
        city.includes(q) ||
        region.includes(q) ||
        country.includes(q) ||
        type.includes(q) ||
        capabilityNames.includes(q)
      );
    });
  }

  if (filters.country)
    result = result.filter((cc) => cc.country === filters.country);
  if (filters.region)
    result = result.filter((cc) => cc.region === filters.region);
  if (filters.type)
    result = result.filter((cc) => (cc.type ?? "") === filters.type);
  if (filters.capability)
    result = result.filter((cc) =>
      (cc.capabilities ?? []).some((c) => c.name === filters.capability)
    );

  return result;
}

export default function CareCentersListPage() {
  const [careCenters, setCareCenters] = useState<CareCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [capabilityFilter, setCapabilityFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    async function fetchCareCenters() {
      setLoading(true);
      setError(null);
      try {
        const snapshot = await getDocs(
          collection(db, CARE_CENTERS_COLLECTION)
        );
        const list = snapshot.docs
          .map((doc) => careCenterFromSnapshot(doc))
          .filter((c): c is CareCenter => c !== null);
        setCareCenters(list);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Failed to load care centers."
        );
      } finally {
        setLoading(false);
      }
    }
    fetchCareCenters();
  }, []);

  const filterOptions = useMemo(() => {
    const countries = new Set<string>();
    const regions = new Set<string>();
    const types = new Set<string>();
    const capabilities = new Set<string>();
    careCenters.forEach((cc) => {
      if (cc.country) countries.add(cc.country);
      if (cc.region) regions.add(cc.region);
      if (cc.type) types.add(cc.type);
      (cc.capabilities ?? []).forEach((c) => {
        if (c.name) capabilities.add(c.name);
      });
    });
    return {
      countries: Array.from(countries).sort(),
      regions: Array.from(regions).sort(),
      types: Array.from(types).sort(),
      capabilities: Array.from(capabilities).sort(),
    };
  }, [careCenters]);

  const filteredList = useMemo(
    () =>
      filterCareCenters(careCenters, searchQuery, {
        country: countryFilter,
        region: regionFilter,
        type: typeFilter,
        capability: capabilityFilter,
      }),
    [
      careCenters,
      searchQuery,
      countryFilter,
      regionFilter,
      typeFilter,
      capabilityFilter,
    ]
  );

  const hasActiveFilters =
    countryFilter || regionFilter || typeFilter || capabilityFilter;

  const clearFilters = () => {
    setCountryFilter("");
    setRegionFilter("");
    setTypeFilter("");
    setCapabilityFilter("");
  };

  const inputClass =
    "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm transition focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100";
  const selectClass =
    "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100";

  return (
    <div className="min-h-screen bg-zinc-50 py-12 dark:bg-zinc-950">
      <div className="mx-auto max-w-3xl px-4">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
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
            Back
          </Link>
          <Link
            href="/care-centers/new"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            New Care Center
          </Link>
        </div>

        <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Care Centers
        </h1>

        {error && (
          <div
            className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200"
            role="alert"
          >
            {error}
          </div>
        )}

        {!loading && careCenters.length > 0 && (
          <div className="mb-6 space-y-4">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </span>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, city, region, country, type, or capability…"
                className={`${inputClass} pl-10`}
                aria-label="Search care centers"
              />
            </div>

            <div>
              <button
                type="button"
                onClick={() => setShowFilters((s) => !s)}
                className="flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
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
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                Filters
                {hasActiveFilters && (
                  <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs dark:bg-zinc-600">
                    Active
                  </span>
                )}
              </button>

              {showFilters && (
                <div className="mt-3 grid gap-3 rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-700 dark:bg-zinc-800/30 sm:grid-cols-2 lg:grid-cols-5">
                  <div>
                    <label htmlFor="filter-country" className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Country
                    </label>
                    <select
                      id="filter-country"
                      value={countryFilter}
                      onChange={(e) => setCountryFilter(e.target.value)}
                      className={selectClass}
                    >
                      <option value="">All countries</option>
                      {filterOptions.countries.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="filter-region" className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Region
                    </label>
                    <select
                      id="filter-region"
                      value={regionFilter}
                      onChange={(e) => setRegionFilter(e.target.value)}
                      className={selectClass}
                    >
                      <option value="">All regions</option>
                      {filterOptions.regions.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="filter-type" className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Type
                    </label>
                    <select
                      id="filter-type"
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className={selectClass}
                    >
                      <option value="">All types</option>
                      {filterOptions.types.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="filter-capability" className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Has capability
                    </label>
                    <select
                      id="filter-capability"
                      value={capabilityFilter}
                      onChange={(e) => setCapabilityFilter(e.target.value)}
                      className={selectClass}
                    >
                      <option value="">Any</option>
                      {filterOptions.capabilities.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  {hasActiveFilters && (
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                      >
                        Clear filters
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {filteredList.length === careCenters.length ? (
                <>Showing all {careCenters.length} care centers</>
              ) : (
                <>
                  Showing {filteredList.length} of {careCenters.length} care
                  centers
                </>
              )}
            </p>
          </div>
        )}

        {loading ? (
          <p className="text-zinc-500 dark:text-zinc-400">Loading care centers…</p>
        ) : careCenters.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-zinc-500 dark:text-zinc-400">
              No care centers yet. Create one to get started.
            </p>
            <Link
              href="/care-centers/new"
              className="mt-4 inline-block text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-100"
            >
              New Care Center
            </Link>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-zinc-500 dark:text-zinc-400">
              No care centers match your search or filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                clearFilters();
              }}
              className="mt-4 text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-100"
            >
              Clear search and filters
            </button>
          </div>
        ) : (
          <ul className="space-y-3">
            {filteredList.map((cc) => (
              <li key={cc.id}>
                <Link
                  href={`/care-centers/${cc.id}`}
                  className="block rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-300 hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {cc.name || "Unnamed"}
                    </span>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      {[cc.city, cc.region, cc.country].filter(Boolean).join(", ") || "—"}
                    </span>
                  </div>
                  {cc.capabilities.length > 0 && (
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {cc.capabilities.map((c) => c.name).filter(Boolean).join(", ") || "—"}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
