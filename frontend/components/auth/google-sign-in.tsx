"use client";

import { useEffect, useRef, useState } from "react";
import { authenticateWithGoogle, setAccessToken } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { GoogleIcon } from "@/components/brand/google-icon";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const IS_CONFIGURED = Boolean(CLIENT_ID);

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, string | number | boolean>
          ) => void;
        };
      };
    };
  }
}

function GoogleFallbackButton({ disabled, loading }: { disabled?: boolean; loading?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cn(
        "relative w-full h-11 inline-flex items-center justify-center gap-3 rounded-full",
        "border border-border/80 bg-card text-sm font-medium text-brand-deep",
        "shadow-sm transition-colors",
        "hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-card"
      )}
      aria-label="Continue with Google"
      title={disabled ? "Google sign-in is not configured yet" : undefined}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <GoogleIcon className="h-[18px] w-[18px] shrink-0" />
      )}
      <span>Continue with Google</span>
    </button>
  );
}

export function GoogleSignIn({
  onError,
  className,
}: {
  onError: (message: string) => void;
  className?: string;
}) {
  const router = useRouter();
  const hostRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [gsiReady, setGsiReady] = useState(false);

  useEffect(() => {
    if (!IS_CONFIGURED || !hostRef.current) return;

    const mount = () => {
      if (!window.google?.accounts?.id || !hostRef.current) return;

      window.google.accounts.id.initialize({
        client_id: CLIENT_ID!,
        callback: async ({ credential }) => {
          setLoading(true);
          onError("");
          const result = await authenticateWithGoogle(credential);
          if (result.ok && result.token) {
            setAccessToken(result.token);
            router.push("/dashboard");
          } else {
            onError(result.error || "Google sign-in failed.");
            setLoading(false);
          }
        },
      });

      const el = hostRef.current;
      el.innerHTML = "";
      const slot = document.createElement("div");
      slot.className = "gsi-slot w-full flex justify-center";
      el.appendChild(slot);

      window.google.accounts.id.renderButton(slot, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        width: Math.min(360, el.offsetWidth || 360),
      });
      setGsiReady(true);
    };

    if (window.google?.accounts?.id) {
      mount();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = mount;
    document.head.appendChild(script);
  }, [onError, router]);

  if (!IS_CONFIGURED) {
    return (
      <div className={className}>
        <GoogleFallbackButton disabled />
      </div>
    );
  }

  return (
    <div className={cn("relative w-full min-h-[44px]", className)}>
      {!gsiReady && (
        <div className="absolute inset-0 z-0">
          <GoogleFallbackButton loading />
        </div>
      )}
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-card/90">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
      <div
        ref={hostRef}
        className={cn(
          "relative z-10 w-full flex justify-center [&_.gsi-slot]:w-full",
          !gsiReady && "opacity-0 pointer-events-none"
        )}
      />
    </div>
  );
}
