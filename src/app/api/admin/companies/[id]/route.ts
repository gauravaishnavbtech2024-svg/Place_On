import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/auth";
import { parseCompanyPayload } from "@/lib/companyValidation";
import {
  sendCompanyAnnouncementEmails,
  type EmailDispatchResult,
} from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Company } from "@/lib/types";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
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

  const sendEmail = body.send_email === true;
  const client = createAdminClient() ?? supabase;

  const { data: company, error } = await client
    .from("companies")
    .update(parsed.data)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!company) {
    return NextResponse.json({ error: "Company not found." }, { status: 404 });
  }

  const typedCompany = company as Company;
  let emailResult: EmailDispatchResult | null = null;

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
      const nextCount =
        (typedCompany.email_sent_count ?? 0) + emailResult.sentCount;
      await client
        .from("companies")
        .update({ email_sent_count: nextCount })
        .eq("id", typedCompany.id);
      typedCompany.email_sent_count = nextCount;
    }
  }

  return NextResponse.json({
    company: typedCompany,
    emailResult,
  });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdminEmail(user.email))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = createAdminClient() ?? supabase;
  const { error } = await client.from("companies").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
