import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const COLORS = {
  "1 - Critical": "#ef4444",
  "2 - High": "#f97316",
  "3 - Moderate": "#eab308",
  "4 - Low": "#3b82f6",
};

export default function PriorityChart({ data }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-gray-600">Incidents by Priority</h2>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
          <Tooltip />
          <Bar dataKey="count">
            {data.map((entry) => (
              <Cell key={entry.name} fill={COLORS[entry.name] ?? "#6b7280"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
