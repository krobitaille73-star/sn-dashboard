import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LabelList,
} from "recharts";

const BAR_HEIGHT = 36;   // px per bar
const CHART_PADDING = 60; // top + bottom margin

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, count } = payload[0].payload;
  return (
    <div style={{ background: "#1e293b", color: "#f8fafc", borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
      <strong style={{ display: "block", marginBottom: 4 }}>{name}</strong>
      {count.toLocaleString()} tickets
    </div>
  );
}

export default function AssignmentGroupChart({ data }) {
  const chartHeight = data.length * BAR_HEIGHT + CHART_PADDING;

  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,.08)" }}>
      <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#374151" }}>
        All Assignment Groups
      </p>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 56, left: 0, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fontSize: 11 }}
            width={220}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
            <LabelList
              dataKey="count"
              position="right"
              formatter={(v) => v.toLocaleString()}
              style={{ fontSize: 11, fill: "#6b7280", fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
