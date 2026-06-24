"use client";

/** Non-draggable brand mark — CSS background. */
export function BrandLogo({
  className = "",
  size = "hero",
  inverted = false,
}: {
  className?: string;
  size?: "sm" | "md" | "hero";
  inverted?: boolean;
}) {
  const sizes = {
    sm: "w-full h-14",
    md: "w-full h-20",
    hero: "w-full h-full min-h-[55vh]",
  };

  return (
    <div
      className={`select-none pointer-events-none bg-[url('/iTOOLS.svg')] bg-contain bg-center bg-no-repeat ${sizes[size]} ${
        inverted ? "brightness-0 invert" : ""
      } ${className}`}
      role="img"
      aria-label="iTools"
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    />
  );
}
