import type { CourseName } from "./constants";

export type ScoreType = "CGPA" | "PERCENTAGE";

export interface SemesterScore {
  semester: number;
  score: number;
}

export interface StudentProfile {
  id: string;
  email: string;
  full_name: string;
  course: CourseName | string;
  branch: string;
  current_year: number;
  current_semester: number;
  score_type: ScoreType;
  semester_scores: SemesterScore[];
  tenth_percentage: number;
  twelfth_percentage: number;
  achievements_till_12th: string;
  resume_path: string | null;
  resume_filename: string | null;
  profile_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
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
  created_by: string;
  email_sent_count: number;
  created_at: string;
}

export type ResponseStatus = "interested" | "not_interested";

export interface CompanyResponse {
  id: string;
  company_id: string;
  student_id: string;
  status: ResponseStatus;
  updated_at: string;
}

export interface AdminWhitelistEntry {
  email: string;
  added_by: string | null;
  created_at: string;
  source?: "env" | "database" | "both";
}
