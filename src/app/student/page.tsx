import { redirect } from "next/navigation";
import { StudentDashboardClient } from "@/components/StudentDashboardClient";
import { isAllowedStudentEmail, normalizeEmail } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Company, CompanyResponse, StudentProfile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function StudentPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAllowedStudentEmail(user.email)) {
    redirect("/login/student");
  }

  const email = normalizeEmail(user.email);

  let { data: student } = await supabase
    .from("students")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!student) {
    const fullName =
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      "";
    const { data: created } = await supabase
      .from("students")
      .upsert(
        {
          id: user.id,
          email,
          full_name: fullName,
        },
        { onConflict: "id" }
      )
      .select("*")
      .single();
    student = created;
  }

  const [{ data: companies }, { data: responses }] = await Promise.all([
    supabase
      .from("companies")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("company_responses")
      .select("*")
      .eq("student_id", user.id),
  ]);

  const fallbackStudent: StudentProfile = (student as StudentProfile) ?? {
    id: user.id,
    email,
    full_name: "",
    course: "B.Tech",
    branch: "",
    current_year: 1,
    current_semester: 1,
    score_type: "CGPA",
    semester_scores: [],
    tenth_percentage: 0,
    twelfth_percentage: 0,
    achievements_till_12th: "",
    resume_path: null,
    resume_filename: null,
    profile_completed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <StudentDashboardClient
      initialStudent={fallbackStudent}
      companies={(companies as Company[]) ?? []}
      initialResponses={(responses as CompanyResponse[]) ?? []}
    />
  );
}
