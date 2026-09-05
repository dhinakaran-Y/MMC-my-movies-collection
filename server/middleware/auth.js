import jwt from "jsonwebtoken";
import User from "#models/user.model";

export async function authMiddleware(req, res, next) {
  // Try Authorization header first (Bearer token)
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith("Bearer")
    ? authHeader.split(" ")[1]
    : null;

  // Extract token from cookies
  // Format: "token=abc123; other=value"
  let cookieToken = null;

  if (req.headers.cookie) {
    const cookies = req.headers.cookie.split(";");
    for (const cookie of cookies) {
      const [key, value] = cookie.trim().split("=");
      if (key === "token" && value) {
        cookieToken = value;
        break;
      }
    }
  }

  const token = bearerToken || cookieToken;

  if (!token) {
    console.warn(
      "[AUTH] Token missing. Cookie header:",
      req.headers.cookie ? "present" : "missing",
      "Auth header:",
      authHeader ? "present" : "missing",
    );
    return res.status(401).json({ error: "Token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Fetch live role from DB so role promotions/changes take effect immediately
    const userDoc = await User.findById(decoded.id, { role: 1 });
    if (userDoc) {
      decoded.role = userDoc.role;
    }
    req.user = decoded;
    next();
  } catch (error) {
    console.error("[AUTH] Token verification failed:", error.message);
    return res.status(401).json({ error: "Invalid token" });
  }
}
