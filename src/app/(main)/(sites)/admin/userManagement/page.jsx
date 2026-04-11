export const metadata = {
  title: {
    title: "userManagement",
    template: "%s | MMC",
  },
  description: "this page is the user management for admin in MMC",
};

export default function UserManagement() {
  const recentUsers = [
    {
      id: "a1",
      name: "Dhinakaran Y",
      email: "dhina@gmail.com",
      role: "Admin",
      status: "Active",
      collectionCount: 20,
      watchedMovies: 50,
    },
    {
      id: "a2",
      name: "Laran",
      email: "laran@gmail.com",
      role: "user",
      status: "Active",
      collectionCount: 10,
      watchedMovies: 30,
    },
    {
      id: "a3",
      name: "Karan",
      email: "karan@gmail.com",
      role: "User",
      status: "Inactive",
      collectionCount: 4,
      watchedMovies: 50,
    },
  ];
  return (
    <>
      {/* Main Content Grid */}
      <div className="justify-items-center">
        {/* User Management Table */}
        <div className="w-full justify-center lg:w-7xl bg-dark-body2 rounded-2xl border border-white/5 overflow-hidden">
          <div className="p-6 border-b border-white/5 flex justify-between items-center">
            <h2 className="font-bold">User Management</h2>
            {/* <button className="text-brand text-xs hover:underline">
              View All
            </button> */}
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="text-white/30 text-[10px] uppercase tracking-tighter border-b border-white/5">
                <th className="px-6 py-4 text-center">S.no</th>
                <th className="px-6 py-4 text-center">Id</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Collection Count</th>
                <th className="px-6 py-4">Watched Movies</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {recentUsers.map((user, index) => (
                <tr
                  key={user.id}
                  className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-white/50 text-center">
                    {++index}
                  </td>
                  <td className="px-6 py-4 text-white/50 text-center">
                    {user.id}
                  </td>
                  <td className="px-6 py-4 font-medium">{user.name}</td>
                  <td className="px-6 py-4 text-white/50">{user.email}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-md text-[10px] ${user.role === "Admin" ? "bg-brand/20 text-brand" : "bg-white/10 text-white/60"}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white/50 text-center">
                    {user.collectionCount}
                  </td>
                  <td className="px-6 py-4 text-white/50 text-center">
                    {user.watchedMovies}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-white/30 hover:text-white mr-3">
                      Edit
                    </button>
                    <button className="text-red-500/50 hover:text-red-500">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* System Logs / Activities */}
        {/* <div className="col-span-12 lg:col-span-4 bg-dark-body2 rounded-2xl border border-white/5 p-6">
          <h2 className="font-bold mb-6">Real-time Activity</h2>
          <div className="space-y-6">
            {[
              "New user registered from Chennai",
              "Tamil language filter popular today",
              "Database backup completed",
              "TMDB API rate limit warning",
            ].map((log, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="w-2 h-2 rounded-full bg-brand mt-1.5 shadow-glow" />
                <div className="space-y-1">
                  <p className="text-xs text-white/80">{log}</p>
                  <p className="text-[10px] text-white/30 italic">2 mins ago</p>
                </div>
              </div>
            ))}
          </div>
        </div> */}
      </div>
    </>
  );
}
