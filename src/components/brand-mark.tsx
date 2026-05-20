import { cn } from "@/lib/utils";

/**
 * TenApp brand mark — geometric house with an integrated "T".
 * Pure SVG so it scales crisply and inherits theme colors via CSS.
 */
export function BrandMark({
  className,
  title = "TenApp",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-label={title}
      role="img"
      className={cn("h-6 w-6", className)}
    >
      <defs>
        <linearGradient id="tenapp-grad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="oklch(0.72 0.16 160)" />
          <stop offset="1" stopColor="oklch(0.46 0.12 165)" />
        </linearGradient>
      </defs>
      <path
        d="M10 28 L32 8 L54 28 L54 54 Q54 58 50 58 L14 58 Q10 58 10 54 Z"
        fill="url(#tenapp-grad)"
      />
      <rect x="20" y="30" width="24" height="6" rx="1.5" fill="white" />
      <rect x="29" y="30" width="6" height="20" fill="white" />
    </svg>
  );
}

export function BrandLockup({
  className,
  sub,
}: {
  className?: string;
  sub?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <BrandMark className="h-8 w-8" />
      <div className="flex flex-col leading-tight">
        <span className="font-display text-base font-semibold tracking-tight">
          TenApp
        </span>
        {sub ? (
          <span className="text-[10px] uppercase tracking-wider opacity-70">
            {sub}
          </span>
        ) : null}
      </div>
    </div>
  );
}
