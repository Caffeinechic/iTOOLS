"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { BrandLogo } from "@/components/auth/brand-logo";
import { Eye, EyeOff, Loader2 } from "lucide-react";

type AuthMode = "signin" | "signup";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function AuthPage() {
  const router = useRouter();
  const pathname = usePathname();
  const mode: AuthMode = pathname === "/register" ? "signup" : "signin";

  const [mounted, setMounted] = useState(false);
  const [greeting, setGreeting] = useState("Welcome back");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setMounted(true);
    setGreeting(getGreeting());
  }, []);

  const handleSuccess = (token: string) => {
    document.cookie = `access_token=${token}; path=/; max-age=900`;
    router.push("/dashboard");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    if (mode === "signup" && password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      setLoading(false);
      return;
    }
    if (mode === "signup" && password.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }

    try {
      const endpoint = mode === "signin" ? "/auth/login" : "/auth/register";
      const payload =
        mode === "signin"
          ? { email: email.trim(), password }
          : { name: name.trim(), email: email.trim(), password };

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data: { token?: string; error?: string | { message?: string } } = {};
      try {
        data = await res.json();
      } catch {
        setErrorMsg("Cannot reach the server. Check that the backend is running.");
        return;
      }

      if (res.ok && data.token) {
        handleSuccess(data.token);
      } else {
        const err = data.error;
        setErrorMsg(
          typeof err === "string"
            ? err === "Invalid credentials"
              ? "Invalid email or password. Seeded accounts use admin123 — if this is a fresh install, run seed on the backend database."
              : err
            : err?.message || (mode === "signin" ? "Invalid email or password." : "Registration failed.")
        );
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const title = mode === "signin" ? (mounted ? greeting : "Welcome back") : "Create account";

  return (
    <main className="min-h-screen lg:grid lg:grid-cols-2 bg-[#f8fafc]">
      {/* Brand panel */}
      <section className="relative hidden lg:flex flex-col bg-[#16213e] rounded-r-[2.5rem] z-10 overflow-hidden min-h-screen">
        <div className="flex-1 flex items-center justify-center w-full min-h-0 p-0">
          <BrandLogo size="hero" inverted />
        </div>

        <div className="shrink-0 px-5 pb-5">
          <p className="font-[family-name:var(--font-display)] text-white text-sm font-semibold">
            Executive Committee Operating System
          </p>
          <p className="text-[#64748b] text-xs mt-1">
            Silver Oak University IEEE Student Branch
          </p>
        </div>
      </section>

      {/* Form panel */}
      <section className="flex flex-col justify-center min-h-screen px-5 py-8 sm:px-8">
        <div className="mb-6 lg:hidden">
          <BrandLogo size="md" />
        </div>

        <div className="w-full max-w-[380px] mx-auto">
          <header className="mb-5">
            <h1 className="font-[family-name:var(--font-display)] text-[1.75rem] xl:text-[2rem] font-bold text-[#0f172a] tracking-tight">
              {title}
            </h1>
            <p className="text-[#64748b] text-sm mt-2">
              {mode === "signin"
                ? "Sign in to access the committee dashboard."
                : "Register for workspace access."}
            </p>
          </header>

          <nav className="flex p-0.5 mb-5 bg-[#e2e8f0] rounded-lg" aria-label="Authentication mode">
            <Link
              href="/login"
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg text-center transition-colors duration-200 ${
                mode === "signin" ? "bg-white text-[#0f172a] shadow-sm" : "text-[#64748b] hover:text-[#0f172a]"
              }`}
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg text-center transition-colors duration-200 ${
                mode === "signup" ? "bg-white text-[#0f172a] shadow-sm" : "text-[#64748b] hover:text-[#0f172a]"
              }`}
            >
              Sign up
            </Link>
          </nav>

          <div key={pathname} className="animate-auth-panel-in">
            <form onSubmit={handleSubmit} className="space-y-3" noValidate>
              {errorMsg && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {errorMsg}
                </div>
              )}

              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[#334155] text-sm font-medium">
                    Full name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    autoComplete="name"
                    className="h-11 rounded-xl border-[#cbd5e1] bg-white"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#334155] text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="chair@ieeesb.org"
                  autoComplete="email"
                  className="h-11 rounded-xl border-[#cbd5e1] bg-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#334155] text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={mode === "signup" ? "Minimum 8 characters" : "Your password"}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    className="h-11 rounded-xl border-[#cbd5e1] bg-white pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#94a3b8] hover:text-[#475569]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="confirm" className="text-[#334155] text-sm font-medium">
                    Confirm password
                  </Label>
                  <Input
                    id="confirm"
                    type={showPassword ? "text" : "password"}
                    placeholder="Repeat password"
                    autoComplete="new-password"
                    className="h-11 rounded-xl border-[#cbd5e1] bg-white"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-[#16213e] hover:bg-[#0f172a] text-white font-semibold text-sm mt-1"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Please wait…
                  </span>
                ) : mode === "signin" ? (
                  "Sign in"
                ) : (
                  "Create account"
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-[#64748b] mt-5">
              {mode === "signin" ? (
                <>
                  No account?{" "}
                  <Link href="/register" className="text-[#16213e] font-semibold hover:underline">
                    Sign up
                  </Link>
                </>
              ) : (
                <>
                  Have an account?{" "}
                  <Link href="/login" className="text-[#16213e] font-semibold hover:underline">
                    Sign in
                  </Link>
                </>
              )}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
