import { NextResponse } from "next/server";
import { isAllowedStudentEmail } from "@/lib/auth";
import { checkStudentEligibility } from "@/lib/eligibility";
import { createClient } from "@/lib/supabase/server";
import type { Company, ResponseStatus, StudentProfile } from "@/lib/types";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAllowedStudentEmail(user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const companyId = String(body.company_id ?? "");
  const status: ResponseStatus =
    body.status === "interested" ? "interested" : "not_interested";

  if (!companyId) {
    return NextResponse.json(
      { error: "company_id is required." },
      { status: 400 }
    );
  }

  const [{ data: student }, { data: company }] = await Promise.all([
    supabase.from("students").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("companies").select("*").eq("id", companyId).maybeSingle(),
  ]);

  if (!company) {
    return NextResponse.json({ error: "Company not found." }, { status: 404 });
  }

  const typedCompany = company as Company;
  const typedStudent = student as StudentProfile | null;

  if (new Date(typedCompany.deadline).getTime() <= Date.now()) {
    return NextResponse.json(
      { error: "The deadline for this placement drive has passed." },
      { status: 400 }
    );
  }

  if (!typedStudent || !typedStudent.profile_completed) {
    return NextResponse.json(
      {
        error:
          "Please complete your academic profile and upload your CV before responding.",
      },
      { status: 400 }
    );
  }

  if (status === "interested") {
    const eligibility = checkStudentEligibility(typedStudent, typedCompany);
    if (!eligibility.eligible) {
      return NextResponse.json(
        {
          error: `You are not eligible for this drive: ${eligibility.reasons.join("; ")}`,
        },
        { status: 400 }
      );
    }
  }

  const { data: saved, error } = await supabase
    .from("company_responses")
    .upsert(
      {
        company_id: companyId,
        student_id: user.id,
        status,
      },
      { onConflict: "company_id,student_id" }
    )
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ response: saved });
}
