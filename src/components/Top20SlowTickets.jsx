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

const PAGE_SIZE_OPTIONS = [20, 50, 100, "All"];

function fmtDate(d) {
  if (!d) return "—";
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("en-CA"); // YYYY-MM-DD
}

export default function Top20SlowTickets({ tickets }) {
  const [sort, setSort] = useState("closeMinutes");
  const [pageSize, setPageSize] = useState(20);

  const safeSort = SORT_KEYS[sort] ? sort : "closeMinutes";
  const sorted = [...tickets].sort((a, b) => b[safeSort] - a[safeSort]);
  const visible = pageSize === "All" ? sorted : sorted.slice(0, pageSize);

  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,.08)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#374151" }}>
            Slow Tickets — Resolved in &gt; 15 days
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9ca3af" }}>
            {tickets.length.toLocaleString()} tickets · SLA business-hours resolve time (ServiceNow)
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>Show</label>
          <select
            value={pageSize}
            onChange={(e) => {
              const v = e.target.value;
              setPageSize(v === "All" ? "All" : Number(v));
            }}
            style={{ fontSize: 11, borderRadius: 6, border: "1px solid #e5e7eb", padding: "4px 8px", color: "#374151", cursor: "pointer" }}
          >
            {PAGE_SIZE_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{ fontSize: 11, borderRadius: 6, border: "1px solid #e5e7eb", padding: "4px 8px", color: "#374151", cursor: "pointer" }}
          >
            <option value="closeMinutes">Sort: Resolve Time (SLA)</option>
            <option value="reassignmentCount">Sort: Reassignments</option>
          </select>
        </div>
      </div>

      {tickets.length === 0 ? (
        <p style={{ textAlign: "center", color: "#9ca3af", fontSize: 12, padding: "24px 0" }}>
          No tickets exceeded 15 days to resolve.
        </p>
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #f3f4f6" }}>
                  {["#", "Ticket", "Resolve Time (SLA)", "Priority", "Assignment Group", "Reassignments", "Store", "Resolved"].map((h) => (
                    <th key={h} style={{ padding: "6px 8px", textAlign: "left", fontWeight: 700, color: "#6b7280", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((t, i) => (
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
                    <td style={{ padding: "6px 8px", color: "#6b7280", whiteSpace: "nowrap" }}>
                      {fmtDate(t.closed)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pageSize !== "All" && sorted.length > pageSize && (
            <p style={{ margin: "10px 0 0", fontSize: 11, color: "#9ca3af", textAlign: "right" }}>
              Showing {pageSize} of {sorted.length.toLocaleString()} tickets
            </p>
          )}
        </>
      )}
    </div>
  );
}
