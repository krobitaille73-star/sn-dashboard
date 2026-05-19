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
    updated: safeDate(row["Updated"]),
    // M-5: strip leading BOM chars that cause display artifacts
    shortDescription: (row["Short description"] ?? "").replace(/^﻿+/, ""),
    reassignmentCount: Number(row["Reassignment count"] ?? 0),
    assignmentGroup: row["Assignment group"] ?? "",
    priority: row["Priority"] ?? "",
    state: row["State"] ?? "",
    store: row["Store"] ?? "",
    // SN2: real ServiceNow SLA business-hours duration in seconds
    resolveTimeSec: row["Resolve time"] != null && row["Resolve time"] !== 0
      ? Number(row["Resolve time"])
      : null,
    // SN2: actual close timestamp (null for Resolved-but-not-yet-Closed tickets)
    closed: safeDate(row["Closed"]),
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

/**
 * Preferred: SLA business-hours resolve time in minutes (from SN2 "Resolve time" field).
 * Falls back to wall-clock (Updated − Opened) when resolveTimeSec is unavailable.
 */
export function resolveMinutes(inc) {
  if (inc.resolveTimeSec != null) return inc.resolveTimeSec / 60;
  // legacy fallback for SN1 data without Resolve time
  if (!inc.opened || !inc.updated) return null;
  return (inc.updated - inc.opened) / 60_000;
}

/** @deprecated Use resolveMinutes() — kept for backward compatibility. */
export function closeMinutes(inc) {
  return resolveMinutes(inc);
}

export function formatDuration(minutes) {
  if (minutes == null || isNaN(minutes)) return "—";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  if (minutes < 1440) return `${(minutes / 60).toFixed(1)} h`;
  return `${(minutes / 1440).toFixed(1)} days`;
}

/**
 * Distribution of SLA resolve times bucketed into ranges.
 * Uses real ServiceNow business-hours "Resolve time" (SN2) when available,
 * falls back to wall-clock (Updated − Opened) for older data.
 */
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
    const m = resolveMinutes(inc);
    if (m == null || m < 0) return;
    const bucket = buckets.find((b) => m < b.max);
    if (bucket) counts[bucket.label]++;
  });
  return buckets.map((b) => ({ label: b.label, count: counts[b.label] }));
}

const SLOW_TICKET_THRESHOLD_MINUTES = 15 * 24 * 60; // 15 days

/**
 * All closed/resolved tickets with SLA resolve time > 15 days, sorted descending.
 * Uses resolveMinutes() — real ServiceNow business-hours when available.
 */
export function top20SlowestTickets(incidents) {
  return incidents
    .filter((i) => {
      if (i.state !== "Closed" && i.state !== "Resolved") return false;
      const m = resolveMinutes(i);
      return m != null && m > SLOW_TICKET_THRESHOLD_MINUTES;
    })
    .map((i) => ({ ...i, closeMinutes: resolveMinutes(i) }))
    .sort((a, b) => b.closeMinutes - a.closeMinutes);
}

/**
 * For each assignment group, return stats on tickets resolved in > 15 days.
 * Each entry: { name, count, avgDays, maxDays }
 * Sorted by avgDays descending. Groups with zero qualifying tickets are excluded.
 */
export function slowTicketsByGroup(incidents) {
  const groups = {};
  incidents.forEach((inc) => {
    if (inc.state !== "Closed" && inc.state !== "Resolved") return;
    const m = resolveMinutes(inc);
    if (m == null || m <= SLOW_TICKET_THRESHOLD_MINUTES) return;
    const g = inc.assignmentGroup || "Unknown";
    if (!groups[g]) groups[g] = [];
    groups[g].push(m / 1440); // convert minutes → days
  });
  return Object.entries(groups)
    .map(([name, days]) => ({
      name,
      count: days.length,
      avgDays: days.reduce((s, d) => s + d, 0) / days.length,
      maxDays: Math.max(...days),
    }))
    .sort((a, b) => b.avgDays - a.avgDays);
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
