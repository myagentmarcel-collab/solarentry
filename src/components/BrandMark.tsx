/** Original geometric sun mark for Solar Entry — not derived from any third-party logo. */
export function BrandMark({
  className = "h-7 w-7",
  title,
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      {/* Core disc */}
      <circle cx="16" cy="16" r="5.25" fill="#C1121F" />
      {/* Geometric rays — short rectangles at 45° increments */}
      <g fill="#C1121F">
        <rect x="14.75" y="2" width="2.5" height="5" rx="0.4" />
        <rect x="14.75" y="25" width="2.5" height="5" rx="0.4" />
        <rect x="2" y="14.75" width="5" height="2.5" rx="0.4" />
        <rect x="25" y="14.75" width="5" height="2.5" rx="0.4" />
        <rect
          x="14.75"
          y="2"
          width="2.5"
          height="5"
          rx="0.4"
          transform="rotate(45 16 16)"
        />
        <rect
          x="14.75"
          y="2"
          width="2.5"
          height="5"
          rx="0.4"
          transform="rotate(135 16 16)"
        />
        <rect
          x="14.75"
          y="2"
          width="2.5"
          height="5"
          rx="0.4"
          transform="rotate(225 16 16)"
        />
        <rect
          x="14.75"
          y="2"
          width="2.5"
          height="5"
          rx="0.4"
          transform="rotate(315 16 16)"
        />
      </g>
    </svg>
  );
}

export function BrandWordmark({
  className = "",
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  const scale =
    size === "sm"
      ? "text-[15px] leading-none"
      : "text-[18px] leading-none sm:text-[20px]";

  return (
    <span
      className={`select-none inline-flex items-baseline gap-[0.28em] text-[#C1121F] ${scale} ${className}`}
      style={{ letterSpacing: "-0.02em" }}
    >
      <span className="font-extrabold">Solar</span>
      <span className="font-extrabold">Entry</span>
    </span>
  );
}

export function BrandLockup({
  className = "",
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  const markSize = size === "sm" ? "h-6 w-6" : "h-7 w-7 sm:h-8 sm:w-8";
  const gap = size === "sm" ? "gap-2" : "gap-2.5";

  return (
    <span className={`inline-flex items-center ${gap} ${className}`}>
      <BrandMark className={markSize} />
      <BrandWordmark size={size} />
    </span>
  );
}
