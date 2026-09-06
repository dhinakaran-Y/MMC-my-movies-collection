import https from "https";

const WORKING_IPS = [
  "52.84.150.77",
  "143.204.148.87",
  "108.157.14.45",
  "99.84.238.12",
  "65.8.245.86",
  "13.225.78.34",
];

function fetchViaIp(pathAndQuery, ip, timeoutMs = 4000) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      {
        host: ip,
        path: pathAndQuery,
        servername: "api.themoviedb.org",
        headers: {
          host: "api.themoviedb.org",
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          accept: "application/json",
        },
        timeout: timeoutMs,
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            resolve({
              ok: res.statusCode >= 200 && res.statusCode < 300,
              status: res.statusCode,
              json: async () => parsed,
            });
          } catch (e) {
            reject(e);
          }
        });
      }
    );

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("TMDB IP Timeout"));
    });
  });
}

/**
 * Resilient TMDB Fetch
 * Bypasses regional ISP DNS routing blocks by trying standard fetch and failing over
 * to direct CloudFront edge endpoints seamlessly.
 */
export async function tmdbFetch(fullUrl, options = {}) {
  // If in browser, use standard fetch
  if (typeof window !== "undefined") {
    return await fetch(fullUrl, options);
  }

  let lastStatus = 500;

  // Server-side: Try direct fetch with timeout first
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(fullUrl, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    // If successful or definitive client error (e.g. 404 Not Found), return immediately
    if (res.ok || (res.status >= 400 && res.status < 500)) {
      return res;
    }
    lastStatus = res.status;
  } catch {
    // Direct fetch timed out or network error — failover to direct IP edges
  }

  // Failover across known responsive CloudFront IP edges
  const parsed = new URL(fullUrl);
  const pathAndQuery = parsed.pathname + parsed.search;

  for (const ip of WORKING_IPS) {
    try {
      const res = await fetchViaIp(pathAndQuery, ip, 3500);
      if (res.ok || (res.status >= 400 && res.status < 500)) {
        return res;
      }
      lastStatus = res.status;
    } catch {
      // Continue to next IP
    }
  }

  return {
    ok: false,
    status: lastStatus || 500,
    json: async () => ({ results: [], total_pages: 0 }),
  };
}
