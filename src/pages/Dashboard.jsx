import { useMemo, useState } from "react";
import KpiCard from "../components/KpiCard";
import IncidentsByMonthChart from "../components/IncidentsByMonthChart";
import PriorityChart from "../components/PriorityChart";
import StateChart from "../components/StateChart";
import AssignmentGroupChart from "../components/AssignmentGroupChart";
import { groupBy, incidentsByMonth } from "../utils/parseIncidents";

export default function Dashboard({ incidents }) {
  const [search, setSearch] = useState("");

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

  const kpis = useMemo(() => {
    const total = filtered.length;
    const critical = filtered.filter((i) => i.priority === "1 - Critical").length;
    const resolved = filtered.filter((i) => i.state === "Resolved").length;
    const closed = filtered.filter((i) => i.state === "Closed").length;
    return { total, critical, resolved, closed };
  }, [filtered]);

  const monthData = useMemo(() => incidentsByMonth(filtered), [filtered]);

  const priorityData = useMemo(() => {
    const g = groupBy(filtered, "priority");
    return Object.entries(g)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [filtered]);

  const stateData = useMemo(() => {
    const g = groupBy(filtered, "state");
    return Object.entries(g).map(([name, count]) => ({ name, count }));
  }, [filtered]);

  const groupData = useMemo(() => {
    const g = groupBy(filtered, "assignmentGroup");
    return Object.entries(g)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filtered]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">ServiceNow Incident Dashboard</h1>
          <input
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Search incidents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <KpiCard title="Total Incidents" value={kpis.total.toLocaleString()} color="blue" />
          <KpiCard title="Critical" value={kpis.critical} color="red" />
          <KpiCard title="Resolved" value={kpis.resolved.toLocaleString()} color="yellow" />
          <KpiCard title="Closed" value={kpis.closed.toLocaleString()} color="green" />
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <IncidentsByMonthChart data={monthData} />
          <StateChart data={stateData} />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <PriorityChart data={priorityData} />
          <AssignmentGroupChart data={groupData} />
        </div>
      </div>
    </div>
  );
}
