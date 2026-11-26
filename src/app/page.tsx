import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  FileSpreadsheet,
  GraduationCap,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { SignOutButton } from "@/components/SignOutButton";
import { ALLOWED_STUDENT_DOMAIN } from "@/lib/constants";
import { isAdminEmail, isAllowedStudentEmail } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let activeEmail: string | null = null;
  let activeIsAdmin = false;
  let activeIsStudent = false;

  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email) {
        activeEmail = user.email;
        activeIsAdmin = await isAdminEmail(user.email);
        activeIsStudent = isAllowedStudentEmail(user.email);
      }
    } catch {
      // Ignore auth lookup errors on initial unconfigured setup
    }
  }

  return (
    <div className="min-h-screen bg-[#fdfeff] bg-gradient-to-br from-[#fdfeff] via-[#2f228c]/[0.03] to-[#d7201c]/[0.04] flex flex-col">
      {/* Top Navbar */}
      <AppHeader
        rightContent={
          activeEmail ? (
            <div className="flex items-center gap-2">
              {activeIsStudent && (
                <Link
                  href="/student"
                  className="rounded-lg bg-[#2f228c] px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#fdfeff] hover:bg-[#23186d] transition-colors"
                >
                  Student Dashboard
                </Link>
              )}
              {activeIsAdmin && (
                <Link
                  href="/admin"
                  className="rounded-lg bg-[#d7201c] px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#fdfeff] hover:bg-[#b31915] transition-colors"
                >
                  Admin Dashboard
                </Link>
              )}
              <SignOutButton />
            </div>
          ) : (
            <span className="rounded-full border border-[#2f228c]/20 bg-[#2f228c]/[0.06] px-3 py-1 text-xs font-semibold text-[#2f228c]">
              @{ALLOWED_STUDENT_DOMAIN} Portal
            </span>
          )
        }
      />

      {/* Main Content */}
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-2xl text-center mb-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#d7201c]/25 bg-[#fdfeff] px-3.5 py-1.5 text-xs font-semibold text-[#2f228c] shadow-sm">
            <Building2 className="h-3.5 w-3.5 text-[#d7201c]" />
            IcfaiTech (IU Jaipur) Campus Placement Monitor
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#18162b]">
            Select your role to enter{" "}
            <span className="text-[#2f228c]">
              Place<span className="text-[#d7201c]">On</span>
            </span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600">
            Streamlining campus recruitment for students and placement
            coordinators — academic profiles, CV management, live drive alerts,
            and instant PDF shortlists.
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="mx-auto grid w-full max-w-4xl gap-6 md:grid-cols-2">
          {/* Student Card */}
          <Link
            href="/login/student"
            className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-[#fdfeff] p-8 shadow-lg shadow-[#2f228c]/[0.06] transition-all hover:-translate-y-1 hover:border-[#2f228c]/50 hover:shadow-xl hover:shadow-[#2f228c]/15"
          >
            <div>
              <div className="mb-5 flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2f228c]/[0.08] text-[#2f228c] border border-[#2f228c]/15 transition-colors group-hover:bg-[#2f228c] group-hover:text-[#fdfeff]">
                  <GraduationCap className="h-7 w-7" />
                </div>
                <span className="rounded-full bg-[#2f228c]/[0.08] px-3 py-1 text-xs font-semibold text-[#2f228c]">
                  @{ALLOWED_STUDENT_DOMAIN}
                </span>
              </div>

              <h2 className="text-2xl font-bold text-[#18162b]">Student</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Sign in with your university Google account to build your
                academic profile, upload your CV, and apply for placement drives.
              </p>

              <ul className="mt-6 space-y-2.5 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#2f228c] shrink-0" />
                  <span>Submit 10th, 12th &amp; past semester scores</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#2f228c] shrink-0" />
                  <span>Upload &amp; update your PDF Resume / CV</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#2f228c] shrink-0" />
                  <span>Mark Interested / Not Interested on drives</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 flex items-center justify-between rounded-xl bg-[#2f228c]/[0.06] px-4 py-3 text-sm font-semibold text-[#2f228c] transition-colors group-hover:bg-[#2f228c] group-hover:text-[#fdfeff]">
              <span>Continue as Student</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Admin Card */}
          <Link
            href="/login/admin"
            className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-[#fdfeff] p-8 shadow-lg shadow-[#d7201c]/[0.05] transition-all hover:-translate-y-1 hover:border-[#d7201c]/50 hover:shadow-xl hover:shadow-[#d7201c]/15"
          >
            <div>
              <div className="mb-5 flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d7201c]/[0.08] text-[#d7201c] border border-[#d7201c]/15 transition-colors group-hover:bg-[#d7201c] group-hover:text-[#fdfeff]">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <span className="rounded-full bg-[#d7201c]/[0.08] px-3 py-1 text-xs font-semibold text-[#d7201c]">
                  Authorized Only
                </span>
              </div>

              <h2 className="text-2xl font-bold text-[#18162b]">Admin</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Placement coordinator portal with whitelisted Google sign-in to
                publish companies, notify students, and export shortlists.
              </p>

              <ul className="mt-6 space-y-2.5 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-[#d7201c] shrink-0" />
                  <span>Auto-email all students when posting drives</span>
                </li>
                <li className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-[#d7201c] shrink-0" />
                  <span>Download Interested Students list as PDF</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#d7201c] shrink-0" />
                  <span>Browse all student profiles &amp; download CVs</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 flex items-center justify-between rounded-xl bg-[#d7201c]/[0.07] px-4 py-3 text-sm font-semibold text-[#d7201c] transition-colors group-hover:bg-[#d7201c] group-hover:text-[#fdfeff]">
              <span>Continue as Admin</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
      </main>

      <footer className="border-t border-slate-200/80 bg-[#fdfeff]/90 py-4 text-center text-xs text-slate-500">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-4 px-4">
          <span>PlaceOn — Placement Monitoring System for IcfaiTech (IU Jaipur)</span>
          <span>&bull;</span>
          <Link href="/privacy" className="hover:text-[#2f228c] underline">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-[#2f228c] underline">
            Terms of Service
          </Link>
        </div>
      </footer>
    </div>
  );
}
