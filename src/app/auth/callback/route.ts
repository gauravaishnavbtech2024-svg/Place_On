import { NextResponse } from "next/server";
import {
  isAdminEmail,
  isAllowedStudentEmail,
  normalizeEmail,
  syncEnvAdminToWhitelist,
} from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const role = searchParams.get("role") === "admin" ? "admin" : "student";

  if (!code) {
    return NextResponse.redirect(`${origin}/login/${role}?error=oauth_failed`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login/${role}?error=oauth_failed`);
  }

  const email = normalizeEmail(data.user.email);

  if (role === "admin") {
    const allowed = await isAdminEmail(email);
    if (!allowed) {
      await supabase.auth.signOut();
      return NextResponse.redirect(
        `${origin}/login/admin?error=unauthorized_admin`
      );
    }

    await syncEnvAdminToWhitelist(email);
    return NextResponse.redirect(`${origin}/admin`);
  }

  // Student flow
  if (!isAllowedStudentEmail(email)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      `${origin}/login/student?error=invalid_domain`
    );
  }

  // Ensure a starter student record exists so the student receives automated emails
  const fullName =
    (data.user.user_metadata?.full_name as string | undefined) ??
    (data.user.user_metadata?.name as string | undefined) ??
    "";

  await supabase.from("students").upsert(
    {
      id: data.user.id,
      email,
      full_name: fullName,
    },
    { onConflict: "id", ignoreDuplicates: true }
  );

  return NextResponse.redirect(`${origin}/student`);
}
