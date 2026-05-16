export default function KpiCard({ title, value, sub, color = "blue" }) {
  const colors = {
    blue: "border-blue-500 bg-blue-50 text-blue-700",
    red: "border-red-500 bg-red-50 text-red-700",
    green: "border-green-500 bg-green-50 text-green-700",
    yellow: "border-yellow-500 bg-yellow-50 text-yellow-700",
  };
  return (
    <div className={`rounded-xl border-l-4 p-4 shadow-sm ${colors[color]}`}>
      <p className="text-sm font-medium opacity-70">{title}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
      {sub && <p className="mt-1 text-xs opacity-60">{sub}</p>}
    </div>
  );
}
