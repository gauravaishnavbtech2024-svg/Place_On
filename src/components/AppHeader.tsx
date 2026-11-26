import type { ReactNode } from "react";
import { IcfaiTechLogo, PlaceOnTitle } from "./PlaceOnLogo";

interface AppHeaderProps {
  href?: string;
  subtitle?: string;
  maxWidthClass?: string;
  sticky?: boolean;
  rightContent?: ReactNode;
}

/**
 * Shared top navigation bar with the IcfaiTech logo on the left,
 * PlaceOn title centered at the top, and contextual actions on the right.
 */
export function AppHeader({
  href = "/",
  subtitle = "IU Jaipur Placement Monitor",
  maxWidthClass = "max-w-6xl",
  sticky = true,
  rightContent,
}: AppHeaderProps) {
  return (
    <header
      className={`${
        sticky ? "sticky top-0 z-20" : ""
      } border-t-[3px] border-t-[#d7201c] border-b border-slate-200/80 bg-[#fdfeff]/95 backdrop-blur-md`}
    >
      <div
        className={`mx-auto grid ${maxWidthClass} grid-cols-2 sm:grid-cols-3 items-center gap-3 px-4 py-3.5 sm:px-6`}
      >
        <div className="justify-self-start">
          <IcfaiTechLogo href={href} />
        </div>

        <div className="col-span-2 sm:col-span-1 order-first sm:order-none justify-self-center">
          <PlaceOnTitle href={href} subtitle={subtitle} />
        </div>

        <div className="justify-self-end flex items-center gap-2 sm:gap-3">
          {rightContent}
        </div>
      </div>
    </header>
  );
}
