"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle, GraduationCap, ShieldCheck, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ALLOWED_STUDENT_DOMAIN } from "@/lib/constants";
import { PlaceOnLogo } from "./PlaceOnLogo";

interface GoogleSignInCardProps {
  role: "student" | "admin";
  errorCode?: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  invalid_domain: `Access denied. Only @${ALLOWED_STUDENT_DOMAIN} Google accounts are allowed for Student login.`,
  unauthorized_admin:
    "Access denied. This Google email is not authorized as a PlaceOn Admin. Contact the Placement Cell to get whitelisted.",
  oauth_failed:
    "Google sign-in could not be completed. Please try again or check your popup/cookie settings.",
};

export function GoogleSignInCard({ role, errorCode }: GoogleSignInCardProps) {
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const isStudent = role === "student";
  const displayError = localError || (errorCode ? ERROR_MESSAGES[errorCode] : null);

  async function handleGoogleLogin() {
    setLoading(true);
    setLocalError(null);
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?role=${role}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: isStudent
            ? { hd: ALLOWED_STUDENT_DOMAIN, prompt: "select_account" }
            : { prompt: "select_account" },
        },
      });

      if (error) {
        setLocalError(error.message);
        setLoading(false);
      }
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Failed to initialize Google sign-in."
      );
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/60 flex flex-col justify-center px-4 py-12">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 flex items-center justify-between">
          <PlaceOnLogo />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Change role
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-200/50">
          <div className="mb-6 flex items-center gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                isStudent
                  ? "bg-blue-50 text-blue-600 border border-blue-100"
                  : "bg-indigo-50 text-indigo-600 border border-indigo-100"
              }`}
            >
              {isStudent ? (
                <GraduationCap className="h-6 w-6" />
              ) : (
                <ShieldCheck className="h-6 w-6" />
              )}
            </div>
            <div>
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  isStudent
                    ? "bg-blue-100 text-blue-700"
                    : "bg-indigo-100 text-indigo-700"
                }`}
              >
                {isStudent ? "Student Portal" : "Admin Portal"}
              </span>
              <h1 className="mt-1 text-xl font-bold text-slate-900">
                {isStudent ? "Student Google Sign-In" : "Admin Google Sign-In"}
              </h1>
            </div>
          </div>

          <p className="mb-6 text-sm leading-relaxed text-slate-600">
            {isStudent ? (
              <>
                Sign in with your official university Google account ending in{" "}
                <span className="font-semibold text-slate-900">
                  @{ALLOWED_STUDENT_DOMAIN}
                </span>{" "}
                to access your academic profile and placement drives.
              </>
            ) : (
              <>
                Restricted to authorized Placement Cell coordinators. Only{" "}
                <span className="font-semibold text-slate-900">
                  whitelisted admin email IDs
                </span>{" "}
                can access the PlaceOn Admin dashboard.
              </>
            )}
          </p>

          {displayError && (
            <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
              <span>{displayError}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-400 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            <span>{loading ? "Redirecting to Google..." : "Continue with Google"}</span>
          </button>

          <div className="mt-6 border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
            {isStudent
              ? `Personal Gmail accounts are automatically blocked.`
              : `Unauthorized accounts will be signed out automatically.`}
          </div>
        </div>
      </div>
    </div>
  );
}
