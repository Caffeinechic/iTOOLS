"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand/brand-logo";
import { AuthShell } from "@/components/layout/auth-shell";
import { AuthModeTabs } from "@/components/auth/auth-mode-tabs";
import { GoogleSignIn } from "@/components/auth/google-sign-in";
import { AlertBanner, FormField } from "@/components/patterns";
import { authenticate, setAccessToken, type AuthMode } from "@/lib/auth";
import { authFieldClass } from "@/lib/tokens";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const pathname = usePathname();
  const mode: AuthMode = pathname === "/register" ? "signup" : "signin";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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

    const result = await authenticate(mode, {
      name: name.trim(),
      email: email.trim(),
      password,
    });

    if (result.ok && result.token) {
      setAccessToken(result.token);
      router.push("/dashboard");
    } else {
      setErrorMsg(result.error || "Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  return (
    <AuthShell>
      <div className="auth-elevated-card">
        <div className="lg:hidden mb-7 flex justify-center">
          <BrandLogo size="lg" inPill />
        </div>

        <AuthModeTabs activeHref={pathname} />

        <div key={pathname} className="animate-auth-panel-in space-y-5 mt-6">
          <GoogleSignIn onError={setErrorMsg} />

          <div className="auth-divider">
            <span>or continue with email</span>
          </div>

          {errorMsg && <AlertBanner variant="error">{errorMsg}</AlertBanner>}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {mode === "signup" && (
              <FormField id="name" label="Full name">
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  autoComplete="name"
                  className={authFieldClass}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </FormField>
            )}

            <FormField id="email" label="Email">
              <Input
                id="email"
                type="email"
                placeholder="chair@ieeesb.org"
                autoComplete="email"
                className={authFieldClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </FormField>

            <FormField id="password" label="Password">
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={mode === "signup" ? "Minimum 8 characters" : "Your password"}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  className={cn(authFieldClass, "pr-10")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-r-2xl"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </FormField>

            {mode === "signup" && (
              <FormField id="confirm" label="Confirm password">
                <Input
                  id="confirm"
                  type={showPassword ? "text" : "password"}
                  placeholder="Repeat password"
                  autoComplete="new-password"
                  className={authFieldClass}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </FormField>
            )}

            <Button
              type="submit"
              variant="brand"
              disabled={loading}
              aria-busy={loading}
              className="w-full h-11 rounded-full font-semibold"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                  Please wait...
                </span>
              ) : mode === "signin" ? (
                "Sign in"
              ) : (
                "Create account"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground pt-1">
            {mode === "signin" ? (
              <>
                No account?{" "}
                <Link href="/register" className="text-brand font-medium hover:underline">
                  Sign up
                </Link>
              </>
            ) : (
              <>
                Have an account?{" "}
                <Link href="/login" className="text-brand font-medium hover:underline">
                  Sign in
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </AuthShell>
  );
}
