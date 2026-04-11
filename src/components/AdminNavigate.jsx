"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminNavigate() {
  const path = usePathname();

  const navItems = [
    { name: "Dashboard", path: "/admin", icon: "📊" },
    { name: "User Management", path: "/admin/userManagement", icon: "👥" },
  ];

  return (
    <nav className="flex justify-center mb-12">
      <div className="flex bg-dark-body2 p-1.5 rounded-2xl space-x-2 border border-white/5 shadow-2xl backdrop-blur-md">
        {navItems.map((item) => {
          const isActive = path === item.path;

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`
                relative flex items-center gap-3 px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 group
                ${
                  isActive
                    ? "text-white bg-brand shadow-lg shadow-brand/20"
                    : "text-white/40 hover:text-white/80 hover:bg-white/5"
                }
              `}>
              <span
                className={`text-lg transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`}>
                {item.icon}
              </span>
              <span className="tracking-tight">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
