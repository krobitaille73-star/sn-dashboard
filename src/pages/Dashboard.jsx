import { useMemo, useState } from "react";
import KpiCard from "../components/KpiCard";
import IncidentsByMonthChart from "../components/IncidentsByMonthChart";
import PriorityChart from "../components/PriorityChart";
import StateChart from "../components/StateChart";
import AssignmentGroupChart from "../components/AssignmentGroupChart";
import CloseTimeDistribution from "../components/CloseTimeDistribution";
import Top20SlowTickets from "../components/Top20SlowTickets";
import TeamInactivity from "../components/TeamInactivity";
import {
  groupBy,
  incidentsByMonth,
  closeMinutes,
  formatDuration,
  closeTimeDistribution,
  top20SlowestTickets,
  teamInactivity,
} from "../utils/parseIncidents";

const SECTIONS = ["Overview", "Close Time", "Slow Tickets", "Team Inactivity"];

export default function Dashboard({ incidents }) {
  const [search, setSearch] = useState("");
  const [section, setSection] = useState("Overview");

  const filtered = useMemo(() => {
    if (!search) return incidents;
    const q = search.toLowerCase();
    return incidents.filter(
      (i) =>
        i.number.toLowerCase().includes(q) ||
        i.shortDescription.toLowerCase().includes(q) ||
        i.store.toLowerCase().includes(q)
    );
  }, [incidents, search]);

  // --- KPI row 1: volume ---
  const volumeKpis = useMemo(() => {
    const total = filtered.length;
    const critical = filtered.filter((i) => i.priority === "1 - Critical").length;
    const resolved = filtered.filter((i) => i.state === "Resolved").length;
    const closed = filtered.filter((i) => i.state === "Closed").length;
    return { total, critical, resolved, closed };
  }, [filtered]);

  // --- KPI row 2: close-time insights ---
  const closeKpis = useMemo(() => {
    const closable = filtered.filter(
      (i) => (i.state === "Closed" || i.state === "Resolved") && closeMinutes(i) >= 0
    );
    if (!closable.length) return { avg: "—", median: "—", fastest: "—", slowest: "—" };
    const mins = closable.map((i) => closeMinutes(i)).sort((a, b) => a - b);
    const avg = mins.reduce((s, m) => s + m, 0) / mins.length;
    const median = mins[Math.floor(mins.length / 2)];
    return {
      avg: formatDuration(avg),
      median: formatDuration(median),
      fastest: formatDuration(mins[0]),
      slowest: formatDuration(mins[mins.length - 1]),
    };
  }, [filtered]);

  // --- Charts ---
  const monthData     = useMemo(() => incidentsByMonth(filtered), [filtered]);
  const priorityData  = useMemo(() => {
    const g = groupBy(filtered, "priority");
    return Object.entries(g).map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name));
  }, [filtered]);
  const stateData     = useMemo(() => {
    const g = groupBy(filtered, "state");
    return Object.entries(g).map(([name, count]) => ({ name, count }));
  }, [filtered]);
  const groupData     = useMemo(() => {
    const g = groupBy(filtered, "assignmentGroup");
    return Object.entries(g).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [filtered]);
  const distData      = useMemo(() => closeTimeDistribution(filtered), [filtered]);
  const slowTickets   = useMemo(() => top20SlowestTickets(filtered), [filtered]);
  const inactivityData = useMemo(() => teamInactivity(filtered), [filtered]);

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0f172a" }}>
              ServiceNow Incident Dashboard
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" }}>
              {filtered.length.toLocaleString()} tickets · Jan–May 2026
            </p>
          </div>
          <input
            style={{ borderRadius: 8, border: "1px solid #e2e8f0", padding: "8px 14px", fontSize: 13, width: 240, boxShadow: "0 1px 2px rgba(0,0,0,.05)", outline: "none" }}
            placeholder="Search ticket, store…"
            maxLength={200}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Section tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#e2e8f0", borderRadius: 10, padding: 4, width: "fit-content" }}>
          {SECTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setSection(s)}
              style={{
                border: "none",
                borderRadius: 7,
                padding: "6px 16px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                background: section === s ? "#fff" : "transparent",
                color: section === s ? "#1d4ed8" : "#64748b",
                boxShadow: section === s ? "0 1px 3px rgba(0,0,0,.12)" : "none",
                transition: "all .15s",
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* === OVERVIEW === */}
        {section === "Overview" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 16 }}>
              <KpiCard title="Total Incidents" value={volumeKpis.total.toLocaleString()} color="blue" badge="Volume" />
              <KpiCard title="Critical" value={volumeKpis.critical} color="red" badge="P1" />
              <KpiCard title="Resolved" value={volumeKpis.resolved.toLocaleString()} color="yellow" />
              <KpiCard title="Closed" value={volumeKpis.closed.toLocaleString()} color="green" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <IncidentsByMonthChart data={monthData} />
              <StateChart data={stateData} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <PriorityChart data={priorityData} />
              <AssignmentGroupChart data={groupData} />
            </div>
          </>
        )}

        {/* === CLOSE TIME === */}
        {section === "Close Time" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 16 }}>
              <KpiCard title="Avg Close Time" value={closeKpis.avg} color="blue" badge="Avg" icon="⏱" sub="From open to last update" />
              <KpiCard title="Median Close Time" value={closeKpis.median} color="purple" badge="Median" icon="📊" />
              <KpiCard title="Fastest Closed" value={closeKpis.fastest} color="green" badge="Best" icon="⚡" />
              <KpiCard title="Slowest Closed" value={closeKpis.slowest} color="red" badge="Worst" icon="🐢" />
            </div>
            <CloseTimeDistribution data={distData} />
          </>
        )}

        {/* === SLOW TICKETS === */}
        {section === "Slow Tickets" && (
          <Top20SlowTickets tickets={slowTickets} />
        )}

        {/* === TEAM INACTIVITY === */}
        {section === "Team Inactivity" && (
          <TeamInactivity data={inactivityData} />
        )}

      </div>
    </div>
  );
}
