// M-4: guard against missing/malformed dates from JSON
function safeDate(val) {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

export function parseIncidents(rows) {
  return rows.map((row) => ({
    number: row["Number"] ?? "",
    opened: safeDate(row["Opened"]),
    assignedTo: row["Assigned to"] ?? "",
    openedBy: row["Opened by"] ?? "",
    updated: safeDate(row["Updated"]),
    updatedBy: row["Updated by"] ?? "",
    workNotes: row["Work notes"] ?? "",
    // M-5: strip leading BOM chars that cause display artifacts
    shortDescription: (row["Short description"] ?? "").replace(/^﻿+/, ""),
    reassignmentCount: Number(row["Reassignment count"] ?? 0),
    assignmentGroup: row["Assignment group"] ?? "",
    priority: row["Priority"] ?? "",
    state: row["State"] ?? "",
    store: row["Store"] ?? "",
  }));
}

export function groupBy(incidents, key) {
  return incidents.reduce((acc, inc) => {
    const val = inc[key] ?? "Unknown";
    acc[val] = (acc[val] ?? 0) + 1;
    return acc;
  }, {});
}

export function incidentsByMonth(incidents) {
  const counts = {};
  incidents.forEach((inc) => {
    // M-4: skip records with invalid opened date
    if (!inc.opened) return;
    const label = `${inc.opened.getFullYear()}-${String(inc.opened.getMonth() + 1).padStart(2, "0")}`;
    counts[label] = (counts[label] ?? 0) + 1;
  });
  return Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));
}

/** Minutes between opened and updated. Returns null when either date is missing. */
export function closeMinutes(inc) {
  if (!inc.opened || !inc.updated) return null;
  return (inc.updated - inc.opened) / 60_000;
}

export function formatDuration(minutes) {
  if (minutes == null || isNaN(minutes)) return "—";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  if (minutes < 1440) return `${(minutes / 60).toFixed(1)} h`;
  return `${(minutes / 1440).toFixed(1)} days`;
}

/** Distribution of close times bucketed into day ranges. */
export function closeTimeDistribution(incidents) {
  const closed = incidents.filter((i) => i.state === "Closed" || i.state === "Resolved");
  const buckets = [
    { label: "< 1 h", max: 60 },
    { label: "1–4 h", max: 240 },
    { label: "4–24 h", max: 1440 },
    { label: "1–3 days", max: 4320 },
    { label: "3–7 days", max: 10080 },
    { label: "> 7 days", max: Infinity },
  ];
  const counts = Object.fromEntries(buckets.map((b) => [b.label, 0]));
  closed.forEach((inc) => {
    const m = closeMinutes(inc);
    if (m == null || m < 0) return;
    const bucket = buckets.find((b) => m < b.max);
    if (bucket) counts[bucket.label]++;
  });
  return buckets.map((b) => ({ label: b.label, count: counts[b.label] }));
}

/** Top N tickets with the longest time from opened to updated (closed/resolved). */
export function top20SlowestTickets(incidents, n = 20) {
  return incidents
    .filter((i) => {
      if (i.state !== "Closed" && i.state !== "Resolved") return false;
      const m = closeMinutes(i);
      return m != null && m >= 0;
    })
    .map((i) => ({ ...i, closeMinutes: closeMinutes(i) }))
    .sort((a, b) => b.closeMinutes - a.closeMinutes)
    .slice(0, n);
}

/**
 * For each assignment group, compute the average days between the last update
 * and the reference date (latest updated in the dataset).
 */
export function teamInactivity(incidents) {
  // M-1: use reduce instead of Math.max(...array) to avoid call-stack overflow
  const maxTs = incidents.reduce((max, i) => {
    const t = i.updated ? i.updated.getTime() : -Infinity;
    return t > max ? t : max;
  }, -Infinity);
  if (!isFinite(maxTs)) return [];

  const refDate = new Date(maxTs);
  const groups = {};
  incidents.forEach((inc) => {
    if (!inc.updated) return;
    const g = inc.assignmentGroup || "Unknown";
    if (!groups[g]) groups[g] = [];
    groups[g].push((refDate - inc.updated) / 86_400_000);
  });
  return Object.entries(groups)
    .map(([name, days]) => ({
      name,
      avgDays: days.reduce((s, d) => s + d, 0) / days.length,
      count: days.length,
    }))
    .filter((g) => g.count >= 5)
    .sort((a, b) => b.avgDays - a.avgDays)
    .slice(0, 10);
}
