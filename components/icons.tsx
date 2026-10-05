type P = { className?: string };

function Base({
  className,
  children,
  viewBox = "0 0 24 24",
}: P & { children: React.ReactNode; viewBox?: string }) {
  return (
    <svg
      className={className ?? "h-6 w-6"}
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function IssueIcon({ className }: P) {
  return (
    <Base className={className}>
      <rect x="3" y="7" width="13" height="10" />
      <path d="M16 10h3l2 2v3h-5" />
      <circle cx="7.5" cy="17.5" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="17.5" cy="17.5" r="1.6" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function ReceiverIcon({ className }: P) {
  return (
    <Base className={className}>
      <path d="M9.5 4.5a4 4 0 0 1 5 0" />
      <path d="M7.3 2.3a7.2 7.2 0 0 1 9.4 0" />
      <rect x="7" y="7" width="10" height="14.5" />
      <rect x="9.5" y="9.5" width="5" height="4" />
      <path d="M9.5 16h5" />
      <circle cx="10.7" cy="18.6" r="1" />
      <circle cx="13.3" cy="18.6" r="1" />
    </Base>
  );
}

export function BrandMark({ className }: P) {
  return (
    <svg
      className={className ?? "h-8 w-8"}
      viewBox="0 0 32 32"
      aria-hidden="true"
    >
      <rect width="32" height="32" fill="#0052FF" />
      <g
        stroke="#FFFFFF"
        strokeWidth={2.2}
        fill="none"
        strokeLinecap="square"
      >
        <path d="M12.5 8.5a5 5 0 0 1 7 0" />
        <rect x="9" y="11" width="14" height="14" />
        <rect x="12.5" y="14" width="7" height="4.5" />
        <path d="M12.5 21h7" />
      </g>
    </svg>
  );
}

export function ReturnIcon({ className }: P) {
  return (
    <Base className={className}>
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h9a7 7 0 0 1 0 14h-2" />
    </Base>
  );
}

export function CheckIcon({ className }: P) {
  return (
    <Base className={className}>
      <path d="M4 12.5 10 18.5 20 5.5" />
    </Base>
  );
}

export function PlusIcon({ className }: P) {
  return (
    <Base className={className}>
      <path d="M12 5v14M5 12h14" />
    </Base>
  );
}

export function SearchIcon({ className }: P) {
  return (
    <Base className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m16.5 16.5 5 5" />
    </Base>
  );
}

export function DocIcon({ className }: P) {
  return (
    <Base className={className}>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4" />
      <path d="M9 12h6M9 16h6" />
    </Base>
  );
}

export function ExternalIcon({ className }: P) {
  return (
    <Base className={className}>
      <path d="M14 4h6v6" />
      <path d="M20 4l-9 9" />
      <path d="M17 13v7H4V7h7" />
    </Base>
  );
}

export function CopyIcon({ className }: P) {
  return (
    <Base className={className}>
      <rect x="9" y="9" width="11" height="11" />
      <path d="M5 15V4h11" />
    </Base>
  );
}
