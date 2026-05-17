import { useState, useEffect } from "react";
import { parseIncidents } from "../utils/parseIncidents";

export function useIncidents(jsonUrl) {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!jsonUrl) return;
    fetch(jsonUrl)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status} — ${r.url}`);
        // Use text() then JSON.parse() — Safari's response.json() streaming
        // parser rejects certain valid JSON that JSON.parse() handles fine.
        return r.text();
      })
      .then((text) => JSON.parse(text))
      .then((rows) => setIncidents(parseIncidents(rows)))
      .catch((err) => {
        console.error("[useIncidents]", err);
        setError(err);
      })
      .finally(() => setLoading(false));
  }, [jsonUrl]);

  return { incidents, loading, error };
}
