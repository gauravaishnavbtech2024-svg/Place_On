import { NextResponse } from "next/server";
import { isAdminEmail, normalizeEmail } from "@/lib/auth";
import { parseCompanyPayload } from "@/lib/companyValidation";
import {
  sendCompanyAnnouncementEmails,
  type EmailDispatchResult,
} from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Company } from "@/lib/types";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdminEmail(user.email))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const parsed = parseCompanyPayload(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const sendEmail = body.send_email !== false;
  const client = createAdminClient() ?? supabase;

  const { data: company, error } = await client
    .from("companies")
    .insert({
      ...parsed.data,
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
