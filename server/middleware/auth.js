import jwt from "jsonwebtoken";

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith("Bearer")
    ? authHeader.split(" ")[1]
    : null;

  const cookieToken = req.headers.cookie
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("token="))
    ?.split("=")[1];

  const token = bearerToken || cookieToken;

  if (!token) {
    return res.status(401).json({ error: "Token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next()
  } catch (error) {
    return res.status(401).json({error: "Invalid token"})
  }
}