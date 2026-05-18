import { useMemo, useState, useEffect } from "react";
import { formatDuration, resolveMinutes } from "../utils/parseIncidents";

const PRIORITY_COLOR = {
  "1 - Critical": "#ef4444",
  "2 - High":     "#f97316",
  "3 - Moderate": "#eab308",
  "4 - Low":      "#3b82f6",
};

const PAGE_SIZE_OPTIONS = [20, 50, 100, "All"];

const FILTER_INPUT_STYLE = {
  width: "100%",
  fontSize: 10,
  border: "1px solid #e5e7eb",
  borderRadius: 4,
  padding: "2px 4px",
  color: "#374151",
  background: "#f9fafb",
  boxSizing: "border-box",
};

const EMPTY_FILTERS = { number: "", description: "", priority: "", assignmentGroup: "", state: "", store: "" };

function unique(arr) {
  return [...new Set(arr.filter(Boolean))].sort();
}

function fmtDate(d) {
  if (!d) return "—";
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("en-CA");
}

export default function TicketList({ incidents, initialPriority = "" }) {
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS, priority: initialPriority });
  const [pageSize, setPageSize] = useState(20);
  const [sort, setSort] = useState({ key: "opened", dir: -1 });

  // Sync if parent changes the initial priority (e.g. clicking widget again)
  useEffect(() => {
    setFilters(f => ({ ...f, priority: initialPriority }));
  }, [initialPriority]);

  const priorities      = useMemo(() => unique(incidents.map(t => t.priority)), [incidents]);
  const assignmentGroups = useMemo(() => unique(incidents.map(t => t.assignmentGroup)), [incidents]);
  const states          = useMemo(() => unique(incidents.map(t => t.state)), [incidents]);
  const stores          = useMemo(() => unique(incidents.map(t => t.store)), [incidents]);

  const hasActiveFilter = Object.values(filters).some(Boolean);

  function setFilter(key, value) {
    setFilters(f => ({ ...f, [key]: value }));
  }

  function toggleSort(key) {
    setSort(s => s.key === key ? { key, dir: s.dir * -1 } : { key, dir: -1 });
  }

  const filtered = useMemo(() => {
    let rows = incidents;
    if (filters.number)
      rows = rows.filter(t => t.number.toLowerCase().includes(filters.number.toLowerCase()));
    if (filters.description)
      rows = rows.filter(t => t.shortDescription.toLowerCase().includes(filters.description.toLowerCase()));
    if (filters.priority)
      rows = rows.filter(t => t.priority === filters.priority);
    if (filters.assignmentGroup)
      rows = rows.filter(t => t.assignmentGroup === filters.assignmentGroup);
    if (filters.state)
      rows = rows.filter(t => t.state === filters.state);
    if (filters.store)
      rows = rows.filter(t => t.store === filters.store);

    return [...rows].sort((a, b) => {
      let av = a[sort.key], bv = b[sort.key];
      if (sort.key === "resolveTime") { av = resolveMinutes(a) ?? -1; bv = resolveMinutes(b) ?? -1; }
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av < bv) return -sort.dir;
      if (av > bv) return sort.dir;
      return 0;
    });
  }, [incidents, filters, sort]);

  const visible = pageSize === "All" ? filtered : filtered.slice(0, pageSize);

  const SortIndicator = ({ col }) => {
    if (sort.key !== col) return <span style={{ color: "#cbd5e1", marginLeft: 3 }}>↕</span>;
    return <span style={{ marginLeft: 3 }}>{sort.dir === 1 ? "↑" : "↓"}</span>;
  };

  const thStyle = (col) => ({
    padding: "6px 8px",
    textAlign: "left",
    fontWeight: 700,
    color: "#6b7280",
    whiteSpace: "nowrap",
    cursor: "pointer",
    userSelect: "none",
  });

  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,.08)" }}>

      {/* Header bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#374151" }}>
            {filters.priority
              ? <>Tickets — <span style={{ color: PRIORITY_COLOR[filters.priority] ?? "#374151" }}>{filters.priority}</span></>
              : "All Tickets"
            }
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9ca3af" }}>
            {hasActiveFilter
              ? `${filtered.length.toLocaleString()} of ${incidents.length.toLocaleString()} tickets`
              : `${incidents.length.toLocaleString()} tickets`
            }
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {hasActiveFilter && (
            <button
              onClick={() => setFilters(EMPTY_FILTERS)}
              style={{ fontSize: 11, borderRadius: 6, border: "1px solid #fca5a5", padding: "4px 10px", color: "#dc2626", background: "#fef2f2", cursor: "pointer", fontWeight: 600 }}
            >
              ✕ Clear filters
            </button>
          )}
          <label style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>Show</label>
          <select
            value={pageSize}
            onChange={e => setPageSize(e.target.value === "All" ? "All" : Number(e.target.value))}
            style={{ fontSize: 11, borderRadius: 6, border: "1px solid #e5e7eb", padding: "4px 8px", color: "#374151", cursor: "pointer" }}
          >
            {PAGE_SIZE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", minWidth: 1480, borderCollapse: "collapse", fontSize: 12 }}>
          <colgroup>
            <col style={{ width: 40 }} />   {/* # */}
            <col style={{ width: 110 }} />  {/* Ticket */}
            <col style={{ width: 320 }} />  {/* Description */}
            <col style={{ width: 120 }} />  {/* Priority */}
            <col style={{ width: 220 }} />  {/* Assignment Group */}
            <col style={{ width: 130 }} />  {/* Resolve Time */}
            <col style={{ width: 100 }} />  {/* State */}
            <col style={{ width: 200 }} />  {/* Store */}
            <col style={{ width: 110 }} />  {/* Opened */}
            <col style={{ width: 110 }} />  {/* Resolved */}
          </colgroup>
          <thead>
            {/* Sortable column headers */}
            <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
              <th style={{ padding: "6px 8px", color: "#6b7280", fontWeight: 700, whiteSpace: "nowrap" }}>#</th>
              <th style={thStyle("number")} onClick={() => toggleSort("number")}>Ticket <SortIndicator col="number" /></th>
              <th style={thStyle("shortDescription")} onClick={() => toggleSort("shortDescription")}>Description <SortIndicator col="shortDescription" /></th>
              <th style={thStyle("priority")} onClick={() => toggleSort("priority")}>Priority <SortIndicator col="priority" /></th>
              <th style={thStyle("assignmentGroup")} onClick={() => toggleSort("assignmentGroup")}>Assignment Group <SortIndicator col="assignmentGroup" /></th>
              <th style={thStyle("resolveTime")} onClick={() => toggleSort("resolveTime")}>Resolve Time <SortIndicator col="resolveTime" /></th>
              <th style={thStyle("state")} onClick={() => toggleSort("state")}>State <SortIndicator col="state" /></th>
              <th style={thStyle("store")} onClick={() => toggleSort("store")}>Store <SortIndicator col="store" /></th>
              <th style={thStyle("opened")} onClick={() => toggleSort("opened")}>Opened <SortIndicator col="opened" /></th>
              <th style={thStyle("closed")} onClick={() => toggleSort("closed")}>Resolved <SortIndicator col="closed" /></th>
            </tr>
            {/* Filter row */}
            <tr style={{ borderBottom: "2px solid #e5e7eb", background: "#f8fafc" }}>
              <td />
              <td style={{ padding: "4px 8px" }}>
                <input type="text" placeholder="Filter…" value={filters.number}
                  onChange={e => setFilter("number", e.target.value)} style={FILTER_INPUT_STYLE} />
              </td>
              <td style={{ padding: "4px 8px" }}>
                <input type="text" placeholder="Search description…" value={filters.description}
                  onChange={e => setFilter("description", e.target.value)} style={FILTER_INPUT_STYLE} />
              </td>
              <td style={{ padding: "4px 8px" }}>
                <select value={filters.priority} onChange={e => setFilter("priority", e.target.value)} style={FILTER_INPUT_STYLE}>
                  <option value="">All</option>
                  {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </td>
              <td style={{ padding: "4px 8px" }}>
                <select value={filters.assignmentGroup} onChange={e => setFilter("assignmentGroup", e.target.value)} style={FILTER_INPUT_STYLE}>
                  <option value="">All</option>
                  {assignmentGroups.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </td>
              <td />{/* Resolve Time — no filter */}
              <td style={{ padding: "4px 8px" }}>
                <select value={filters.state} onChange={e => setFilter("state", e.target.value)} style={FILTER_INPUT_STYLE}>
                  <option value="">All</option>
                  {states.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </td>
              <td style={{ padding: "4px 8px" }}>
                <select value={filters.store} onChange={e => setFilter("store", e.target.value)} style={FILTER_INPUT_STYLE}>
                  <option value="">All</option>
                  {stores.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </td>
              <td />{/* Opened — no filter */}
              <td />{/* Resolved — no filter */}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: "center", color: "#9ca3af", padding: "24px 0", fontSize: 12 }}>
                  No tickets match the current filters.
                </td>
              </tr>
            ) : (
              visible.map((t, i) => (
                <tr key={t.number} style={{ borderBottom: "1px solid #f9fafb", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "6px 8px", color: "#9ca3af", fontWeight: 600 }}>{i + 1}</td>
                  <td style={{ padding: "6px 8px", fontWeight: 700, color: "#1d4ed8", whiteSpace: "nowrap" }}>{t.number}</td>
                  <td style={{ padding: "6px 8px", color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                      title={t.shortDescription}>
                    {t.shortDescription || <span style={{ color: "#d1d5db" }}>—</span>}
                  </td>
                  <td style={{ padding: "6px 8px" }}>
                    <span style={{
                      display: "inline-block", borderRadius: 999, padding: "2px 8px",
                      fontSize: 10, fontWeight: 700, color: "#fff",
                      background: PRIORITY_COLOR[t.priority] ?? "#6b7280", whiteSpace: "nowrap",
                    }}>
                      {t.priority}
                    </span>
                  </td>
                  <td style={{ padding: "6px 8px", color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.assignmentGroup}
                  </td>
                  <td style={{ padding: "6px 8px", color: "#111827", whiteSpace: "nowrap" }}>
                    {formatDuration(resolveMinutes(t))}
                  </td>
                  <td style={{ padding: "6px 8px" }}>
                    <span style={{
                      display: "inline-block", borderRadius: 999, padding: "2px 8px",
                      fontSize: 10, fontWeight: 600,
                      background: t.state === "Closed" ? "#f0fdf4" : "#fff7ed",
                      color: t.state === "Closed" ? "#15803d" : "#c2410c",
                      border: `1px solid ${t.state === "Closed" ? "#86efac" : "#fed7aa"}`,
                      whiteSpace: "nowrap",
                    }}>
                      {t.state}
                    </span>
                  </td>
                  <td style={{ padding: "6px 8px", color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.store}
                  </td>
                  <td style={{ padding: "6px 8px", color: "#6b7280", whiteSpace: "nowrap" }}>{fmtDate(t.opened)}</td>
                  <td style={{ padding: "6px 8px", color: "#6b7280", whiteSpace: "nowrap" }}>{fmtDate(t.closed)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pageSize !== "All" && filtered.length > pageSize && (
        <p style={{ margin: "10px 0 0", fontSize: 11, color: "#9ca3af", textAlign: "right" }}>
          Showing {pageSize} of {filtered.length.toLocaleString()} tickets
        </p>
      )}
    </div>
  );
}
