import { NextResponse } from "next/server";
import { isAllowedStudentEmail, normalizeEmail } from "@/lib/auth";
import { COURSES, getCourseConfig } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type { ScoreType, SemesterScore } from "@/lib/types";

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAllowedStudentEmail(user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const fullName = String(body.full_name ?? "").trim();
  const course = String(body.course ?? "").trim();
  const branch = String(body.branch ?? "").trim();
  const currentYear = Number(body.current_year);
  const currentSemester = Number(body.current_semester);
  const scoreType: ScoreType =
    body.score_type === "PERCENTAGE" ? "PERCENTAGE" : "CGPA";
  const tenthPercentage = Number(body.tenth_percentage);
  const twelfthPercentage = Number(body.twelfth_percentage);
  const achievements = String(body.achievements_till_12th ?? "").trim();
  const rawScores = Array.isArray(body.semester_scores)
    ? body.semester_scores
    : [];

  if (!fullName) {
    return NextResponse.json(
      { error: "Full name is required." },
      { status: 400 }
    );
  }

  if (!COURSES.some((c) => c.name === course)) {
    return NextResponse.json({ error: "Invalid course." }, { status: 400 });
  }

  if (!branch) {
    return NextResponse.json(
      { error: "Branch / Specialization is required." },
      { status: 400 }
    );
  }

  const courseConfig = getCourseConfig(course);
  if (
    !Number.isInteger(currentYear) ||
    currentYear < 1 ||
    currentYear > courseConfig.maxYears
  ) {
    return NextResponse.json(
      { error: `Current year must be between 1 and ${courseConfig.maxYears}.` },
      { status: 400 }
    );
  }

  if (
    !Number.isInteger(currentSemester) ||
    currentSemester < 1 ||
    currentSemester > courseConfig.maxSemesters
  ) {
    return NextResponse.json(
      {
        error: `Current semester must be between 1 and ${courseConfig.maxSemesters}.`,
      },
      { status: 400 }
    );
  }

  if (
    !Number.isFinite(tenthPercentage) ||
    tenthPercentage < 0 ||
    tenthPercentage > 100
  ) {
    return NextResponse.json(
      { error: "10th percentage must be between 0 and 100." },
      { status: 400 }
    );
  }

  if (
    !Number.isFinite(twelfthPercentage) ||
    twelfthPercentage < 0 ||
    twelfthPercentage > 100
  ) {
    return NextResponse.json(
      { error: "12th percentage must be between 0 and 100." },
      { status: 400 }
    );
  }

  const expectedPastSemesters = currentSemester - 1;
  const maxScore = scoreType === "CGPA" ? 10 : 100;
  const validatedScores: SemesterScore[] = [];

  for (let sem = 1; sem <= expectedPastSemesters; sem++) {
    const match = rawScores.find(
      (item: { semester?: number; score?: number }) =>
        Number(item.semester) === sem
    );
    const val = Number(match?.score);
    if (!Number.isFinite(val) || val < 0 || val > maxScore) {
      return NextResponse.json(
        {
          error: `Please enter a valid ${scoreType} score (0-${maxScore}) for Semester ${sem}.`,
        },
        { status: 400 }
      );
    }
    validatedScores.push({
      semester: sem,
      score: Number(val.toFixed(2)),
    });
  }

  const { data: existing } = await supabase
    .from("students")
    .select("resume_path")
    .eq("id", user.id)
    .maybeSingle();

  const hasResume = Boolean(existing?.resume_path);

  const { data: updated, error } = await supabase
    .from("students")
    .upsert(
      {
        id: user.id,
        email: normalizeEmail(user.email),
        full_name: fullName,
        course,
        branch,
        current_year: currentYear,
        current_semester: currentSemester,
        score_type: scoreType,
        semester_scores: validatedScores,
        tenth_percentage: Number(tenthPercentage.toFixed(2)),
        twelfth_percentage: Number(twelfthPercentage.toFixed(2)),
        achievements_till_12th: achievements,
        profile_completed: hasResume,
      },
      { onConflict: "id" }
    )
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ student: updated });
}
