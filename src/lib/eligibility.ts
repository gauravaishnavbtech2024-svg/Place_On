import type { Company, ScoreType, SemesterScore, StudentProfile } from "./types";

export function calculateAverageScore(
  scores: SemesterScore[],
  scoreType: ScoreType
): { average: number | null; normalizedCgpa: number | null } {
  if (!Array.isArray(scores) || scores.length === 0) {
    return { average: null, normalizedCgpa: null };
  }

  const valid = scores
    .map((s) => Number(s.score))
    .filter((n) => Number.isFinite(n) && n >= 0);

  if (valid.length === 0) {
    return { average: null, normalizedCgpa: null };
  }

  const sum = valid.reduce((acc, n) => acc + n, 0);
  const average = Number((sum / valid.length).toFixed(2));
  const normalizedCgpa =
    scoreType === "PERCENTAGE"
      ? Number((average / 10).toFixed(2))
      : average;

  return { average, normalizedCgpa };
}

export function formatSemesterScores(
  scores: SemesterScore[],
  scoreType: ScoreType
): string {
  if (!Array.isArray(scores) || scores.length === 0) {
    return "N/A (Sem 1)";
  }

  const sorted = [...scores].sort((a, b) => a.semester - b.semester);
  const suffix = scoreType === "PERCENTAGE" ? "%" : "";
  const formatted = sorted
    .map((s) => `S${s.semester}: ${s.score}${suffix}`)
    .join(", ");

  const { average } = calculateAverageScore(sorted, scoreType);
  if (average === null) return formatted;
  return `${formatted} (Avg: ${average}${scoreType === "PERCENTAGE" ? "%" : " CGPA"})`;
}

export function checkStudentEligibility(
  student: StudentProfile | null,
  company: Company
): { eligible: boolean; reasons: string[] } {
  const reasons: string[] = [];

  if (!student || !student.profile_completed) {
    return {
      eligible: false,
      reasons: ["Complete your academic profile and upload your CV first."],
    };
  }

  if (
    company.allowed_courses &&
    company.allowed_courses.length > 0 &&
    !company.allowed_courses.includes(student.course)
  ) {
    reasons.push(
      `Course restricted to: ${company.allowed_courses.join(", ")}`
    );
  }

  if (
    company.min_tenth_percentage !== null &&
    Number(student.tenth_percentage) < Number(company.min_tenth_percentage)
  ) {
    reasons.push(
      `Requires min ${company.min_tenth_percentage}% in Class 10th (yours: ${student.tenth_percentage}%)`
    );
  }

  if (
    company.min_twelfth_percentage !== null &&
    Number(student.twelfth_percentage) < Number(company.min_twelfth_percentage)
  ) {
    reasons.push(
      `Requires min ${company.min_twelfth_percentage}% in Class 12th (yours: ${student.twelfth_percentage}%)`
    );
  }

  if (company.min_sem_cgpa !== null) {
    const { normalizedCgpa } = calculateAverageScore(
      student.semester_scores,
      student.score_type
    );
    if (normalizedCgpa === null) {
      reasons.push(
        `Requires min ${company.min_sem_cgpa} CGPA (past semester scores needed)`
      );
    } else if (normalizedCgpa < Number(company.min_sem_cgpa)) {
      reasons.push(
        `Requires min ${company.min_sem_cgpa} CGPA / ${(Number(company.min_sem_cgpa) * 10).toFixed(0)}% (yours: ${normalizedCgpa} eq. CGPA)`
      );
    }
  }

  return {
    eligible: reasons.length === 0,
    reasons,
  };
}
