import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    console.error("🔴 [GOOGLE-CALLBACK] User denied consent:", error);
    return NextResponse.redirect(
      new URL("/login?error=google_denied", request.url),
    );
  }

  if (!code) {
    console.error("🔴 [GOOGLE-CALLBACK] No authorization code received");
    return NextResponse.redirect(
      new URL("/login?error=no_code", request.url),
    );
  }

  try {
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    console.log("🔵 [GOOGLE-CALLBACK] Exchanging code with backend...");

    const res = await fetch(`${backendUrl}/google-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    if (!res.ok) {
      const errorData = await res.text();
      console.error(
        `🔴 [GOOGLE-CALLBACK] Backend returned ${res.status}:`,
        errorData,
      );
      return NextResponse.redirect(
        new URL("/login?error=google_failed", request.url),
      );
    }

    console.log("✅ [GOOGLE-CALLBACK] Backend authenticated successfully");

    // Forward the Set-Cookie from backend to the browser
    const response = NextResponse.redirect(new URL("/", request.url));
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) {
      response.headers.set("set-cookie", setCookie);
    }

    return response;
  } catch (err) {
    console.error("🔴 [GOOGLE-CALLBACK] Error:", err);
    return NextResponse.redirect(
      new URL("/login?error=server_error", request.url),
    );
  }
}
