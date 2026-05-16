import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from "recharts";

const BAR_COLOR = "#3b82f6";

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { label, count } = payload[0].payload;
  return (
    <div style={{ background: "#1e293b", color: "#f8fafc", borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
      <strong>{label}</strong><br />
      {count.toLocaleString()} tickets
    </div>
  );
}

export default function CloseTimeDistribution({ data }) {
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,.08)" }}>
      <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: "#374151" }}>
        Ticket Close-Time Distribution
      </p>
      <p style={{ margin: "0 0 12px", fontSize: 11, color: "#9ca3af" }}>
        Time elapsed from opening to last update — closed &amp; resolved tickets
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={BAR_COLOR} fillOpacity={0.75 + (i / data.length) * 0.25} />
            ))}
            <LabelList
              dataKey="count"
              position="top"
              formatter={(v) => `${((v / total) * 100).toFixed(0)}%`}
              style={{ fontSize: 10, fill: "#6b7280" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
