"use client";

import { cn } from "@/lib/utils";

/** Cropped wordmark from iTOOLS.svg (1067×339). Regenerate: npm run build:wordmark */
const WORDMARK_SRC = "/iTOOLS-wordmark.png";
const WORDMARK_ASPECT = 1067 / 339;

const HEIGHTS = {
  sidebar: 32,
  sm: 30,
  md: 38,
  lg: 48,
  xl: 58,
} as const;

export function BrandIcon({
  className,
  size = 36,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <div
      className={cn(
        "shrink-0 overflow-hidden flex items-center justify-center rounded-lg",
        className
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={WORDMARK_SRC}
        alt=""
        draggable={false}
        className="max-w-none select-none object-contain object-left"
        style={{
          height: Math.round(size * 1.2),
          width: "auto",
        }}
      />
    </div>
  );
}

export function BrandLogo({
  className,
  size = "md",
  centered = false,
  inPill = false,
  variant = "full",
}: {
  className?: string;
  size?: keyof typeof HEIGHTS;
  inverted?: boolean;
  centered?: boolean;
  inPill?: boolean;
  showWordmark?: boolean;
  /** full = wordmark, icon = mark in square frame */
  variant?: "full" | "icon";
}) {
  const height = HEIGHTS[size];

  if (variant === "icon") {
    return <BrandIcon size={height} className={className} />;
  }

  const mark = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={WORDMARK_SRC}
      alt="iTOOLS"
      width={Math.round(height * WORDMARK_ASPECT)}
      height={height}
      draggable={false}
      className={cn(
        "shrink-0 select-none object-contain w-auto max-w-full h-auto",
        centered ? "object-center mx-auto" : "object-left",
        className
      )}
      style={{ height, width: Math.round(height * WORDMARK_ASPECT) }}
    />
  );

  if (inPill) {
    return <div className="auth-logo-pill inline-flex items-center">{mark}</div>;
  }

  return mark;
}

export const BrandMark = BrandLogo;
