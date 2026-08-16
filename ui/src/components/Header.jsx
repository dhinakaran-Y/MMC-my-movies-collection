"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "./context/AuthContext";
import { useState } from "react";

export default function Header() {
  const path = usePathname();
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
              href={"/why"}
              className={path === "/why" ? "text-brand" : "text-white"}>
              Why ?
            </Link>
          </div>
        </nav>

        {/* Right side - mobile*/}
        <div className="flex items-center gap-4">
          <Link href={"/profile"}>
            <div className="w-9 h-9 rounded-full bg-brand shadow flex justify-center items-center font-bold text-white">
              {user ? user.name.charAt(0).toUpperCase() : "G"}
            </div>
          </Link>

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
          {user && (
            <>
              <Link
                href={"/"}
                onClick={toggleMenu}
                className={path === "/" ? "text-brand" : "text-white"}>
                Home
              </Link>
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
            href={"/why"}
            onClick={toggleMenu}
            className={path === "/why" ? "text-brand" : "text-white"}>
            Why ?
          </Link>
        </div>
      )}
    </header>
  );
}
