import { NextResponse } from "next/server";
import { isAdminEmail, normalizeEmail } from "@/lib/auth";
import {
  sendCompanyAnnouncementEmails,
  type EmailDispatchResult,
} from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Company } from "@/lib/types";

function parseOptionalNumber(val: unknown): number | null {
  if (val === null || val === undefined || val === "") return null;
  const num = Number(val);
  return Number.isFinite(num) ? num : null;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdminEmail(user.email))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const role = String(body.role ?? "").trim();
  const packageCtc = String(body.package_ctc ?? "").trim();
  const location = String(body.location ?? "").trim() || "On-site";
  const description = String(body.description ?? "").trim();
  const deadlineRaw = String(body.deadline ?? "").trim();
  const allowedCourses: string[] = Array.isArray(body.allowed_courses)
    ? body.allowed_courses.map(String).filter(Boolean)
    : [];
  const minTenth = parseOptionalNumber(body.min_tenth_percentage);
  const minTwelfth = parseOptionalNumber(body.min_twelfth_percentage);
  const minSemCgpa = parseOptionalNumber(body.min_sem_cgpa);
  const sendEmail = body.send_email !== false;

  if (!name || !role || !packageCtc || !description || !deadlineRaw) {
    return NextResponse.json(
      {
        error:
          "Company name, role, package, description, and deadline are required.",
      },
      { status: 400 }
    );
  }

  const deadlineDate = new Date(deadlineRaw);
  if (Number.isNaN(deadlineDate.getTime())) {
    return NextResponse.json(
      { error: "Invalid deadline date/time." },
      { status: 400 }
    );
  }

  const client = createAdminClient() ?? supabase;

  const { data: company, error } = await client
    .from("companies")
    .insert({
      name,
      role,
      package_ctc: packageCtc,
      location,
      description,
      deadline: deadlineDate.toISOString(),
      allowed_courses: allowedCourses,
      min_tenth_percentage: minTenth,
      min_twelfth_percentage: minTwelfth,
      min_sem_cgpa: minSemCgpa,
      created_by: normalizeEmail(user.email),
    })
    .select("*")
    .single();

  if (error || !company) {
    return NextResponse.json(
      { error: error?.message || "Failed to create company." },
      { status: 500 }
    );
  }

  const typedCompany = company as Company;
  let emailResult: EmailDispatchResult = {
    sentCount: 0,
    failedCount: 0,
    skippedReason: sendEmail ? undefined : "Email sending unchecked by admin.",
  };

  if (sendEmail) {
    const { data: students } = await client.from("students").select("email");
    const emails = (students ?? [])
      .map((s: { email: string }) => s.email)
      .filter(Boolean);

    const { origin } = new URL(request.url);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin;

    emailResult = await sendCompanyAnnouncementEmails(
      typedCompany,
      emails,
      appUrl
    );

    if (emailResult.sentCount > 0) {
      await client
        .from("companies")
        .update({ email_sent_count: emailResult.sentCount })
        .eq("id", typedCompany.id);
      typedCompany.email_sent_count = emailResult.sentCount;
    }
  }

  return NextResponse.json({
    company: typedCompany,
    emailResult,
  });
}
