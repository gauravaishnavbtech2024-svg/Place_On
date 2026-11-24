export const ALLOWED_STUDENT_DOMAIN = (
  process.env.NEXT_PUBLIC_ALLOWED_STUDENT_DOMAIN || "iujaipur.edu.in"
).toLowerCase();

export interface CourseConfig {
  name: CourseName;
  label: string;
  maxYears: number;
  maxSemesters: number;
}

export type CourseName = "B.Tech" | "M.Tech" | "BCA" | "MCA" | "BBA" | "MBA";

export const COURSES: CourseConfig[] = [
  { name: "B.Tech", label: "B.Tech (4 Years / 8 Semesters)", maxYears: 4, maxSemesters: 8 },
  { name: "M.Tech", label: "M.Tech (2 Years / 4 Semesters)", maxYears: 2, maxSemesters: 4 },
  { name: "BCA", label: "BCA (3 Years / 6 Semesters)", maxYears: 3, maxSemesters: 6 },
  { name: "MCA", label: "MCA (2 Years / 4 Semesters)", maxYears: 2, maxSemesters: 4 },
  { name: "BBA", label: "BBA (3 Years / 6 Semesters)", maxYears: 3, maxSemesters: 6 },
  { name: "MBA", label: "MBA (2 Years / 4 Semesters)", maxYears: 2, maxSemesters: 4 },
];

export const BRANCH_SUGGESTIONS = [
  "CSE",
  "IT",
  "ECE",
  "AI & ML",
  "Data Science",
  "Cyber Security",
  "Mechanical",
  "Civil",
  "Finance",
  "Marketing",
  "Human Resources",
  "Business Analytics",
  "General",
];

export function getCourseConfig(course: string): CourseConfig {
  return COURSES.find((c) => c.name === course) ?? COURSES[0];
}
