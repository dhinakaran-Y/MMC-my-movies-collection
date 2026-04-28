import AdminNavigate from "@/components/adminComponents/AdminNavigate";

export const metadata = {
  title: {
    default: "admin",
    template: "%s | MMC",
  },
  description: "this page is the admin dashboard of MMC",
};

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen text-white p-6 lg:p-10">
      {/* Header */}
      <header className="flex justify-center items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold italic tracking-tighter">
            MMC <span className="text-brand">Admin</span>
          </h1>
          <p className="text-white/40 text-sm">Welcome back, Admin.</p>
        </div>
      </header>

      {/* navigation */}
      <AdminNavigate/>
      
      <main>{children}</main>
    </div>
  );
}
