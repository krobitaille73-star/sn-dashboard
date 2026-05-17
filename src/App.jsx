import Dashboard from "./pages/Dashboard";
import { useIncidents } from "./hooks/useIncidents";

function App() {
  const { incidents, loading, error } = useIncidents("/data/incidents.json?v=2");

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
        Loading incidents…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, color: "#ef4444", fontFamily: "monospace" }}>
        <strong>Failed to load incidents.json</strong>
        <span style={{ fontSize: 13, color: "#6b7280" }}>{error?.message ?? String(error)}</span>
      </div>
    );
  }

  return <Dashboard incidents={incidents} />;
}

export default App;
