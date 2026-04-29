import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

console.log("🔴🔴🔴 MIDDLEWARE FILE LOADED 🔴🔴🔴");

async function verifyToken(token) {
  try {
    if (!process.env.JWT_SECRET) {
      console.error("🔴 Middleware: JWT_SECRET is not set in environment");
      return null;
    }
    if (!token) {
      console.error("🔴 Middleware: No token provided");
      return null;
    }
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const verified = await jwtVerify(token, secret);

    if (!verified || !verified.payload) {
      console.error(
        "🔴 Middleware: jwtVerify returned invalid structure:",
        verified,
      );
      return null;
    }

    console.log("✅ Middleware: Token verified successfully. Payload:", {
      id: verified.payload.id,
      email: verified.payload.email,
      role: verified.payload.role,
    });

    return verified.payload;
  } catch (err) {
    console.error("🔴 Middleware: Token verification failed:", err.message);
    return null;
  }
}

async function getCollectionVisibility(collectionId) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/collection/${collectionId}`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return {
      visibility: data?.data?.visibility,
      ownerId: data?.data?.ownerId?.toString(),
    };
  } catch (err) {
    console.error("Middleware: failed to fetch collection:", err);
    return null;
  }
}

export async function middleware(request) {
  console.log("🔴🔴🔴 MIDDLEWARE FUNCTION CALLED 🔴🔴🔴");
  const token = request.cookies.get("token")?.value;
  const pathname = request.nextUrl.pathname;

  console.log(
    `🔍 Middleware: Incoming request to ${pathname}, token exists: ${!!token}`,
  );

  // ─── /collections — root list page, login required ───
  if (pathname === "/collections") {
    if (!token) {
      console.log(
        "🔴 Middleware: /collections - no token, redirecting to /login",
      );
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const payload = await verifyToken(token);
    if (!payload) {
      console.log(
        "🔴 Middleware: /collections - token verification failed, redirecting to /login",
      );
      return NextResponse.redirect(new URL("/login", request.url));
    }
    console.log("✅ Middleware: /collections - access granted");
    return NextResponse.next();
  }

  // ─── /collections/:id — single collection page ───
  if (pathname.startsWith("/collections/")) {
    const collectionId = pathname.split("/collections/")[1]?.split("/")[0];
    if (!collectionId) return NextResponse.next();

    const collection = await getCollectionVisibility(collectionId);

    // If fetch failed, let the page handle it
    if (!collection) return NextResponse.next();

    // ✅ Public — anyone can view
    if (collection.visibility === "public") {
      return NextResponse.next();
    }

    // 🔒 Private — must be logged in AND be the owner
    if (collection.visibility === "private") {
      if (!token) {
        console.log(
          `🔴 Middleware: Private collection ${collectionId} - no token, redirecting to /not-authorized`,
        );
        return NextResponse.redirect(new URL("/not-authorized", request.url));
      }

      const payload = await verifyToken(token);
      if (!payload) {
        console.log(
          `🔴 Middleware: Private collection ${collectionId} - token verification failed`,
        );
        return NextResponse.redirect(new URL("/login", request.url));
      }

      const userId =
        payload._id?.toString() ||
        payload.id?.toString() ||
        payload.userId?.toString();

      if (userId !== collection.ownerId) {
        console.log(
          `🔴 Middleware: Private collection - userId ${userId} != ownerId ${collection.ownerId}`,
        );
        return NextResponse.redirect(new URL("/not-authorized", request.url));
      }

      return NextResponse.next();
    }

    // Unknown visibility — allow through
    return NextResponse.next();
  }

  // ─── /admin ───
  if (pathname.startsWith("/admin")) {
    if (!token) {
      console.log("🔴 Middleware: /admin - no token, redirecting to /login");
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const payload = await verifyToken(token);
    if (!payload) {
      console.log(
        "🔴 Middleware: /admin - token verification failed, redirecting to /login",
      );
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (payload.role !== "admin") {
      console.log(
        `🔴 Middleware: /admin - user role is ${payload.role}, not admin`,
      );
      return NextResponse.redirect(new URL("/not-authorized", request.url));
    }
    console.log("✅ Middleware: /admin - access granted for admin");
    return NextResponse.next();
  }

  // ─── /profile ───
  if (pathname.startsWith("/profile")) {
    if (!token) {
      console.log("🔴 Middleware: /profile - no token, redirecting to /login");
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const payload = await verifyToken(token);
    if (!payload) {
      console.log(
        "🔴 Middleware: /profile - token verification failed, redirecting to /login",
      );
      return NextResponse.redirect(new URL("/login", request.url));
    }
    console.log("✅ Middleware: /profile - access granted");
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
