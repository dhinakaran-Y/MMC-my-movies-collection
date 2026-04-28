// export function requireAdmin(req, res, next) {
//   if (!req.user) return res.status(401).json({ error: "Unauthorized" });
//   if (req.user.role !== "admin") {
//     return res.status(403).json({ error: "Access denied: Admins only" });
//   }
//   next();
// }

// 2. Admin Check (Authorization) - Ensures the user is an admin
export const isAdmin = (req, res, next) => {
  // req.user is populated by the verifyToken middleware above
  if (req.user && req.user.role === "admin") {
    next(); // Admin found, proceed to the controller
  } else {
    // 403 Forbidden: The user is logged in, but not allowed to be here
    res.status(403).json({ message: "Access Denied: Admins only" });
  }
};