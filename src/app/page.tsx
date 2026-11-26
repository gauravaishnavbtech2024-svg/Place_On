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
import { PlaceOnLogo } from "@/components/PlaceOnLogo";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/60 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <PlaceOnLogo />
          <div className="flex items-center gap-3">
            {activeEmail ? (
              <div className="flex items-center gap-2">
                {activeIsStudent && (
                  <Link
                    href="/student"
                    className="rounded-lg bg-blue-600 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                  >
                    Student Dashboard
                  </Link>
                )}
                {activeIsAdmin && (
                  <Link
                    href="/admin"
                    className="rounded-lg bg-slate-900 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
                  >
                    Admin Dashboard
                  </Link>
                )}
                <form action="/api/auth/signout" method="POST">
                  <button
                    type="submit"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Sign Out
                  </button>
                </form>
              </div>
            ) : (
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                @{ALLOWED_STUDENT_DOMAIN} Portal
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-2xl text-center mb-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm">
            <Building2 className="h-3.5 w-3.5" />
            IU Jaipur Campus Placement Monitor
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            Select your role to enter{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              PlaceOn
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
            className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/40 transition-all hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/10"
          >
            <div>
              <div className="mb-5 flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                  <GraduationCap className="h-7 w-7" />
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  @{ALLOWED_STUDENT_DOMAIN}
                </span>
              </div>

              <h2 className="text-2xl font-bold text-slate-900">Student</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Sign in with your university Google account to build your
                academic profile, upload your CV, and apply for placement drives.
              </p>

              <ul className="mt-6 space-y-2.5 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                  <span>Submit 10th, 12th & past semester scores</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                  <span>Upload & update your PDF Resume / CV</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                  <span>Mark Interested / Not Interested on drives</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
              <span>Continue as Student</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Admin Card */}
          <Link
            href="/login/admin"
            className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/40 transition-all hover:-translate-y-1 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10"
          >
            <div>
              <div className="mb-5 flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                  Authorized Only
                </span>
              </div>

              <h2 className="text-2xl font-bold text-slate-900">Admin</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Placement coordinator portal with whitelisted Google sign-in to
                publish companies, notify students, and export shortlists.
              </p>

              <ul className="mt-6 space-y-2.5 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span>Auto-email all students when posting drives</span>
                </li>
                <li className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span>Download Interested Students list as PDF</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span>Browse all student profiles & download CVs</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
              <span>Continue as Admin</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
      </main>

      <footer className="border-t border-slate-200/70 bg-white/60 py-4 text-center text-xs text-slate-500">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-4 px-4">
          <span>PlaceOn — Placement Monitoring System for IU Jaipur</span>
          <span>&bull;</span>
          <Link href="/privacy" className="hover:text-slate-800 underline">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-slate-800 underline">
            Terms of Service
          </Link>
        </div>
      </footer>
    </div>
  );
}
