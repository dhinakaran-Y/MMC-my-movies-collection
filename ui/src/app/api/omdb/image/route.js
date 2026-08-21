import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

let fallbackBuffer = null;

function getFallbackImage() {
  if (fallbackBuffer) return fallbackBuffer;
  try {
    const fallbackPath = path.join(process.cwd(), "public", "fallbackImg.png");
    fallbackBuffer = fs.readFileSync(fallbackPath);
    return fallbackBuffer;
  } catch {
    return null;
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl || (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://"))) {
    const fb = getFallbackImage();
    if (fb) {
      return new NextResponse(fb, {
        status: 200,
        headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400" },
      });
    }
    return NextResponse.redirect(new URL("/fallbackImg.png", request.url));
  }

  try {
    const res = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
    });

    if (res.ok) {
      const contentType = res.headers.get("content-type") || "image/jpeg";
      const imageBuffer = await res.arrayBuffer();

      return new NextResponse(imageBuffer, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
        },
      });
    }
  } catch (err) {
    // Upstream fetch failed
  }

  // Gracefully serve fallback image buffer as 200 OK
  const fb = getFallbackImage();
  if (fb) {
    return new NextResponse(fb, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400",
      },
    });
  }

  return NextResponse.redirect(new URL("/fallbackImg.png", request.url));
}
