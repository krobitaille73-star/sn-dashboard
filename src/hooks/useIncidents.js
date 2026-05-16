import { useState, useEffect } from "react";
import { parseIncidents } from "../utils/parseIncidents";

export function useIncidents(jsonUrl) {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!jsonUrl) return;
    fetch(jsonUrl)
      .then((r) => r.json())
      .then((rows) => setIncidents(parseIncidents(rows)))
      .catch(setError)
      .finally(() => setLoading(false));
  }, [jsonUrl]);

  return { incidents, loading, error };
}
