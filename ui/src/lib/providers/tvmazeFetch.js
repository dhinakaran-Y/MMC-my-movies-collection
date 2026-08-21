import https from "https";

/**
 * Resilient TVmaze Fetch Helper
 * Forces IPv4 (`family: 4`) with browser User-Agent headers to avoid IPv6 timeouts (ETIMEDOUT).
 */
export function tvmazeFetch(url, options = {}) {
  // Client-side: use native browser fetch
  if (typeof window !== "undefined") {
    return fetch(url, options);
  }

  // Server-side: use https.get with family: 4 and standard headers
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,application/json,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      Connection: "keep-alive",
      ...(options.headers || {}),
    };

    const req = https.get(
      {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port || 443,
        path: parsed.pathname + parsed.search,
        family: 4,
        headers,
        timeout: 10000,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            text: async () => data,
            json: async () => JSON.parse(data),
          });
        });
      }
    );

    req.on("error", (err) => {
      reject(err);
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`TVmaze fetch timeout for ${url}`));
    });
  });
}
