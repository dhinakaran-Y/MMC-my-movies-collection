"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import { debugAuthFlow, checkCookieSettings } from "@/utils/debugAuth";

export default function AuthContextProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user;

  const refreshSession = useCallback(async () => {
    console.log("🔵 [refreshSession] Starting...");

    try {
      // Debug: Log cookies before fetch
      console.log("🔵 [refreshSession] Current cookies:", document.cookie);

      const response = await fetch(`/api/me`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log(`🔵 [refreshSession] Response status: ${response.status}`);
      console.log(`🔵 [refreshSession] Response headers:`, response.headers);

      if (!response.ok) {
        const errorData = await response.text();
        if (response.status === 401) {
          console.log("ℹ️ [refreshSession] No active session (unauthenticated)");
        } else {
          console.error(
            `🔴 [refreshSession] Failed with status ${response.status}:`,
            errorData,
          );
        }
        setUser(null);
        return null;
      }

      const data = await response.json();
      console.log("✅ [refreshSession] User data received:", data);

      setUser(data.user);
      return data.user;
    } catch (error) {
      console.error("🔴 [refreshSession] Error:", error);
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    // Check cookies and log on first load
    console.log("🔵 [AuthContextProvider] Initializing...");
    checkCookieSettings();

    (async () => {
      await refreshSession();
      setLoading(false);
    })();
  }, [refreshSession]);

  const login = async () => {
    const me = await refreshSession();
    console.log("auth context logging me: ", me);

    if (me) {
      router.push("/");
    }
  };

  const logout = async () => {
    try {
      await fetch(`/api/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
    } catch (error) {
      console.error("Error logging out:", error);
    }

    setUser(null);
    router.push("/login");
  };

  const value = {
    user,
    setUser,
    loading,
    login,
    logout,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
