"use client";

import BlurText from "@/components/react-bits/BlurText";
import RotatingText from "@/components/react-bits/RotatingText";
import { BrandLogo } from "@/components/brand/brand-logo";

const ROTATING_PHRASES = [
  "executive committees",
  "IEEE Student Branches",
  "task pipelines",
  "budget tracking",
  "member management",
  "communications",
  "committee operations",
];

export function AuthBrandPanel() {
  return (
    <aside className="auth-brand-panel hidden lg:flex flex-col justify-between px-10 py-12 xl:px-14 xl:py-16">
      <div>
        <BrandLogo size="lg" inPill />

        <div className="mt-12 space-y-5">
          <BlurText
            text="Welcome to"
            delay={120}
            animateBy="words"
            direction="top"
            className="text-4xl xl:text-5xl font-semibold text-brand-deep font-display tracking-tight leading-tight"
          />
          <h1 className="text-4xl xl:text-[2.75rem] font-semibold text-brand-deep font-display leading-[1.1] tracking-tight">
            iTOOLS
          </h1>

          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-2 text-xl xl:text-2xl font-display font-semibold text-brand-deep">
            <span className="text-muted-foreground font-medium">iTOOLS for</span>
            <RotatingText
              texts={ROTATING_PHRASES}
              mainClassName="inline-flex items-center px-3 py-1 rounded-xl bg-brand-accent/20 text-brand-deep border border-brand-accent/30"
              splitLevelClassName="overflow-hidden"
              staggerFrom="last"
              staggerDuration={0.02}
              rotationInterval={2800}
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
            />
          </div>
        </div>

        <BlurText
          text="The executive committee operating system for IEEE Student Branches. Pipelines, budget, members, and communications in one workspace."
          delay={40}
          animateBy="words"
          direction="bottom"
          stepDuration={0.25}
          className="mt-8 text-base text-muted-foreground max-w-md leading-relaxed"
        />
      </div>

      <p className="text-xs text-muted-foreground tracking-wide">
        Silver Oak University &middot; IEEE Student Branch
      </p>
    </aside>
  );
}
