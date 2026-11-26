export interface ValidatedCompanyPayload {
  name: string;
  role: string;
  package_ctc: string;
  location: string;
  description: string;
  deadline: string;
  allowed_courses: string[];
  min_tenth_percentage: number | null;
  min_twelfth_percentage: number | null;
  min_sem_cgpa: number | null;
}

function parseOptionalNumber(val: unknown): number | null {
  if (val === null || val === undefined || val === "") return null;
  const num = Number(val);
  return Number.isFinite(num) ? num : null;
}

/**
 * Validates and normalizes request body fields for creating or updating a company drive.
 */
export function parseCompanyPayload(
  body: Record<string, unknown>
): { data: ValidatedCompanyPayload } | { error: string } {
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

  if (!name || !role || !packageCtc || !description || !deadlineRaw) {
    return {
      error:
        "Company name, role, package, description, and deadline are required.",
    };
  }

  const deadlineDate = new Date(deadlineRaw);
  if (Number.isNaN(deadlineDate.getTime())) {
    return { error: "Invalid deadline date/time." };
  }

  return {
    data: {
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
    },
  };
}
