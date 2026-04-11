"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
// import {mmcLogo} from "/public/mmcLogo.png";

export default function Header() {
  const path = usePathname();
  // console.log(path);

  return (
    <header className="2xl:px-10 flex justify-between items-center bg-dark-body1 border-b border-white/3 shadow py-2">
      {/* left */}
      <div className="flex items-center">
        <Link href="/">
          <Image
            src={`/mmcLogo.png`}
            alt="mmc-logo"
            width={60}
            height={60}
            priority
            style={{ height: "auto", width: "auto" }}
          />
        </Link>
      </div>
      {/* right */}
      <div className="flex space-x-10 items-center">
        <div className="flex space-x-6 *:font-semibold items-center">
          <Link href={"/"} className={`${path === "/" ? "active" : ""}`}>
            Home
          </Link>
          <Link
            href={"/collections"}
            className={`${path === "/collections" ? "active" : ""}`}>
            Collection
          </Link>
          <Link href={"/why"} className={`${path === "/why" ? "active" : ""}`}>
            Why ?
          </Link>
        </div>
        <div className="flex items-center">
          <Link href={"/profile"}>
            <div className="w-10 h-10 rounded-full bg-brand shadow flex justify-center items-center font-bold">
              G
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
