import Image from "next/image";
import Link from "next/link";

interface PlaceOnTitleProps {
  subtitle?: string;
  href?: string;
}

export function IcfaiTechLogo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center group">
      <Image
        src="/icfaitech-logo.png"
        alt="IcfaiTech Faculty of Science & Technology (FST)"
        width={425}
        height={147}
        priority
        className="h-9 sm:h-10 w-auto shrink-0 object-contain transition-transform group-hover:scale-[1.02]"
      />
    </Link>
  );
}

export function PlaceOnTitle({
  subtitle = "IU Jaipur Placement Monitor",
  href = "/",
}: PlaceOnTitleProps) {
  return (
    <Link href={href} className="inline-flex flex-col items-center text-center group">
      <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#2f228c] leading-none">
        Place<span className="text-[#d7201c]">On</span>
      </span>
      {subtitle && (
        <span className="mt-1 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {subtitle}
        </span>
      )}
    </Link>
  );
}

export function PlaceOnLogo({
  subtitle = "IU Jaipur Placement Monitor",
  href = "/",
}: PlaceOnTitleProps) {
  return (
    <div className="inline-flex items-center gap-3">
      <IcfaiTechLogo href={href} />
      <span className="hidden sm:block h-7 w-px bg-slate-200" />
      <PlaceOnTitle href={href} subtitle={subtitle} />
    </div>
  );
}
