"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";

export default function AuthContextProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const isAuthenticated = !!user;

  const refreshSession = useCallback(async () => {
    console.log("refresh");
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/me`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        setUser(null);
        return null;
      }

      const data = await response.json();
      console.log(data);
      
      setUser(data.user);
      
      return data.user;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    // console.log("AuthContextProvider IS LOADING!");
    // console.log("user:??",user);
    
    (async () => {
      await refreshSession();
      setLoading(false);
    })();
  }, [refreshSession]);

  const login = async () => {
    const me = await refreshSession();
    console.log("auth context logging me: ",me);

    if (me) {
      router.push("/");
    }
  };

  const logout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/logout`, {
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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
