import { useState } from "react";
import { formatDuration } from "../utils/parseIncidents";

const PRIORITY_COLOR = {
  "1 - Critical": "#ef4444",
  "2 - High": "#f97316",
  "3 - Moderate": "#eab308",
  "4 - Low": "#3b82f6",
};

// L-1: whitelist prevents prototype-key injection if sort ever comes from a URL param
const SORT_KEYS = { closeMinutes: true, reassignmentCount: true };

export default function Top20SlowTickets({ tickets }) {
  const [sort, setSort] = useState("closeMinutes");

  const safeSort = SORT_KEYS[sort] ? sort : "closeMinutes";
  const sorted = [...tickets].sort((a, b) => b[safeSort] - a[safeSort]);

  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,.08)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#374151" }}>
            Top 20 — Longest Time to Close
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9ca3af" }}>
            Ranked by elapsed time from open to last update
          </p>
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          style={{ fontSize: 11, borderRadius: 6, border: "1px solid #e5e7eb", padding: "4px 8px", color: "#374151", cursor: "pointer" }}
        >
          <option value="closeMinutes">Sort: Duration</option>
          <option value="reassignmentCount">Sort: Reassignments</option>
        </select>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #f3f4f6" }}>
              {["#", "Ticket", "Duration", "Priority", "Assignment Group", "Reassignments", "Store"].map((h) => (
                <th key={h} style={{ padding: "6px 8px", textAlign: "left", fontWeight: 700, color: "#6b7280", whiteSpace: "nowrap" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((t, i) => (
              <tr
                key={t.number}
                style={{ borderBottom: "1px solid #f9fafb", background: i % 2 === 0 ? "#fff" : "#fafafa" }}
              >
                <td style={{ padding: "6px 8px", color: "#9ca3af", fontWeight: 600 }}>{i + 1}</td>
                <td style={{ padding: "6px 8px", fontWeight: 700, color: "#1d4ed8", whiteSpace: "nowrap" }}>
                  {t.number}
                </td>
                <td style={{ padding: "6px 8px", fontWeight: 700, color: "#111827", whiteSpace: "nowrap" }}>
                  {formatDuration(t.closeMinutes)}
                </td>
                <td style={{ padding: "6px 8px" }}>
                  <span style={{
                    display: "inline-block",
                    borderRadius: 999,
                    padding: "2px 8px",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#fff",
                    background: PRIORITY_COLOR[t.priority] ?? "#6b7280",
                    whiteSpace: "nowrap",
                  }}>
                    {t.priority}
                  </span>
                </td>
                <td style={{ padding: "6px 8px", color: "#374151", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {t.assignmentGroup}
                </td>
                <td style={{ padding: "6px 8px", textAlign: "center", fontWeight: t.reassignmentCount > 3 ? 700 : 400, color: t.reassignmentCount > 3 ? "#ef4444" : "#374151" }}>
                  {t.reassignmentCount}
                </td>
                <td style={{ padding: "6px 8px", color: "#374151", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {t.store}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
