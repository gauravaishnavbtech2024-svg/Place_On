import Link from "next/link";

interface PlaceOnLogoProps {
  subtitle?: string;
  href?: string;
}

export function PlaceOnLogo({
  subtitle = "IU Jaipur Placement Monitor",
  href = "/",
}: PlaceOnLogoProps) {
  return (
    <Link href={href} className="inline-flex items-center gap-3 group">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md shadow-blue-600/20 transition-transform group-hover:scale-105">
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
      </div>
      <div className="flex flex-col">
        <span className="text-xl font-bold tracking-tight text-slate-900">
          Place<span className="text-blue-600">On</span>
        </span>
        {subtitle && (
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            {subtitle}
          </span>
        )}
      </div>
    </Link>
  );
}
