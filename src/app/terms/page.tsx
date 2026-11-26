import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PlaceOnLogo } from "@/components/PlaceOnLogo";
import { ALLOWED_STUDENT_DOMAIN } from "@/lib/constants";

export const metadata = {
  title: "Terms of Service | PlaceOn",
  description: "Terms of Service for PlaceOn — IU Jaipur Placement Monitor.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <PlaceOnLogo />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm space-y-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">
              Terms of Service
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Last updated: November 26, 2026 &bull; PlaceOn (IU Jaipur
              Placement Monitor)
            </p>
          </div>

          <section className="space-y-2 text-sm leading-relaxed text-slate-700">
            <h2 className="text-base font-bold text-slate-900">
              1. Acceptance &amp; Eligibility
            </h2>
            <p>
              By accessing <strong>PlaceOn</strong>, you agree to these Terms of
              Service. Student portal access is limited to current students
              signing in with a valid{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5">
                @{ALLOWED_STUDENT_DOMAIN}
              </code>{" "}
              Google account. Admin portal access is restricted to explicitly
              whitelisted placement coordinators.
            </p>
          </section>

          <section className="space-y-2 text-sm leading-relaxed text-slate-700">
            <h2 className="text-base font-bold text-slate-900">
              2. Accuracy of Academic Information
            </h2>
            <p>
              Students are responsible for providing accurate and truthful
              academic details, including Class 10th and 12th scores, semester
              grades, educational achievements up to Class 12th, and an
              authentic PDF CV/Resume. Submitting falsified academic records may
              result in disqualification from campus placement drives.
            </p>
          </section>

          <section className="space-y-2 text-sm leading-relaxed text-slate-700">
            <h2 className="text-base font-bold text-slate-900">
              3. Placement Drive Participation
            </h2>
            <p>
              Marking <strong>Interested</strong> on a listed company drive
              authorizes the Placement Cell to include your submitted academic
              profile and resume link in the shortlist exported for that
              recruitment drive. Students may update their response until the
              drive deadline.
            </p>
          </section>

          <section className="space-y-2 text-sm leading-relaxed text-slate-700">
            <h2 className="text-base font-bold text-slate-900">
              4. Service Availability
            </h2>
            <p>
              PlaceOn is provided on an &ldquo;as-is&rdquo; basis for campus
              placement coordination. The Placement Cell reserves the right to
              update drive details, deadlines, eligibility rules, or admin
              permissions as required.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
