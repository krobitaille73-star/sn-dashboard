import Dashboard from "./pages/Dashboard";
import { useIncidents } from "./hooks/useIncidents";

function App() {
  const { incidents, loading, error } = useIncidents("/data/incidents.json");

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
        Loading incidents…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", color: "#ef4444" }}>
        Failed to load data. Place incidents.json in /public/data/.
      </div>
    );
  }

  return <Dashboard incidents={incidents} />;
}

export default App;
