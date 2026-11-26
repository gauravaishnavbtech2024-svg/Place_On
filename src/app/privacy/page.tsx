import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PlaceOnLogo } from "@/components/PlaceOnLogo";
import { ALLOWED_STUDENT_DOMAIN } from "@/lib/constants";

export const metadata = {
  title: "Privacy Policy | PlaceOn",
  description: "Privacy Policy for PlaceOn — IU Jaipur Placement Monitor.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#fdfeff] flex flex-col">
      <header className="border-t-[3px] border-t-[#d7201c] border-b border-slate-200 bg-[#fdfeff]">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <PlaceOnLogo />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-[#2f228c]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-[#fdfeff] p-8 shadow-sm space-y-6">
          <div>
            <h1 className="text-3xl font-extrabold text-[#2f228c]">
              Privacy Policy
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Last updated: November 26, 2026 &bull; PlaceOn (IU Jaipur
              Placement Monitor)
            </p>
          </div>

          <section className="space-y-2 text-sm leading-relaxed text-slate-700">
            <h2 className="text-base font-bold text-slate-900">
              1. Information We Collect
            </h2>
            <p>
              When you sign in to <strong>PlaceOn</strong> using Google OAuth,
              we receive your basic Google profile information (name and email
              address). Student access is restricted to verified{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5">
                @{ALLOWED_STUDENT_DOMAIN}
              </code>{" "}
              accounts, and Admin access is restricted to authorized campus
              placement coordinators.
            </p>
            <p>
              Students voluntarily submit academic records (course, branch,
              current year and semester, past semester scores, Class 10th and
              12th scores, educational achievements up to Class 12th, and their
              PDF CV/Resume) as well as their Interested / Not Interested
              responses for listed placement drives.
            </p>
          </section>

          <section className="space-y-2 text-sm leading-relaxed text-slate-700">
            <h2 className="text-base font-bold text-slate-900">
              2. How We Use Information
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Verify student and placement coordinator identities via Google
                OAuth.
              </li>
              <li>
                Evaluate eligibility for campus placement drives and display
                relevant opportunities.
              </li>
              <li>
                Send automated email notifications to registered students when a
                new placement drive is posted by an Admin.
              </li>
              <li>
                Allow authorized Placement Cell Admins to review student
                profiles, download CVs, and export PDF shortlists of interested
                candidates for recruiting companies.
              </li>
            </ul>
          </section>

          <section className="space-y-2 text-sm leading-relaxed text-slate-700">
            <h2 className="text-base font-bold text-slate-900">
              3. Data Storage &amp; Security
            </h2>
            <p>
              Data and uploaded resumes are stored securely in Supabase with
              Row-Level Security (RLS) and private storage access controls.
              Student resumes are accessible only to the owning student and
              authorized Placement Cell Admins through authenticated, time-limited
              signed links. We do not sell or share personal data with
              third-party advertisers.
            </p>
          </section>

          <section className="space-y-2 text-sm leading-relaxed text-slate-700">
            <h2 className="text-base font-bold text-slate-900">
              4. Profile Updates &amp; Contact
            </h2>
            <p>
              Students may update their academic profile and replace their CV at
              any time from the Student Portal. For questions or data removal
              requests, please contact the IU Jaipur Campus Placement Cell.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
