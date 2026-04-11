"use client";

export default function AdminDashboard() {
  const stats = [
    {
      label: "Total Users",
      value: "1,284",
      icon: "👤",
      color: "text-blue-500",
    },
    {
      label: "Movies in Watchlists",
      value: "12,402",
      icon: "🎬",
      color: "text-brand",
    },
    {
      label: "Active Collections",
      value: "452",
      icon: "📁",
      color: "text-green-500",
    },
    // {
    //   label: "API Calls (24h)",
    //   value: "24.5k",
    //   icon: "⚡",
    //   color: "text-amber-500",
    // },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 gap-x-20 mb-10">
      {stats.map((stat, i) => (
        <div
          key={i}
          className="bg-dark-body2 border border-white/5 p-6 rounded-2xl shadow-xl">
          <div className="flex justify-between items-start">
            <span className="text-2xl">{stat.icon}</span>
          </div>
          <p className="text-white/40 text-xs uppercase font-bold mt-4 tracking-widest">
            {stat.label}
          </p>
          <h3 className={`text-3xl font-mono font-bold mt-1 ${stat.color}`}>
            {stat.value}
          </h3>
        </div>
      ))}
    </div>
  );
}