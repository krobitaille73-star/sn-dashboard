/**
 * Normalize raw incident rows from the Excel export.
 * Expected columns: Number, Opened, Assigned to, Opened by,
 *   Updated, Updated by, Work notes, Short description,
 *   Reassignment count, Assignment group, Priority, State, Store
 */
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
