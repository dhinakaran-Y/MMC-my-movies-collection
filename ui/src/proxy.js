import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

async function verifyToken(token) {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
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
    console.error("Proxy: failed to fetch collection:", err);
    return null;
  }
}

export async function proxy(request) {
  const token = request.cookies.get("token")?.value;
  const pathname = request.nextUrl.pathname;

  // ─── /collections — root list page, login required ───
  if (pathname === "/collections") {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
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
        return NextResponse.redirect(new URL("/not-authorized", request.url));
      }

      const payload = await verifyToken(token);
      if (!payload) {
        return NextResponse.redirect(new URL("/login", request.url));
      }

      const userId =
        payload._id?.toString() ||
        payload.id?.toString() ||
        payload.userId?.toString();

      if (userId !== collection.ownerId) {
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
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (payload.role !== "admin") {
      return NextResponse.redirect(new URL("/not-authorized", request.url));
    }
    return NextResponse.next();
  }

  // ─── /profile ───
  if (pathname.startsWith("/profile")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/collections",
    "/collections/:path*",
    "/profile/:path*",
  ],
};
