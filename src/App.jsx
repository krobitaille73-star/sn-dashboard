import Dashboard from "./pages/Dashboard";
import { useIncidents } from "./hooks/useIncidents";

function App() {
  const { incidents, loading, error }         = useIncidents("/data/incidents.json?v=2");
  const { incidents: openQueue, loading: oqLoading } = useIncidents("/data/open_queue.json?v=1");

  if (loading || oqLoading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
        Loading incidents…
      </div>
    );
  }

  if (error) {
    // M-2: do not render internal URLs or stack traces to the DOM
    console.error("[App] Failed to load incidents data:", error);
    return (
      <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, color: "#ef4444", fontFamily: "monospace" }}>
        <strong>Failed to load incident data</strong>
        <span style={{ fontSize: 13, color: "#6b7280" }}>
          Unable to fetch incidents.json — check the browser console for details.
        </span>
      </div>
    );
  }

  return <Dashboard incidents={incidents} openQueue={openQueue} />;
}

export default App;
