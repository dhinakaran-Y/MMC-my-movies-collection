"use client";

import Link from "next/link";
import Image from "next/image";

export default function RegisterDiv() {
  return (
    <div className="w-full max-w-lg bg-dark-body2/40 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl z-10">
      {/* Header */}
      <div className="flex flex-col items-center mb-10">
        <Image
          src="/mmcLogo.png"
          alt="MMC Logo"
          width={70}
          height={70}
          className="mb-4"
        />
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Create Account
        </h1>
        <p className="text-white/40 mt-2 text-center">
          Join MMC to save your movie collection on web.
        </p>
      </div>

      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        {/* Name */}
        <div className="space-y-1.5">
          <label
            className="text-xs font-semibold text-white/60 uppercase ml-1"
            htmlFor="userName">
            Name
          </label>
          <input
            id="userName"
            name="userName"
            type="text"
            placeholder="John"
            className="w-full px-4 py-3 rounded-xl border border-white/10 bg-black/20 text-white focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all placeholder:text-white/10"
          />
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label
            className="text-xs font-semibold text-white/60 uppercase ml-1"
            htmlFor="userEmail">
            Email Address
          </label>
          <input
            id="userEmail"
            name="userEmail"
            type="email"
            placeholder="john@example.com"
            className="w-full px-4 py-3 rounded-xl border border-white/10 bg-black/20 text-white focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all placeholder:text-white/10"
          />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label
            className="text-xs font-semibold text-white/60 uppercase ml-1"
            htmlFor="userPass">
            Password
          </label>
          <input
            id="userPass"
            name="userPass"
            type="password"
            placeholder="******"
            className="w-full px-4 py-3 rounded-xl border border-white/10 bg-black/20 text-white focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all placeholder:text-white/10"
          />
        </div>

        {/* re-Password */}
        <div className="space-y-1.5">
          <label
            className="text-xs font-semibold text-white/60 uppercase ml-1"
            htmlFor="userRePass">
            Re-Enter Password
          </label>
          <input
            id="userRePass"
            name="userRePass"
            type="password"
            placeholder="Enter the same Password above *******"
            className="w-full px-4 py-3 rounded-xl border border-white/10 bg-black/20 text-white focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all placeholder:text-white/10"
          />
        </div>

        {/* Terms Checkbox */}
        <div className="flex items-start gap-3 py-2">
          <input
            type="checkbox"
            id="terms"
            className="mb-1 w-4 h-4 rounded border-white/20 bg-black/40 accent-brand cursor-pointer"
          />
          <label
            htmlFor="terms"
            className="text-xs text-white/50 leading-relaxed cursor-pointer">
            <span>I agree to the </span>
            <span className="text-white/80 underline">
              Terms of Service
            </span>{" "}
            <span>and </span>
            <span className="text-white/80 underline">Privacy Policy</span>.
          </label>
        </div>

        {/* Register Button */}
        <button
          type="submit"
          className="w-full bg-brand hover:bg-red-700 cursor-pointer text-white font-bold py-4 rounded-2xl shadow-xl shadow-brand/20 active:scale-[0.97] transition-all mt-4">
          Create My Account
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-white/5 text-center">
        <p className="text-white/40 text-sm">
          Already a member?{" "}
          <Link
            href="/login"
            className="text-brand font-bold hover:underline ml-1">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}
