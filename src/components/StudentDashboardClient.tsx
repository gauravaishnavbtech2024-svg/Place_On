"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  Award,
  Briefcase,
  Building2,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  FileText,
  GraduationCap,
  Loader2,
  LogOut,
  MapPin,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Upload,
  UserCheck,
  XCircle,
} from "lucide-react";
import { AppHeader } from "./AppHeader";
import { CompanySortSelect } from "./CompanySortSelect";
import { sortCompanies, type CompanySortOption } from "@/lib/companySort";
import { parseCompanyRoles } from "@/lib/companyValidation";
import { BRANCH_SUGGESTIONS, COURSES, getCourseConfig } from "@/lib/constants";
import {
  calculateAverageScore,
  checkStudentEligibility,
} from "@/lib/eligibility";
import type {
  Company,
  CompanyResponse,
  ResponseStatus,
  ScoreType,
  SemesterScore,
  StudentProfile,
} from "@/lib/types";

interface StudentDashboardClientProps {
  initialStudent: StudentProfile;
  companies: Company[];
  initialResponses: CompanyResponse[];
}

export function StudentDashboardClient({
  initialStudent,
  companies,
  initialResponses,
}: StudentDashboardClientProps) {
  const [student, setStudent] = useState<StudentProfile>(initialStudent);
  const [responses, setResponses] =
    useState<CompanyResponse[]>(initialResponses);
  const [activeTab, setActiveTab] = useState<"drives" | "profile">(
    initialStudent.profile_completed ? "drives" : "profile"
  );

  // Profile form state
  const [fullName, setFullName] = useState(initialStudent.full_name || "");
  const [course, setCourse] = useState(initialStudent.course || "B.Tech");
  const [branch, setBranch] = useState(initialStudent.branch || "");
  const [currentYear, setCurrentYear] = useState(
    initialStudent.current_year || 1
  );
  const [currentSemester, setCurrentSemester] = useState(
    initialStudent.current_semester || 1
  );
  const [scoreType, setScoreType] = useState<ScoreType>(
    initialStudent.score_type || "CGPA"
  );
  const [semScoreMap, setSemScoreMap] = useState<Record<number, string>>(() => {
    const map: Record<number, string> = {};
    if (Array.isArray(initialStudent.semester_scores)) {
      for (const item of initialStudent.semester_scores) {
        map[item.semester] = String(item.score);
      }
    }
    return map;
  });
  const [tenthPercentage, setTenthPercentage] = useState(
    initialStudent.tenth_percentage ? String(initialStudent.tenth_percentage) : ""
  );
  const [twelfthPercentage, setTwelfthPercentage] = useState(
    initialStudent.twelfth_percentage
      ? String(initialStudent.twelfth_percentage)
      : ""
  );
  const [achievements, setAchievements] = useState(
    initialStudent.achievements_till_12th || ""
  );

  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [driveFilter, setDriveFilter] = useState<
    "all" | "open" | "eligible" | "interested"
  >("all");
  const [sortBy, setSortBy] = useState<CompanySortOption>("posted_desc");
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [driveError, setDriveError] = useState<string | null>(null);

  const courseConfig = getCourseConfig(course);
  const pastSemesterNumbers = useMemo(
    () =>
      Array.from({ length: Math.max(0, currentSemester - 1) }, (_, i) => i + 1),
    [currentSemester]
  );

  const liveAverage = useMemo(() => {
    const list: SemesterScore[] = pastSemesterNumbers
      .map((sem) => ({
        semester: sem,
        score: Number(semScoreMap[sem]),
      }))
      .filter((s) => Number.isFinite(s.score) && semScoreMap[s.semester] !== "");

    if (list.length === 0) return null;
    return calculateAverageScore(list, scoreType).average;
  }, [pastSemesterNumbers, semScoreMap, scoreType]);

  const responseByCompany = useMemo(() => {
    const map = new Map<string, ResponseStatus>();
    for (const r of responses) {
      map.set(r.company_id, r.status);
    }
    return map;
  }, [responses]);

  function handleCourseChange(nextCourse: string) {
    setCourse(nextCourse);
    const cfg = getCourseConfig(nextCourse);
    const clampedYear = Math.min(currentYear, cfg.maxYears);
    const clampedSem = Math.min(currentSemester, cfg.maxSemesters);
    setCurrentYear(clampedYear);
    setCurrentSemester(clampedSem);
  }

  function handleYearChange(nextYear: number) {
    setCurrentYear(nextYear);
    const minSem = (nextYear - 1) * 2 + 1;
    const maxSem = Math.min(nextYear * 2, courseConfig.maxSemesters);
    if (currentSemester < minSem || currentSemester > maxSem) {
      setCurrentSemester(minSem);
    }
  }

  function handleSemesterChange(nextSem: number) {
    setCurrentSemester(nextSem);
    const inferredYear = Math.min(
      Math.ceil(nextSem / 2),
      courseConfig.maxYears
    );
    setCurrentYear(inferredYear);
  }

  async function handleResumeUpload(file: File | null) {
    if (!file) return;
    setUploadingResume(true);
    setProfileFeedback(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/student/resume", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();

      if (!res.ok) {
        setProfileFeedback({
          type: "error",
          text: json.error || "Failed to upload CV.",
        });
      } else {
        setStudent(json.student);
        setProfileFeedback({
          type: "success",
          text: `CV "${file.name}" uploaded successfully.`,
        });
      }
    } catch {
      setProfileFeedback({
        type: "error",
        text: "Network error while uploading CV.",
      });
    } finally {
      setUploadingResume(false);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileFeedback(null);

    try {
      const semesterScores: SemesterScore[] = pastSemesterNumbers.map((sem) => ({
        semester: sem,
        score: Number(semScoreMap[sem]),
      }));

      const res = await fetch("/api/student/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          course,
          branch,
          current_year: currentYear,
          current_semester: currentSemester,
          score_type: scoreType,
          semester_scores: semesterScores,
          tenth_percentage: Number(tenthPercentage),
          twelfth_percentage: Number(twelfthPercentage),
          achievements_till_12th: achievements,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setProfileFeedback({
          type: "error",
          text: json.error || "Could not save profile.",
        });
      } else {
        setStudent(json.student);
        setProfileFeedback({
          type: "success",
          text: json.student.profile_completed
            ? "Academic profile saved! You can now mark your interest in placement drives."
            : "Academic details saved! Please upload your PDF CV below to complete your profile.",
        });
      }
    } catch {
      setProfileFeedback({
        type: "error",
        text: "Network error while saving profile.",
      });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleRespond(companyId: string, status: ResponseStatus) {
    setRespondingId(companyId);
    setDriveError(null);

    try {
      const res = await fetch("/api/student/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: companyId, status }),
      });

      const json = await res.json();
      if (!res.ok) {
        setDriveError(json.error || "Failed to update response.");
      } else {
        setResponses((prev) => {
          const filtered = prev.filter((r) => r.company_id !== companyId);
          return [...filtered, json.response];
        });
      }
    } catch {
      setDriveError("Network error while saving your response.");
    } finally {
      setRespondingId(null);
    }
  }

  const filteredCompanies = useMemo(() => {
    const now = Date.now();
    const filtered = companies.filter((company) => {
      const isOpen = new Date(company.deadline).getTime() > now;
      const eligibility = checkStudentEligibility(student, company);
      const myStatus = responseByCompany.get(company.id);

      if (driveFilter === "open") return isOpen;
      if (driveFilter === "eligible") return eligibility.eligible;
      if (driveFilter === "interested") return myStatus === "interested";
      return true;
    });
    return sortCompanies(filtered, sortBy);
  }, [companies, driveFilter, sortBy, student, responseByCompany]);

  return (
    <div className="min-h-screen bg-[#fdfeff]">
      {/* Header */}
      <AppHeader
        href="/student"
        subtitle="Student Portal"
        rightContent={
          <>
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-sm font-semibold text-slate-900">
                {student.full_name || "Student"}
              </span>
              <span className="text-xs text-slate-500">{student.email}</span>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                student.profile_completed
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              {student.profile_completed ? (
                <>
                  <UserCheck className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Profile Complete</span>
                  <span className="sm:hidden">Complete</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Profile Incomplete</span>
                  <span className="sm:hidden">Incomplete</span>
                </>
              )}
            </span>

            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-[#fdfeff] px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </form>
          </>
        }
      />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Onboarding Warning Banner */}
        {!student.profile_completed && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">
                  Complete your Academic Profile &amp; Upload CV
                </p>
                <p className="text-xs text-amber-800 mt-0.5">
                  {!student.resume_path
                    ? "Fill in your academic details and upload your PDF resume so placement coordinators can view your profile and you can mark interest in companies."
                    : "Save your academic details below to unlock company applications."}
                </p>
              </div>
            </div>
            {activeTab !== "profile" && (
              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className="shrink-0 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-amber-700 cursor-pointer"
              >
                Complete Profile
              </button>
            )}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="mb-6 flex items-center gap-2 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab("drives")}
            className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === "drives"
                ? "border-[#2f228c] text-[#2f228c]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Briefcase className="h-4 w-4" />
            Company Drives
            <span className="rounded-full bg-[#2f228c]/10 px-2 py-0.5 text-xs text-[#2f228c]">
              {companies.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === "profile"
                ? "border-[#2f228c] text-[#2f228c]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            My Academic Profile &amp; CV
          </button>
        </div>

        {/* TAB 1: COMPANY DRIVES */}
        {activeTab === "drives" && (
          <section className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  Campus Placement Drives
                </h1>
                <p className="text-sm text-slate-600">
                  Review listed companies and mark Interested or Not Interested
                  before the deadline.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1">
                  {(
                    [
                      { id: "all", label: "All" },
                      { id: "open", label: "Open" },
                      { id: "eligible", label: "Eligible" },
                      { id: "interested", label: "Interested" },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setDriveFilter(tab.id)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                        driveFilter === tab.id
                          ? "bg-[#2f228c] text-[#fdfeff]"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <CompanySortSelect value={sortBy} onChange={setSortBy} />
              </div>
            </div>

            {driveError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{driveError}</span>
              </div>
            )}

            {filteredCompanies.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
                <Building2 className="mx-auto h-10 w-10 text-slate-400" />
                <h2 className="mt-3 text-base font-semibold text-slate-900">
                  No placement drives found
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {companies.length === 0
                    ? "No companies have been posted by the Placement Cell yet. You will receive an email automatically when a new drive is listed."
                    : "Try switching your filter above to see other drives."}
                </p>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {filteredCompanies.map((company) => {
                  const isOpen =
                    new Date(company.deadline).getTime() > Date.now();
                  const eligibility = checkStudentEligibility(student, company);
                  const myStatus = responseByCompany.get(company.id);
                  const isBusy = respondingId === company.id;

                  return (
                    <div
                      key={company.id}
                      className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h2 className="text-lg font-bold text-slate-900">
                                {company.name}
                              </h2>
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                  isOpen
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-slate-100 text-slate-600 border border-slate-200"
                                }`}
                              >
                                {isOpen ? "Open" : "Closed"}
                              </span>
                            </div>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {parseCompanyRoles(company.role).map((r) => (
                                <span
                                  key={r}
                                  className="inline-block rounded-md bg-[#2f228c]/[0.08] px-2 py-0.5 text-xs font-semibold text-[#2f228c]"
                                >
                                  {r}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="rounded-xl bg-[#2f228c]/[0.05] px-3 py-1.5 text-right border border-[#2f228c]/15">
                            <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#d7201c]">
                              Package
                            </span>
                            <span className="text-sm font-bold text-[#18162b]">
                              {company.package_ctc}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-600">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            {company.location}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
                            Deadline:{" "}
                            {new Date(company.deadline).toLocaleString("en-IN", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </span>
                          <span className="text-slate-500">
                            Posted:{" "}
                            {new Date(company.created_at).toLocaleDateString(
                              "en-IN",
                              { dateStyle: "medium" }
                            )}
                          </span>
                        </div>

                        <p className="mt-3 text-sm leading-relaxed text-slate-600 whitespace-pre-line">
                          {company.description}
                        </p>

                        {/* Eligibility Criteria Pills */}
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700">
                            Courses:{" "}
                            {company.allowed_courses?.length
                              ? company.allowed_courses.join(", ")
                              : "All"}
                          </span>
                          {company.min_tenth_percentage !== null && (
                            <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700">
                              Min 10th: {company.min_tenth_percentage}%
                            </span>
                          )}
                          {company.min_twelfth_percentage !== null && (
                            <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700">
                              Min 12th: {company.min_twelfth_percentage}%
                            </span>
                          )}
                          {company.min_sem_cgpa !== null && (
                            <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700">
                              Min Sem: {company.min_sem_cgpa} CGPA
                            </span>
                          )}
                        </div>

                        {/* Eligibility Feedback */}
                        {!eligibility.eligible && (
                          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-xs text-rose-700">
                            <div className="flex items-center gap-1.5 font-semibold">
                              <XCircle className="h-4 w-4 shrink-0" />
                              Not Eligible
                            </div>
                            <ul className="mt-1 list-disc pl-5 space-y-0.5">
                              {eligibility.reasons.map((reason, idx) => (
                                <li key={idx}>{reason}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-5 border-t border-slate-100 pt-4">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-slate-500">
                            Your Status:{" "}
                            {myStatus === "interested" ? (
                              <span className="font-semibold text-emerald-700">
                                Interested
                              </span>
                            ) : myStatus === "not_interested" ? (
                              <span className="font-semibold text-slate-700">
                                Not Interested
                              </span>
                            ) : (
                              <span>Not Responded</span>
                            )}
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={
                                isBusy || !isOpen || !eligibility.eligible
                              }
                              onClick={() =>
                                handleRespond(company.id, "interested")
                              }
                              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                                myStatus === "interested"
                                  ? "bg-emerald-600 text-white shadow-sm"
                                  : "border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              }`}
                            >
                              {isBusy ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <ThumbsUp className="h-3.5 w-3.5" />
                              )}
                              Interested
                            </button>

                            <button
                              type="button"
                              disabled={
                                isBusy || !isOpen || !student.profile_completed
                              }
                              onClick={() =>
                                handleRespond(company.id, "not_interested")
                              }
                              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                                myStatus === "not_interested"
                                  ? "bg-slate-800 text-white shadow-sm"
                                  : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              <ThumbsDown className="h-3.5 w-3.5" />
                              Not Interested
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* TAB 2: ACADEMIC PROFILE & CV */}
        {activeTab === "profile" && (
          <section className="mx-auto max-w-3xl space-y-6">
            {profileFeedback && (
              <div
                className={`flex items-start gap-2.5 rounded-xl border p-4 text-sm ${
                  profileFeedback.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {profileFeedback.type === "success" ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
                )}
                <span>{profileFeedback.text}</span>
              </div>
            )}

            {/* CV Upload Card */}
            <div className="rounded-2xl border border-slate-200 bg-[#fdfeff] p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="flex items-center gap-2 text-base font-bold text-[#18162b]">
                    <FileText className="h-5 w-5 text-[#2f228c]" />
                    CV / Resume (PDF only, max 5 MB)
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {student.resume_path
                      ? `Uploaded: ${student.resume_filename || "resume.pdf"}`
                      : "Required to complete your profile and appear in Admin shortlists."}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {student.resume_path && (
                    <a
                      href={`/api/resumes/${student.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-[#fdfeff] px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View Current CV
                    </a>
                  )}

                  <label className="inline-flex items-center gap-1.5 rounded-lg bg-[#2f228c] px-3.5 py-2 text-xs font-semibold text-[#fdfeff] hover:bg-[#23186d] cursor-pointer">
                    {uploadingResume ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    <span>
                      {uploadingResume
                        ? "Uploading..."
                        : student.resume_path
                        ? "Replace PDF"
                        : "Upload PDF"}
                    </span>
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      className="hidden"
                      disabled={uploadingResume}
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        void handleResumeUpload(file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Academic Details Form */}
            <form
              onSubmit={handleSaveProfile}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6"
            >
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Academic &amp; Personal Details
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  You can update these details anytime. Changes reflect
                  immediately on the Admin dashboard.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g., Aarav Sharma"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    University Email
                  </label>
                  <input
                    type="email"
                    disabled
                    value={student.email}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Course *
                  </label>
                  <select
                    value={course}
                    onChange={(e) => handleCourseChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    {COURSES.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Branch / Specialization *
                  </label>
                  <input
                    type="text"
                    required
                    list="branch-suggestions"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="e.g., CSE, ECE, IT, Finance"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <datalist id="branch-suggestions">
                    {BRANCH_SUGGESTIONS.map((b) => (
                      <option key={b} value={b} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Current Year *
                  </label>
                  <select
                    value={currentYear}
                    onChange={(e) => handleYearChange(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    {Array.from(
                      { length: courseConfig.maxYears },
                      (_, i) => i + 1
                    ).map((yr) => (
                      <option key={yr} value={yr}>
                        Year {yr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Current Semester *
                  </label>
                  <select
                    value={currentSemester}
                    onChange={(e) =>
                      handleSemesterChange(Number(e.target.value))
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    {Array.from(
                      { length: courseConfig.maxSemesters },
                      (_, i) => i + 1
                    ).map((sem) => (
                      <option key={sem} value={sem}>
                        Semester {sem}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic Past Semester Scores */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Past Semester Scores ({pastSemesterNumbers.length}{" "}
                      {pastSemesterNumbers.length === 1
                        ? "semester"
                        : "semesters"}
                      )
                    </h3>
                    <p className="text-xs text-slate-500">
                      {pastSemesterNumbers.length > 0
                        ? `Enter your scores for Semesters 1 to ${currentSemester - 1} respectively.`
                        : "You selected Semester 1 — no past semester scores needed yet."}
                    </p>
                  </div>

                  <div className="inline-flex rounded-lg border border-slate-300 bg-[#fdfeff] p-0.5">
                    {(["CGPA", "PERCENTAGE"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setScoreType(type)}
                        className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                          scoreType === type
                            ? "bg-[#2f228c] text-[#fdfeff]"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {type === "CGPA" ? "CGPA (0-10)" : "Percentage (%)"}
                      </button>
                    ))}
                  </div>
                </div>

                {pastSemesterNumbers.length > 0 && (
                  <>
                    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                      {pastSemesterNumbers.map((sem) => (
                        <div key={sem}>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Semester {sem} *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max={scoreType === "CGPA" ? "10" : "100"}
                            required
                            value={semScoreMap[sem] ?? ""}
                            onChange={(e) =>
                              setSemScoreMap((prev) => ({
                                ...prev,
                                [sem]: e.target.value,
                              }))
                            }
                            placeholder={scoreType === "CGPA" ? "e.g. 8.4" : "e.g. 82.5"}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          />
                        </div>
                      ))}
                    </div>

                    {liveAverage !== null && (
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#2f228c]">
                        <Sparkles className="h-4 w-4 text-[#d7201c]" />
                        Calculated Average: {liveAverage}{" "}
                        {scoreType === "CGPA" ? "CGPA" : "%"}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* 10th & 12th Scores */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Class 10th Score (%) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    required
                    value={tenthPercentage}
                    onChange={(e) => setTenthPercentage(e.target.value)}
                    placeholder="e.g., 91.4"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Class 12th Score (%) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    required
                    value={twelfthPercentage}
                    onChange={(e) => setTwelfthPercentage(e.target.value)}
                    placeholder="e.g., 88.6"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Special Achievements (Education only till 12th) */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                  <Award className="h-4 w-4 text-amber-500" />
                  Special Achievements (Educational only, up to Class 12th)
                </label>
                <textarea
                  rows={3}
                  value={achievements}
                  onChange={(e) => setAchievements(e.target.value)}
                  placeholder="Optional — list academic/educational achievements up to Class 12th only (e.g., NTSE Scholar, IMO Gold Medal, State Board Merit Certificate, CBSE 100% in Math)."
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Strictly include educational achievements attained up to Class
                  12th.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#2f228c] px-5 py-2.5 text-sm font-semibold text-[#fdfeff] shadow-sm hover:bg-[#23186d] transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {savingProfile && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {savingProfile ? "Saving..." : "Save Academic Profile"}
                </button>
              </div>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}
