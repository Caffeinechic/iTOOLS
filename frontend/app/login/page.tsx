"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { User, Lock, Eye, EyeOff, Shield } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
      const res = await fetch(`${apiBase}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      let data: { token?: string; error?: string | { message?: string } } = {};
      try {
        data = await res.json();
      } catch {
        setErrorMsg("Cannot reach the API server. Is the backend running on port 4000?");
        return;
      }
      if (res.ok && data.token) {
        document.cookie = `access_token=${data.token}; path=/; max-age=900`;
        router.push("/dashboard");
      } else {
        const err = data.error;
        setErrorMsg(
          typeof err === "string"
            ? err
            : err?.message || `Login failed (${res.status})`
        );
      }
    } catch {
      setErrorMsg("Cannot reach the API server. Start the backend: cd backend && python -m uvicorn app.main:app --reload --port 4000");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white flex flex-col md:flex-row overflow-hidden font-sans">
      {/* Left Column - Form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 md:px-16 lg:px-24 z-10 bg-white">
        <div className="max-w-sm w-full space-y-8 flex flex-col">
          {/* Logo Section */}
          <div className="text-center space-y-3 flex flex-col items-center">
            <div className="w-16 h-16 bg-[#0f172a] rounded-[22px] flex items-center justify-center shadow-lg transform rotate-6 transition-all hover:rotate-0">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div className="mt-4">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">iTools</h1>
              <p className="text-xs text-slate-500 font-medium tracking-wide mt-0.5">Authentication Portal</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {errorMsg && (
              <div className="bg-red-50 border border-red-200/80 rounded-xl p-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full shrink-0 animate-ping"></div>
                <p className="text-[11px] text-red-600 font-semibold">{errorMsg}</p>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-slate-700 ml-2">Official Email</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="chair@ieeesb.org"
                  className="pl-11 pr-4 py-6 rounded-full border-slate-200 text-slate-900 focus-visible:ring-slate-950 focus-visible:border-slate-950 bg-white placeholder-slate-400 text-sm shadow-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-2">
                <Label htmlFor="password" className="text-xs font-semibold text-slate-700">Password</Label>
                <span className="text-[10px] text-slate-400 font-medium hover:text-slate-600 cursor-pointer">Forgot?</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-11 pr-12 py-6 rounded-full border-slate-200 text-slate-900 focus-visible:ring-slate-950 focus-visible:border-slate-950 bg-white placeholder-slate-400 text-sm shadow-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2 pl-2">
              <input 
                type="checkbox" 
                id="remember" 
                className="w-3.5 h-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-950" 
              />
              <label htmlFor="remember" className="text-[11px] text-slate-500 font-medium select-none">Remember me</label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full py-6 rounded-full bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold transition-all duration-200 text-sm shadow-md mt-2"
              disabled={loading}
            >
              {loading ? "AUTHENTICATING..." : "LOGIN"}
            </Button>
          </form>

          {/* Carousel Progress Indicators */}
          <div className="flex justify-center items-center gap-1.5 pt-4">
            <span className="w-5 h-1.5 rounded-full bg-slate-900"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
          </div>

          <div className="text-center">
            <p className="text-[11px] text-slate-400 font-medium">
              Demo: any EC email (e.g. <span className="text-slate-600">chair@ieeesb.org</span>) with password <span className="text-slate-600">admin123</span>
            </p>
          </div>
        </div>
      </div>

      {/* Right Column - Decorative Navy Panel */}
      <div className="hidden md:flex flex-1 bg-[#0a1128] relative overflow-hidden items-center justify-center">
        {/* Abstract Background Blur Rings */}
        <div className="absolute w-[500px] h-[500px] bg-indigo-500/10 rounded-full filter blur-3xl -top-20 -right-20"></div>
        <div className="absolute w-[400px] h-[400px] bg-slate-500/10 rounded-full filter blur-3xl -bottom-20 -left-20"></div>

        {/* Welcome Card Container */}
        <div className="relative z-10 w-3/4 max-w-md p-8 bg-white/5 border border-white/10 rounded-[32px] backdrop-blur-md shadow-2xl flex flex-col items-center justify-center text-center transform -rotate-1 hover:rotate-0 transition-transform duration-500 group">
          <div className="w-full aspect-square max-w-[260px] rounded-[24px] border border-white/10 flex flex-col items-center justify-center p-6 relative overflow-hidden bg-gradient-to-br from-white/5 to-white/0">
            {/* Visual Circular Frame */}
            <div className="absolute inset-4 rounded-full border border-dashed border-white/20 flex items-center justify-center animate-spin-slow"></div>
            <h2 className="text-white text-3xl font-extrabold tracking-wider group-hover:scale-105 transition-transform duration-300">Welcome</h2>
            <div className="w-16 h-0.5 bg-white/60 my-4"></div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-1">iTools Operating System</p>
          </div>
          <div className="mt-8 space-y-2">
            <h3 className="text-white text-lg font-bold">Executive Committee Operations</h3>
            <p className="text-slate-400 text-xs max-w-xs mx-auto leading-relaxed">
              Standardized planning pipelines, membership rosters, and secure communications in a unified hub.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
