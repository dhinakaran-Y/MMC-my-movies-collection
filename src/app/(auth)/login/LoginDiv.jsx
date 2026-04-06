"use client";

import Link from "next/link";
import Image from "next/image";

export default function LoginDiv() {
    return(
        <div className="w-full max-w-md bg-dark-body2/50 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/">
            <Image
              src="/mmcLogo.png"
              alt="Logo"
              width={80}
              height={80}
              className="hover:scale-105 transition-transform"
            />
          </Link>
          <h1 className="text-2xl font-bold text-white mt-4">Welcome Back</h1>
          <p className="text-white/50 text-sm">Sign in to your MMC account</p>
        </div>

        <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
          {/* Email*/}
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-white/70 ml-1"
              htmlFor="userName">
              Email Address
            </label>
            <input
              id="userName"
              name="userName"
              type="email"
              placeholder="name@example.com"
              className="w-full px-4 py-3 rounded-xl border border-white/20 bg-dark-body1 text-white focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all placeholder:text-white/20"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label
                className="text-sm font-medium text-white/70"
                htmlFor="userPass">
                Password
              </label>
            </div>
            <input
              id="userPass"
              name="userPass"
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-white/20 bg-dark-body1 text-white focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all placeholder:text-white/20"
            />
          </div>

          {/* login btn */}
          <button
            type="submit"
            className="w-full bg-brand cursor-pointer hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-brand/20 active:scale-[0.98] transition-all mt-2">
            Sign In
          </button>
        </form>

        {/* divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-dark-body2 px-2 text-white/40">Or</span>
          </div>
        </div>

        {/* guest */}
        <Link href={"/"} className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 rounded-xl transition-all">
          Continue as Guest
        </Link>

        <p className="text-center text-white/50 text-sm mt-8">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-brand font-semibold hover:underline">
            Register for free
          </Link>
        </p>
      </div>
    )
}