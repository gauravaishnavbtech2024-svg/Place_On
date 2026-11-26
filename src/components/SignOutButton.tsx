import Image from "next/image";

/**
 * Icon-only functional sign-out button using the #35269b sign-out emblem.
 */
export function SignOutButton() {
  return (
    <form action="/api/auth/signout" method="POST">
      <button
        type="submit"
        title="Sign Out"
        aria-label="Sign Out"
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-[#fdfeff] shadow-xs transition-all hover:border-[#35269b]/40 hover:bg-[#35269b]/[0.06] active:scale-95 cursor-pointer"
      >
        <Image
          src="/signout-icon.png"
          alt="Sign Out"
          width={487}
          height={468}
          className="h-5 w-5 object-contain"
        />
      </button>
    </form>
  );
}
