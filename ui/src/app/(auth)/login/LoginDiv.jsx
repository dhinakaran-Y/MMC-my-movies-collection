"use client";

import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/context/AuthContext";
import { useState } from "react";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

function EyeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function FieldError({ message }) {
  if (!message) return null;
  return (
    <p className="text-red-400 text-xs mt-1 ml-1 flex items-center gap-1">
      <span>!</span> {message}
    </p>
  );
}

export default function LoginDiv() {
  const { login } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setServerError("");

    try {
      console.log("🔵 [Login] Submitting login request...");
      console.log("🔵 [Login] Cookies before login:", document.cookie);

      const res = await fetch(`/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: data.email, password: data.password }),
      });

      console.log("🔵 [Login] Response status:", res.status);
      console.log("🔵 [Login] Response headers:", res.headers);

      const result = await res.json();
      console.log("🔵 [Login] Response body:", result);
      console.log("🔵 [Login] Cookies after login:", document.cookie);

      if (res.ok) {
        // FALLBACK: If cookie wasn't set by backend, set it manually from response
        const tokenCookie = document.cookie
          .split(";")
          .find((c) => c.trim().startsWith("token="));

        if (!tokenCookie && result.token) {
          console.log(
            "⚠️ [Login] Cookie not set by server, setting manually...",
          );
          // Set cookie with 1-hour expiration (matching backend)
          // Note: JavaScript can't set SameSite=None; server must do that
          const expirationDate = new Date();
          expirationDate.setTime(expirationDate.getTime() + 60 * 60 * 1000);
          const expires = expirationDate.toUTCString();
          document.cookie = `token=${result.token}; path=/; expires=${expires}`;
          console.log("✅ [Login] Cookie set manually (frontend fallback)");
        } else if (tokenCookie) {
          console.log("✅ [Login] Cookie already set by server");
        }

        console.log("✅ [Login] Success! Calling auth context login()...");
        await login();
        console.log("✅ [Login] Redirecting to home...");
        router.push("/");
      } else {
        setServerError(result.error || "Login failed. Please try again.");
        console.error("🔴 [Login] Error:", result.error);
      }
    } catch (error) {
      console.error("🔴 [Login] Error:", error.message);
      setServerError(
        "Unable to connect to the server. Please try again later.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-dark-body2/50 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">
      {/* logo */}
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

      {/* error banner */}
      {serverError && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
          <span>✕</span>
          <span>{serverError}</span>
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        {/* email */}
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-white/70 ml-1"
            htmlFor="email">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            autoFocus
            placeholder="name@example.com"
            className={`w-full px-4 py-3 rounded-xl border bg-dark-body1 text-white focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all placeholder:text-white/20 ${
              errors.email ? "border-red-500/60" : "border-white/20"
            }`}
            {...register("email")}
          />
          <FieldError message={errors.email?.message} />
        </div>

        {/* password */}
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-white/70 px-1"
            htmlFor="password">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className={`w-full px-4 py-3 pr-11 rounded-xl border bg-dark-body1 text-white focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all placeholder:text-white/20 ${
                errors.password ? "border-red-500/60" : "border-white/20"
              }`}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          <FieldError message={errors.password?.message} />
        </div>

        {/* login btn */}
        <button
          type="submit"
          disabled={!isValid || isLoading}
          className="w-full bg-brand cursor-pointer hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-brand/20 active:scale-[0.98] transition-all mt-2 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          {isLoading ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1em"
                height="1em"
                viewBox="0 0 24 24">
                <circle cx="12" cy="2" r="0" fill="currentColor">
                  <animate
                    attributeName="r"
                    begin="0"
                    calcMode="spline"
                    dur="1s"
                    keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8"
                    repeatCount="indefinite"
                    values="0;2;0;0"
                  />
                </circle>
                <circle
                  cx="12"
                  cy="2"
                  r="0"
                  fill="currentColor"
                  transform="rotate(45 12 12)">
                  <animate
                    attributeName="r"
                    begin="0.125s"
                    calcMode="spline"
                    dur="1s"
                    keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8"
                    repeatCount="indefinite"
                    values="0;2;0;0"
                  />
                </circle>
                <circle
                  cx="12"
                  cy="2"
                  r="0"
                  fill="currentColor"
                  transform="rotate(90 12 12)">
                  <animate
                    attributeName="r"
                    begin="0.25s"
                    calcMode="spline"
                    dur="1s"
                    keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8"
                    repeatCount="indefinite"
                    values="0;2;0;0"
                  />
                </circle>
                <circle
                  cx="12"
                  cy="2"
                  r="0"
                  fill="currentColor"
                  transform="rotate(135 12 12)">
                  <animate
                    attributeName="r"
                    begin="0.375s"
                    calcMode="spline"
                    dur="1s"
                    keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8"
                    repeatCount="indefinite"
                    values="0;2;0;0"
                  />
                </circle>
                <circle
                  cx="12"
                  cy="2"
                  r="0"
                  fill="currentColor"
                  transform="rotate(180 12 12)">
                  <animate
                    attributeName="r"
                    begin="0.5s"
                    calcMode="spline"
                    dur="1s"
                    keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8"
                    repeatCount="indefinite"
                    values="0;2;0;0"
                  />
                </circle>
                <circle
                  cx="12"
                  cy="2"
                  r="0"
                  fill="currentColor"
                  transform="rotate(225 12 12)">
                  <animate
                    attributeName="r"
                    begin="0.625s"
                    calcMode="spline"
                    dur="1s"
                    keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8"
                    repeatCount="indefinite"
                    values="0;2;0;0"
                  />
                </circle>
                <circle
                  cx="12"
                  cy="2"
                  r="0"
                  fill="currentColor"
                  transform="rotate(270 12 12)">
                  <animate
                    attributeName="r"
                    begin="0.75s"
                    calcMode="spline"
                    dur="1s"
                    keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8"
                    repeatCount="indefinite"
                    values="0;2;0;0"
                  />
                </circle>
                <circle
                  cx="12"
                  cy="2"
                  r="0"
                  fill="currentColor"
                  transform="rotate(315 12 12)">
                  <animate
                    attributeName="r"
                    begin="0.875s"
                    calcMode="spline"
                    dur="1s"
                    keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8"
                    repeatCount="indefinite"
                    values="0;2;0;0"
                  />
                </circle>
              </svg>
              Signing In...
            </>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      {/* hr */}
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-dark-body2 px-2 text-white/40">Or</span>
        </div>
      </div>

      {/* guest login */}
      <Link
        href={"/"}
        className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 rounded-xl transition-all">
        Continue as Guest
      </Link>

      <p className="text-center text-white/50 text-sm mt-8">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="text-brand font-semibold hover:underline">
          Register Now...
        </Link>
      </p>
    </div>
  );
}
