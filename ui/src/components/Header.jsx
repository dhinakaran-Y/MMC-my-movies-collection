"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "./context/AuthContext";
import { useState, useEffect, useCallback } from "react";

function getUserInitials(name) {
  if (!name || typeof name !== "string") return "U";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default function Header() {
  const path = usePathname();
  const { user, loading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/clone-requests/notifications", { credentials: "include" });
        if (res.ok && isMounted) {
          const data = await res.json();
          setNotifCount(data.count || 0);
        }
      } catch (err) {
        // silently ignore
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <header className="sticky top-0 z-50 bg-dark-body1 border-b border-white/30 shadow py-2 px-4 2xl:px-10">
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/">
            <Image
              src={`/mmcLogo.png`}
              alt="mmc-logo"
              width={50}
              height={50}
              priority
              className="w-auto h-auto"
            />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-10 items-center font-semibold">
          <div className="flex space-x-6 items-center">
            <Link
              href={"/"}
              className={path === "/" ? "text-brand" : "text-white"}>
              Home
            </Link>
            {user && (
              <>
                <Link
                  href={"/collections"}
                  className={
                    path === "/collections" ? "text-brand" : "text-white"
                  }>
                  Collection
                </Link>
                {user.role === "admin" && (
                  <Link
                    href={"/admin"}
                    className={path === "/admin" ? "text-brand" : "text-white"}>
                    Dashboard
                  </Link>
                )}
              </>
            )}
            <Link
              href={"/about"}
              className={
                path === "/about" || path === "/why" ? "text-brand" : "text-white"
              }>
              About
            </Link>
          </div>
        </nav>

        {/* Right side - Profile or Guest Auth */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-9 h-9 rounded-full bg-white/10 animate-pulse" />
          ) : user ? (
            <Link href={"/profile"} aria-label="Profile" className="relative">
              {!imageError && user?.profileImage ? (
                <Image
                  src={user.profileImage}
                  alt={user?.name || "Profile"}
                  width={36}
                  height={36}
                  className="w-9 h-9 rounded-full object-cover border border-white/20 shadow hover:scale-105 transition-transform"
                  unoptimized
                  referrerPolicy="no-referrer"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-brand shadow flex justify-center items-center font-bold text-white text-xs tracking-wider hover:scale-105 transition-transform">
                  {getUserInitials(user?.name)}
                </div>
              )}
              {notifCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-amber-500 text-[10px] font-bold text-dark-body1 rounded-full border-2 border-dark-body1 shadow-lg animate-pulse">
                  {notifCount > 9 ? "9+" : notifCount}
                </span>
              )}
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-xs sm:text-sm font-semibold text-white/80 hover:text-white px-2.5 sm:px-3.5 py-1.5 rounded-lg hover:bg-white/10 transition-colors">
                Login
              </Link>
              <Link
                href="/register"
                className="text-xs sm:text-sm font-semibold text-white bg-brand hover:bg-red-700 px-3 sm:px-3.5 py-1.5 rounded-lg shadow-md shadow-brand/20 active:scale-95 transition-all">
                Sign Up
              </Link>
            </div>
          )}

          {/* Hamburger Button*/}
          <button onClick={toggleMenu} className="md:hidden p-2 text-white">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16m-7 6h7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-dark-body1 border-t border-white/10 mt-2 p-4 flex flex-col space-y-4 font-semibold">
          <Link
            href={"/"}
            onClick={toggleMenu}
            className={path === "/" ? "text-brand" : "text-white"}>
            Home
          </Link>
          {user && (
            <>
              <Link
                href={"/collections"}
                onClick={toggleMenu}
                className={
                  path === "/collections" ? "text-brand" : "text-white"
                }>
                Collection
              </Link>
              {user.role === "admin" && (
                <Link
                  href={"/admin"}
                  onClick={toggleMenu}
                  className={path === "/admin" ? "text-brand" : "text-white"}>
                  Dashboard
                </Link>
              )}
            </>
          )}
          <Link
            href={"/about"}
            onClick={toggleMenu}
            className={
              path === "/about" || path === "/why" ? "text-brand" : "text-white"
            }>
            About
          </Link>

          {!loading && !user && (
            <div className="flex flex-col gap-2 pt-3 border-t border-white/10">
              <Link
                href="/login"
                onClick={toggleMenu}
                className="text-center py-2 px-4 rounded-lg border border-white/20 text-white hover:bg-white/10 transition-colors text-sm">
                Login
              </Link>
              <Link
                href="/register"
                onClick={toggleMenu}
                className="text-center py-2 px-4 rounded-lg bg-brand hover:bg-red-700 text-white font-medium transition-colors text-sm shadow-md shadow-brand/20">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
