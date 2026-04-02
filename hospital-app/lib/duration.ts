/** Format total minutes as a human-readable duration (e.g. "1 hr 30 min"). */
export function formatDurationMinutes(
  totalMinutes: number | undefined | null
): string | null {
  if (totalMinutes == null || totalMinutes < 0) return null;
  if (totalMinutes === 0) return "0 min";
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h} hr${h === 1 ? "" : "s"}`);
  if (m > 0) parts.push(`${m} min`);
  return parts.join(" ") || "0 min";
}
