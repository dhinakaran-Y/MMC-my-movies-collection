"use client";

import Link from "next/link";
import Image from "next/image";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState } from "react";

const schema = z
  .object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Eye icons
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

// error message
function FieldError({ message }) {
  if (!message) return null;
  return (
    <p className="text-red-400 text-xs mt-1 ml-1 flex items-center gap-1">
      <span>!</span> {message}
    </p>
  );
}

export default function RegisterDiv() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function submitRegister(formData) {
    setIsLoading(true);
    setServerError("");

    try {
      const response = await fetch(`/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setServerError(data.error || "Registration failed. Please try again.");
        return;
      }

      alert(data.message);
      reset();
      router.push("/login");
    } catch (err) {
      console.error("Error registering:", err);
      setServerError(
        "Unable to connect to the server. Please try again later.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-lg bg-dark-body2/40 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl z-10">
      {/* header */}
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

      {/*error banner */}
      {serverError && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
          <span>✕</span>
          <span>{serverError}</span>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit(submitRegister)}>
        {/* Name */}
        <div className="space-y-1.5">
          <label
            className="text-xs font-semibold text-white/60 uppercase ml-1"
            htmlFor="name">
            Name
          </label>
          <input
            id="name"
            type="text"
            placeholder="Dhinakaran"
            autoFocus
            className={`w-full px-4 py-3 rounded-xl border bg-black/20 text-white focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all placeholder:text-white/10 ${
              errors.name ? "border-red-500/60" : "border-white/10"
            }`}
            {...register("name")}
          />
          <FieldError message={errors.name?.message} />
        </div>

        {/* email */}
        <div className="space-y-1.5">
          <label
            className="text-xs font-semibold text-white/60 uppercase ml-1"
            htmlFor="email">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            placeholder="dhinakaran@example.com"
            className={`w-full px-4 py-3 rounded-xl border bg-black/20 text-white focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all placeholder:text-white/10 ${
              errors.email ? "border-red-500/60" : "border-white/10"
            }`}
            {...register("email")}
          />
          <FieldError message={errors.email?.message} />
        </div>

        {/* password */}
        <div className="space-y-1.5">
          <label
            className="text-xs font-semibold text-white/60 uppercase ml-1"
            htmlFor="password">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••"
              className={`w-full px-4 py-3 pr-11 rounded-xl border bg-black/20 text-white focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all placeholder:text-white/10 ${
                errors.password ? "border-red-500/60" : "border-white/10"
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

        {/* confirm password */}
        <div className="space-y-1.5">
          <label
            className="text-xs font-semibold text-white/60 uppercase ml-1"
            htmlFor="confirmPassword">
            Re-Enter Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Re-enter your password"
              className={`w-full px-4 py-3 pr-11 rounded-xl border bg-black/20 text-white focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all placeholder:text-white/10 ${
                errors.confirmPassword ? "border-red-500/60" : "border-white/10"
              }`}
              {...register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
              tabIndex={-1}
              aria-label={
                showConfirmPassword ? "Hide password" : "Show password"
              }>
              {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          <FieldError message={errors.confirmPassword?.message} />
        </div>

        {/* submit button */}
        <button
          type="submit"
          disabled={!isValid || isLoading}
          className="w-full bg-brand hover:bg-red-700 cursor-pointer text-white font-bold py-4 rounded-2xl shadow-xl shadow-brand/20 active:scale-[0.97] transition-all mt-4 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
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
              Creating Account...
            </>
          ) : (
            "Create My Account"
          )}
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
