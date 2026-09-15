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
      <circle cx="16" cy="16" r="5.25" fill="#DA291C" />
      {/* Geometric rays — short rectangles at 45° increments */}
      <g fill="#DA291C">
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
  const text =
    size === "sm"
      ? "text-[11px] font-bold tracking-[0.16em]"
      : "text-[13px] font-bold tracking-[0.18em] sm:text-[14px]";

  return (
    <span
      className={`select-none text-[#DA291C] ${text} ${className}`}
    >
      SOLAR ENTRY
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
  const markSize = size === "sm" ? "h-5 w-5" : "h-6 w-6 sm:h-7 sm:w-7";
  const gap = size === "sm" ? "gap-2" : "gap-2.5";

  return (
    <span className={`inline-flex items-center ${gap} ${className}`}>
      <BrandMark className={markSize} />
      <BrandWordmark size={size} />
    </span>
  );
}
