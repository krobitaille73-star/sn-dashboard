/**
 * OpenQueueTab
 * Shows the current open ticket queue (SN5 data — In Progress / On Hold / New).
 * KPI row → group breakdown (with aging) → filterable ticket list.
 */
import { useMemo, useRef, useState } from "react";

// Colour scale for ticket aging (days since opened)
function agingColor(days) {
  if (days < 30)  return { color: "#15803d", bg: "#f0fdf4", border: "#86efac" }; // green
  if (days < 60)  return { color: "#b45309", bg: "#fffbeb", border: "#fde68a" }; // yellow
  if (days < 90)  return { color: "#c2410c", bg: "#fff7ed", border: "#fed7aa" }; // orange
  return           { color: "#b91c1c", bg: "#fef2f2", border: "#fecaca" };        // red
}

const STATE_COLOR = {
  "In Progress": { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  "On Hold":     { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
  "New":         { bg: "#f0fdf4", color: "#15803d", border: "#86efac" },
};

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

function fmtDate(d) {
  if (!d) return "—";
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("en-CA");
}

function unique(arr) {
  return [...new Set(arr.filter(Boolean))].sort();
}

const EMPTY_FILTERS = { number: "", priority: "", assignmentGroup: "", state: "", store: "", highReassign: false };

// Days since a ticket was opened (wall-clock, always positive)
const NOW_MS = Date.now();
function ticketAgeDays(t) {
  if (!t.opened) return null;
  const ms = NOW_MS - (t.opened instanceof Date ? t.opened.getTime() : new Date(t.opened).getTime());
  return ms > 0 ? ms / 86_400_000 : null;
}

export default function OpenQueueTab({ tickets }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [pageSize, setPageSize] = useState(20);
  const listRef = useRef(null);

  function setFilter(key, value) {
    setFilters(f => ({ ...f, [key]: value }));
  }

  // Click a KPI card → reset to that filter then scroll to list
  function handleKpiClick(patch) {
    setFilters({ ...EMPTY_FILTERS, ...patch });
    setTimeout(() => listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  // Click a group row → filter by that group
  function handleGroupClick(name) {
    setFilters(f => ({ ...EMPTY_FILTERS, assignmentGroup: f.assignmentGroup === name ? "" : name }));
    setTimeout(() => listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  const hasActiveFilter = Object.values(filters).some(Boolean);

  // Pre-compute aging days once per render
  const ticketsWithAge = useMemo(() =>
    tickets.map(t => ({ ...t, ageDays: ticketAgeDays(t) })),
  [tickets]);

  // KPI counts
  const kpis = useMemo(() => {
    const withAge = ticketsWithAge.filter(t => t.ageDays != null);
    const avgAge = withAge.length
      ? withAge.reduce((s, t) => s + t.ageDays, 0) / withAge.length
      : null;
    return {
      total:        tickets.length,
      inProgress:   tickets.filter(t => t.state === "In Progress").length,
      onHold:       tickets.filter(t => t.state === "On Hold").length,
      newTickets:   tickets.filter(t => t.state === "New").length,
      highReassign: tickets.filter(t => t.reassignmentCount >= 3).length,
      avgAge,
    };
  }, [tickets, ticketsWithAge]);

  // Group breakdown — sorted by avgAgingDays desc
  const groupBreakdown = useMemo(() => {
    const map = {};
    ticketsWithAge.forEach(t => {
      const g = t.assignmentGroup || "Unknown";
      if (!map[g]) map[g] = { name: g, total: 0, onHold: 0, inProgress: 0, newCount: 0, ageDaysSum: 0, ageCount: 0, maxAge: 0 };
      map[g].total++;
      if (t.state === "On Hold")     map[g].onHold++;
      if (t.state === "In Progress") map[g].inProgress++;
      if (t.state === "New")         map[g].newCount++;
      if (t.ageDays != null) {
        map[g].ageDaysSum += t.ageDays;
        map[g].ageCount++;
        if (t.ageDays > map[g].maxAge) map[g].maxAge = t.ageDays;
      }
    });
    return Object.values(map)
      .map(g => ({ ...g, avgAge: g.ageCount > 0 ? g.ageDaysSum / g.ageCount : null }))
      .sort((a, b) => (b.avgAge ?? 0) - (a.avgAge ?? 0));
  }, [ticketsWithAge]);

  const maxGroupTotal = groupBreakdown[0]?.total ?? 1;

  // Dropdown options derived from full list
  const priorities      = useMemo(() => unique(tickets.map(t => t.priority)), [tickets]);
  const assignmentGroups = useMemo(() => unique(tickets.map(t => t.assignmentGroup)), [tickets]);
  const states          = useMemo(() => unique(tickets.map(t => t.state)), [tickets]);
  const stores          = useMemo(() => unique(tickets.map(t => t.store)), [tickets]);

  const filtered = useMemo(() => {
    let rows = [...ticketsWithAge];
    if (filters.number)
      rows = rows.filter(t => t.number.toLowerCase().includes(filters.number.toLowerCase()));
    if (filters.priority)
      rows = rows.filter(t => t.priority === filters.priority);
    if (filters.assignmentGroup)
      rows = rows.filter(t => t.assignmentGroup === filters.assignmentGroup);
    if (filters.state)
      rows = rows.filter(t => t.state === filters.state);
    if (filters.store)
      rows = rows.filter(t => t.store === filters.store);
    if (filters.highReassign)
      rows = rows.filter(t => t.reassignmentCount >= 3);
    return rows.sort((a, b) => (b.ageDays ?? 0) - (a.ageDays ?? 0));
  }, [ticketsWithAge, filters]);

  const visible = pageSize === "All" ? filtered : filtered.slice(0, pageSize);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── KPI row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        {[
          { label: "Total Open",      value: kpis.total,        bg: "#f0f9ff", color: "#0369a1", border: "#bae6fd", patch: {} },
          { label: "In Progress",     value: kpis.inProgress,   ...STATE_COLOR["In Progress"], patch: { state: "In Progress" } },
          { label: "On Hold",         value: kpis.onHold,       ...STATE_COLOR["On Hold"],     patch: { state: "On Hold" } },
          { label: "New / Unstarted", value: kpis.newTickets,   ...STATE_COLOR["New"],          patch: { state: "New" } },
          { label: "Reassigned ≥ 3×", value: kpis.highReassign, bg: "#fef2f2", color: "#b91c1c", border: "#fecaca", patch: { highReassign: true } },
        ].map(({ label, value, bg, color, border, patch }) => {
          const isActive = Object.entries(patch).every(([k, v]) => filters[k] === v) && Object.keys(patch).length > 0;
          return (
            <div key={label}
              onClick={() => handleKpiClick(patch)}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 4px 12px ${color}33`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = isActive ? `0 0 0 2px ${color}` : "0 1px 3px rgba(0,0,0,.06)"; }}
              style={{
                background: bg, borderRadius: 10, padding: "14px 16px",
                border: isActive ? `2px solid ${color}` : `1px solid ${border}`,
                boxShadow: isActive ? `0 0 0 2px ${color}33` : "0 1px 3px rgba(0,0,0,.06)",
                cursor: "pointer", transition: "transform .15s, box-shadow .15s",
              }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#6b7280" }}>{label}</p>
              <p style={{ margin: "4px 0 0", fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>
                {value.toLocaleString()}
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 10, color, opacity: 0.7, fontWeight: 600 }}>
                {isActive ? "✓ filtered" : "View tickets →"}
              </p>
            </div>
          );
        })}
        {/* Avg aging KPI — not clickable, informational */}
        {kpis.avgAge != null && (() => {
          const { color, bg, border } = agingColor(kpis.avgAge);
          return (
            <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: "14px 16px", boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#6b7280" }}>Avg Ticket Age</p>
              <p style={{ margin: "4px 0 0", fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>
                {kpis.avgAge.toFixed(1)}d
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 10, color: "#9ca3af" }}>since opened</p>
            </div>
          );
        })()}
      </div>

      {/* ── Group breakdown ── */}
      <div style={{ background: "#fff", borderRadius: 12, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,.08)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#374151" }}>
            Open Tickets by Assignment Group
          </p>
          <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>sorted by avg age desc</p>
        </div>

        {/* Aging legend */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          {[
            { label: "< 30 days",  days: 15 },
            { label: "30–60 days", days: 45 },
            { label: "60–90 days", days: 75 },
            { label: "90+ days",   days: 100 },
          ].map(({ label, days }) => {
            const { color, bg, border } = agingColor(days);
            return (
              <span key={label} style={{
                fontSize: 10, fontWeight: 600, borderRadius: 999, padding: "2px 10px",
                background: bg, color, border: `1px solid ${border}`,
              }}>{label}</span>
            );
          })}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {groupBreakdown.map(g => {
            const ac = g.avgAge != null ? agingColor(g.avgAge) : { color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb" };
            const isSelected = filters.assignmentGroup === g.name;
            return (
              <div key={g.name}
                onClick={() => handleGroupClick(g.name)}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 4px 12px ${ac.color}33`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = isSelected ? `0 0 0 2px ${ac.color}55` : "none"; }}
                style={{
                  background: ac.bg,
                  border: isSelected ? `2px solid ${ac.color}` : `1px solid ${ac.border}`,
                  boxShadow: isSelected ? `0 0 0 2px ${ac.color}33` : "none",
                  borderRadius: 8, padding: "10px 12px",
                  cursor: "pointer", transition: "transform .15s, box-shadow .15s",
                }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, flexWrap: "wrap", gap: 6 }}>
                  {/* Group name + hint */}
                  <span style={{ fontSize: 12, fontWeight: 700, color: ac.color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "40%" }}
                        title={g.name}>
                    {g.name}
                    <span style={{ fontSize: 10, fontWeight: 500, marginLeft: 6, opacity: 0.65 }}>
                      {isSelected ? "✓ filtered" : "View tickets →"}
                    </span>
                  </span>
                  {/* Right-side stats */}
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0, flexWrap: "wrap" }}>
                    {g.onHold > 0 && (
                      <span style={{ fontSize: 10, fontWeight: 700, borderRadius: 999, padding: "1px 7px", background: STATE_COLOR["On Hold"].bg, color: STATE_COLOR["On Hold"].color, border: `1px solid ${STATE_COLOR["On Hold"].border}` }}>
                        {g.onHold} on hold
                      </span>
                    )}
                    {g.newCount > 0 && (
                      <span style={{ fontSize: 10, fontWeight: 700, borderRadius: 999, padding: "1px 7px", background: STATE_COLOR["New"].bg, color: STATE_COLOR["New"].color, border: `1px solid ${STATE_COLOR["New"].border}` }}>
                        {g.newCount} new
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: "#6b7280", whiteSpace: "nowrap" }}>
                      <strong style={{ color: "#374151" }}>{g.total}</strong> tickets
                    </span>
                    {g.avgAge != null && (
                      <>
                        <span style={{ fontSize: 11, color: "#6b7280", whiteSpace: "nowrap" }}>
                          max <strong style={{ color: ac.color }}>{g.maxAge.toFixed(1)}d</strong>
                        </span>
                        <span style={{
                          fontSize: 13, fontWeight: 800, color: ac.color,
                          background: "rgba(255,255,255,.65)", borderRadius: 6,
                          padding: "1px 8px", border: `1px solid ${ac.border}`,
                          whiteSpace: "nowrap",
                        }}>
                          {g.avgAge.toFixed(1)}d avg
                        </span>
                      </>
                    )}
                  </div>
                </div>
                {/* Progress bar relative to oldest group */}
                <div style={{ background: "rgba(0,0,0,.07)", borderRadius: 999, height: 5, overflow: "hidden" }}>
                  <div style={{
                    width: `${g.avgAge != null ? (g.avgAge / (groupBreakdown[0]?.avgAge ?? 1)) * 100 : 0}%`,
                    height: "100%",
                    background: ac.color,
                    borderRadius: 999,
                    transition: "width .4s ease",
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Ticket list ── */}
      <div ref={listRef} style={{ background: "#fff", borderRadius: 12, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,.08)" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#374151" }}>Open Tickets</p>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9ca3af" }}>
              {hasActiveFilter
                ? `${filtered.length.toLocaleString()} of ${tickets.length.toLocaleString()} tickets`
                : `${tickets.length.toLocaleString()} tickets`
              } · sorted by age desc
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
              onChange={e => { const v = e.target.value; setPageSize(v === "All" ? "All" : Number(v)); }}
              style={{ fontSize: 11, borderRadius: 6, border: "1px solid #e5e7eb", padding: "4px 8px", color: "#374151", cursor: "pointer" }}
            >
              {PAGE_SIZE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "3%" }} />
              <col style={{ width: "7%" }} />
              <col style={{ width: "7%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "6%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "7%" }} />
              <col style={{ width: "7%" }} />
              <col style={{ width: "7%" }} />
            </colgroup>
            <thead>
              <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                {["#", "Ticket", "State", "Priority", "Assignment Group", "Reassign", "Store", "Age", "Opened", "Updated"].map(h => (
                  <th key={h} style={{ padding: "6px 8px", textAlign: "left", fontWeight: 700, color: "#6b7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {h}
                  </th>
                ))}
              </tr>
              {/* Filter row */}
              <tr style={{ borderBottom: "2px solid #e5e7eb", background: "#f8fafc" }}>
                <td />
                <td style={{ padding: "4px 8px" }}>
                  <input type="text" placeholder="Filter…" value={filters.number}
                    onChange={e => setFilter("number", e.target.value)} style={FILTER_INPUT_STYLE} />
                </td>
                <td style={{ padding: "4px 8px" }}>
                  <select value={filters.state} onChange={e => setFilter("state", e.target.value)} style={FILTER_INPUT_STYLE}>
                    <option value="">All</option>
                    {states.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
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
                <td /><td style={{ padding: "4px 8px" }}>
                  <select value={filters.store} onChange={e => setFilter("store", e.target.value)} style={FILTER_INPUT_STYLE}>
                    <option value="">All</option>
                    {stores.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td /><td /><td />
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", color: "#9ca3af", padding: "20px 0", fontSize: 12 }}>
                    No tickets match the current filters.
                  </td>
                </tr>
              ) : (
                visible.map((t, i) => {
                  const sc = STATE_COLOR[t.state] ?? { bg: "#f9fafb", color: "#374151", border: "#e5e7eb" };
                  const ac = t.ageDays != null ? agingColor(t.ageDays) : null;
                  return (
                    <tr key={t.number} style={{ borderBottom: "1px solid #f9fafb", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={{ padding: "6px 8px", color: "#9ca3af", fontWeight: 600 }}>{i + 1}</td>
                      <td style={{ padding: "6px 8px", fontWeight: 700, color: "#1d4ed8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                          title={t.number}>{t.number}</td>
                      <td style={{ padding: "6px 8px" }}>
                        <span style={{
                          display: "inline-block", borderRadius: 999, padding: "2px 7px",
                          fontSize: 10, fontWeight: 700,
                          background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                          whiteSpace: "nowrap",
                        }}>{t.state}</span>
                      </td>
                      <td style={{ padding: "6px 8px" }}>
                        <span style={{
                          display: "inline-block", borderRadius: 999, padding: "2px 8px",
                          fontSize: 10, fontWeight: 700, color: "#fff",
                          background: PRIORITY_COLOR[t.priority] ?? "#6b7280",
                          whiteSpace: "nowrap",
                        }}>{t.priority}</span>
                      </td>
                      <td style={{ padding: "6px 8px", color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                          title={t.assignmentGroup}>{t.assignmentGroup}</td>
                      <td style={{ padding: "6px 8px", textAlign: "center",
                                   fontWeight: t.reassignmentCount >= 3 ? 700 : 400,
                                   color: t.reassignmentCount >= 3 ? "#ef4444" : "#374151" }}>
                        {t.reassignmentCount}
                      </td>
                      <td style={{ padding: "6px 8px", color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                          title={t.store}>{t.store}</td>
                      {/* Age column */}
                      <td style={{ padding: "6px 8px", whiteSpace: "nowrap" }}>
                        {ac ? (
                          <span style={{
                            display: "inline-block", borderRadius: 999, padding: "2px 7px",
                            fontSize: 10, fontWeight: 700,
                            background: ac.bg, color: ac.color, border: `1px solid ${ac.border}`,
                          }}>
                            {t.ageDays.toFixed(1)}d
                          </span>
                        ) : "—"}
                      </td>
                      <td style={{ padding: "6px 8px", color: "#6b7280", whiteSpace: "nowrap" }}>{fmtDate(t.opened)}</td>
                      <td style={{ padding: "6px 8px", color: "#6b7280", whiteSpace: "nowrap" }}>{fmtDate(t.updated)}</td>
                    </tr>
                  );
                })
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
    </div>
  );
}
