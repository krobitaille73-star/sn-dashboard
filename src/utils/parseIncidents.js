export function parseIncidents(rows) {
  return rows.map((row) => ({
    number: row["Number"],
    opened: new Date(row["Opened"]),
    assignedTo: row["Assigned to"] ?? "",
    openedBy: row["Opened by"] ?? "",
    updated: new Date(row["Updated"]),
    updatedBy: row["Updated by"] ?? "",
    workNotes: row["Work notes"] ?? "",
    shortDescription: row["Short description"] ?? "",
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
    const label = `${inc.opened.getFullYear()}-${String(inc.opened.getMonth() + 1).padStart(2, "0")}`;
    counts[label] = (counts[label] ?? 0) + 1;
  });
  return Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));
}

/** Minutes between opened and updated for closed/resolved tickets. */
export function closeMinutes(inc) {
  return (inc.updated - inc.opened) / 60_000;
}

export function formatDuration(minutes) {
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
    if (m < 0) return;
    const bucket = buckets.find((b) => m < b.max);
    if (bucket) counts[bucket.label]++;
  });
  return buckets.map((b) => ({ label: b.label, count: counts[b.label] }));
}

/** Top N tickets with the longest time from opened to updated (closed/resolved). */
export function top20SlowestTickets(incidents, n = 20) {
  return incidents
    .filter((i) => (i.state === "Closed" || i.state === "Resolved") && closeMinutes(i) >= 0)
    .map((i) => ({ ...i, closeMinutes: closeMinutes(i) }))
    .sort((a, b) => b.closeMinutes - a.closeMinutes)
    .slice(0, n);
}

/**
 * For each assignment group, compute the average days between the last update
 * and the reference date (latest Updated in the dataset). A high value means
 * tickets sat assigned without activity for a long time.
 */
export function teamInactivity(incidents) {
  const refDate = new Date(Math.max(...incidents.map((i) => i.updated)));
  const groups = {};
  incidents.forEach((inc) => {
    const g = inc.assignmentGroup || "Unknown";
    if (!groups[g]) groups[g] = [];
    const daysSinceUpdate = (refDate - inc.updated) / 86_400_000;
    groups[g].push(daysSinceUpdate);
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
