/**
 * Debug utilities for authentication issues
 * Use these to diagnose cookie/credentials problems
 */

export async function debugAuthFlow() {
  console.log("\n=== 🔍 AUTH DEBUG REPORT ===\n");

  // 1. Check cookies
  const cookies = document.cookie;
  console.log("1️⃣ Client-side cookies:", cookies || "(none)");

  const tokenCookie = document.cookie
    .split(";")
    .find((c) => c.trim().startsWith("token="));
  console.log("   Token cookie:", tokenCookie ? "✅ FOUND" : "❌ MISSING");

  // 2. Check API URL
  const apiUrl = "/api";
  console.log("2️⃣ API URL:", apiUrl);
  console.log("   Is HTTPS:", apiUrl?.includes("https") ? "✅ Yes" : "❌ No");
  console.log(
    "   Is cross-domain:",
    !apiUrl?.includes("localhost") ? "✅ Yes" : "❌ No",
  );

  // 3. Test fetch with credentials
  console.log("\n3️⃣ Testing fetch to /me endpoint...");
  try {
    const response = await fetch(`/api/me`, {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    console.log("   Status:", response.status);
    console.log("   Status OK:", response.ok ? "✅ Yes" : "❌ No");

    // Log response headers
    console.log("   Response headers:");
    response.headers.forEach((value, header) => {
      if (
        header.toLowerCase().includes("cookie") ||
        header.toLowerCase().includes("set-cookie")
      ) {
        console.log(`     ${header}: ${value}`);
      }
    });

    const data = await response.json();
    console.log("   Response:", data);

    if (response.ok && data.user) {
      console.log("\n✅ Auth is working! User:", data.user.email);
    } else {
      console.log("\n❌ Auth failed. Check backend logs for details.");
    }

    return { success: response.ok, data, status: response.status };
  } catch (error) {
    console.error("   ❌ Fetch error:", error.message);
    return { success: false, error: error.message };
  }
}

export function checkCookieSettings() {
  console.log("\n=== 🍪 COOKIE SETTINGS ===\n");

  const tokenCookie = document.cookie
    .split(";")
    .find((c) => c.trim().startsWith("token="));

  if (!tokenCookie) {
    console.log("❌ No token cookie found");
    return;
  }

  console.log("✅ Token cookie found");
  console.log("   Value length:", tokenCookie.length, "characters");

  // Try to decode JWT
  try {
    const token = tokenCookie.split("=")[1];
    const parts = token.split(".");
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      console.log("   Decoded payload:", payload);
      console.log("   Expires:", new Date(payload.exp * 1000).toLocaleString());
    }
  } catch (e) {
    console.log("   (Could not decode JWT)");
  }
}

// Add to window for easy access in DevTools console
if (typeof window !== "undefined") {
  window.__debugAuth = {
    debug: debugAuthFlow,
    checkCookies: checkCookieSettings,
  };
  console.log(
    "\n🔧 Debug tools available in console:\nwindow.__debugAuth.debug()\nwindow.__debugAuth.checkCookies()",
  );
}
