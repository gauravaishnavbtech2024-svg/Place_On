import Image from "next/image";
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
      <Image
        src="/icfaitech-logo.png"
        alt="IcfaiTech Faculty of Science & Technology (FST)"
        width={425}
        height={147}
        priority
        className="h-10 w-auto shrink-0 object-contain transition-transform group-hover:scale-[1.02]"
      />
      <span className="hidden sm:block h-7 w-px bg-slate-200" />
      <div className="flex flex-col">
        <span className="text-xl font-bold tracking-tight text-[#2f228c]">
          Place<span className="text-[#d7201c]">On</span>
        </span>
        {subtitle && (
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {subtitle}
          </span>
        )}
      </div>
    </Link>
  );
}
