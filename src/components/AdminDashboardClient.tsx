"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  Building2,
  CalendarClock,
  CheckCircle2,
  Download,
  ExternalLink,
  FileDown,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { AppHeader } from "./AppHeader";
import { CompanySortSelect } from "./CompanySortSelect";
import { sortCompanies, type CompanySortOption } from "@/lib/companySort";
import { parseCompanyRoles } from "@/lib/companyValidation";
import { COURSES } from "@/lib/constants";
import { formatSemesterScores } from "@/lib/eligibility";
import { downloadInterestedStudentsPdf } from "@/lib/pdf";
import type { Company, CompanyResponse, StudentProfile } from "@/lib/types";

interface AdminDashboardClientProps {
  adminEmail: string;
  initialCompanies: Company[];
  initialStudents: StudentProfile[];
  initialResponses: CompanyResponse[];
}

export function AdminDashboardClient({
  adminEmail,
  initialCompanies,
  initialStudents,
  initialResponses,
}: AdminDashboardClientProps) {
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [students] = useState<StudentProfile[]>(initialStudents);
  const [responses] = useState<CompanyResponse[]>(initialResponses);

  const [activeTab, setActiveTab] = useState<"companies" | "students">(
    "companies"
  );
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    initialCompanies[0]?.id ?? null
  );
  const [companySortBy, setCompanySortBy] =
    useState<CompanySortOption>("posted_desc");

  // Post / Edit Company Modal State
  const [showPostModal, setShowPostModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [companyRoles, setCompanyRoles] = useState<string[]>([""]);
  const [packageCtc, setPackageCtc] = useState("");
  const [location, setLocation] = useState("");
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");
  const [allowedCourses, setAllowedCourses] = useState<string[]>([]);
  const [minTenth, setMinTenth] = useState("");
  const [minTwelfth, setMinTwelfth] = useState("");
  const [minSemCgpa, setMinSemCgpa] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [postingCompany, setPostingCompany] = useState(false);
  const [banner, setBanner] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Students Directory Filter State
  const [studentQuery, setStudentQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("ALL");
  const [yearFilter, setYearFilter] = useState("ALL");
  const [completionFilter, setCompletionFilter] = useState<
    "ALL" | "COMPLETED" | "INCOMPLETE"
  >("ALL");

  const studentById = useMemo(() => {
    const map = new Map<string, StudentProfile>();
    for (const s of students) {
      map.set(s.id, s);
    }
    return map;
  }, [students]);

  const countsByCompany = useMemo(() => {
    const map = new Map<
      string,
      { interested: StudentProfile[]; notInterestedCount: number }
    >();
    for (const c of companies) {
      map.set(c.id, { interested: [], notInterestedCount: 0 });
    }
    for (const r of responses) {
      const entry = map.get(r.company_id);
      if (!entry) continue;
      if (r.status === "interested") {
        const student = studentById.get(r.student_id);
        if (student) entry.interested.push(student);
      } else if (r.status === "not_interested") {
        entry.notInterestedCount += 1;
      }
    }
    return map;
  }, [companies, responses, studentById]);

  const selectedCompany = useMemo(
    () => companies.find((c) => c.id === selectedCompanyId) ?? null,
    [companies, selectedCompanyId]
  );

  const sortedCompanies = useMemo(
    () => sortCompanies(companies, companySortBy),
    [companies, companySortBy]
  );

  const selectedInterestedStudents = useMemo(() => {
    if (!selectedCompany) return [];
    return countsByCompany.get(selectedCompany.id)?.interested ?? [];
  }, [selectedCompany, countsByCompany]);

  const completedStudentsCount = useMemo(
    () => students.filter((s) => s.profile_completed).length,
    [students]
  );

  const totalInterestedCount = useMemo(
    () => responses.filter((r) => r.status === "interested").length,
    [responses]
  );

  const filteredStudents = useMemo(() => {
    const q = studentQuery.trim().toLowerCase();
    return students.filter((s) => {
      if (courseFilter !== "ALL" && s.course !== courseFilter) return false;
      if (yearFilter !== "ALL" && String(s.current_year) !== yearFilter)
        return false;
      if (completionFilter === "COMPLETED" && !s.profile_completed)
        return false;
      if (completionFilter === "INCOMPLETE" && s.profile_completed)
        return false;

      if (!q) return true;
      return (
        s.full_name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.branch.toLowerCase().includes(q) ||
        (s.achievements_till_12th || "").toLowerCase().includes(q)
      );
    });
  }, [students, studentQuery, courseFilter, yearFilter, completionFilter]);

  function toggleCourseSelection(courseName: string) {
    setAllowedCourses((prev) =>
      prev.includes(courseName)
        ? prev.filter((c) => c !== courseName)
        : [...prev, courseName]
    );
  }

  function toDateTimeLocalValue(isoString: string): string {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return "";
    const offsetMinutes = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offsetMinutes * 60 * 1000);
    return local.toISOString().slice(0, 16);
  }

  function openCreateModal() {
    setEditingCompany(null);
    setCompanyName("");
    setCompanyRoles([""]);
    setPackageCtc("");
    setLocation("");
    setDeadline("");
    setDescription("");
    setAllowedCourses([]);
    setMinTenth("");
    setMinTwelfth("");
    setMinSemCgpa("");
    setSendEmail(true);
    setShowPostModal(true);
  }

  function openEditModal(company: Company) {
    const parsedRoles = parseCompanyRoles(company.role);
    setEditingCompany(company);
    setCompanyName(company.name);
    setCompanyRoles(parsedRoles.length > 0 ? parsedRoles : [""]);
    setPackageCtc(company.package_ctc);
    setLocation(company.location);
    setDeadline(toDateTimeLocalValue(company.deadline));
    setDescription(company.description);
    setAllowedCourses(company.allowed_courses ?? []);
    setMinTenth(
      company.min_tenth_percentage !== null
        ? String(company.min_tenth_percentage)
        : ""
    );
    setMinTwelfth(
      company.min_twelfth_percentage !== null
        ? String(company.min_twelfth_percentage)
        : ""
    );
    setMinSemCgpa(
      company.min_sem_cgpa !== null ? String(company.min_sem_cgpa) : ""
    );
    setSendEmail(false);
    setShowPostModal(true);
  }

  function updateRoleAt(index: number, value: string) {
    setCompanyRoles((prev) =>
      prev.map((item, idx) => (idx === index ? value : item))
    );
  }

  function addRoleField() {
    setCompanyRoles((prev) => [...prev, ""]);
  }

  function removeRoleAt(index: number) {
    setCompanyRoles((prev) =>
      prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== index)
    );
  }

  async function handleSaveCompany(e: React.FormEvent) {
    e.preventDefault();
    setPostingCompany(true);
    setBanner(null);

    const isEditing = editingCompany !== null;
    const endpoint = isEditing
      ? `/api/admin/companies/${editingCompany.id}`
      : "/api/admin/companies";

    try {
      const res = await fetch(endpoint, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: companyName,
          roles: companyRoles,
          package_ctc: packageCtc,
          location,
          deadline,
          description,
          allowed_courses: allowedCourses,
          min_tenth_percentage: minTenth || null,
          min_twelfth_percentage: minTwelfth || null,
          min_sem_cgpa: minSemCgpa || null,
          send_email: sendEmail,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setBanner({
          type: "error",
          text:
            json.error ||
            (isEditing
              ? "Could not update company listing."
              : "Could not create company listing."),
        });
      } else {
        const saved = json.company as Company;
        if (isEditing) {
          setCompanies((prev) =>
            prev.map((c) => (c.id === saved.id ? saved : c))
          );
        } else {
          setCompanies((prev) => [saved, ...prev]);
          setSelectedCompanyId(saved.id);
        }
        setShowPostModal(false);
        setEditingCompany(null);

        const emailInfo = json.emailResult;
        const emailNote = emailInfo
          ? emailInfo.skippedReason
            ? ` (${emailInfo.skippedReason})`
            : ` Automated email sent to ${emailInfo.sentCount ?? 0} registered student(s).`
          : "";

        setBanner({
          type: "success",
          text: isEditing
            ? `Updated "${saved.name}" successfully.${emailNote}`
            : `Listed "${saved.name}" successfully.${emailNote}`,
        });
      }
    } catch {
      setBanner({
        type: "error",
        text: isEditing
          ? "Network error while updating company."
          : "Network error while posting company.",
      });
    } finally {
      setPostingCompany(false);
    }
  }

  async function handleDeleteCompany(id: string, name: string) {
    if (
      !window.confirm(
        `Delete "${name}" and all student responses for this drive?`
      )
    ) {
      return;
    }

    const res = await fetch(`/api/admin/companies/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setCompanies((prev) => {
        const next = prev.filter((c) => c.id !== id);
        if (selectedCompanyId === id) {
          setSelectedCompanyId(next[0]?.id ?? null);
        }
        return next;
      });
      setBanner({ type: "success", text: `Removed "${name}".` });
    }
  }

  return (
    <div className="min-h-screen bg-[#fdfeff]">
      {/* Header */}
      <AppHeader
        href="/admin"
        subtitle="Admin Portal"
        maxWidthClass="max-w-7xl"
        rightContent={
          <>
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-xs font-semibold text-[#d7201c]">
                Placement Admin
              </span>
              <span className="text-xs text-slate-500">{adminEmail}</span>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#2f228c] px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#fdfeff] shadow-sm hover:bg-[#23186d] cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Post Company
            </button>

            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-[#fdfeff] px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </form>
          </>
        }
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
        {banner && (
          <div
            className={`flex items-start justify-between gap-3 rounded-xl border p-4 text-sm ${
              banner.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            <div className="flex items-start gap-2.5">
              {banner.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
              )}
              <span>{banner.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setBanner(null)}
              className="text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-[#fdfeff] p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Registered Students
              </span>
              <Users className="h-5 w-5 text-[#2f228c]" />
            </div>
            <p className="mt-2 text-3xl font-extrabold text-[#18162b]">
              {students.length}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {completedStudentsCount} completed profile &amp; CV
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-[#fdfeff] p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Listed Companies
              </span>
              <Building2 className="h-5 w-5 text-[#d7201c]" />
            </div>
            <p className="mt-2 text-3xl font-extrabold text-[#18162b]">
              {companies.length}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {
                companies.filter(
                  (c) => new Date(c.deadline).getTime() > Date.now()
                ).length
              }{" "}
              currently open for responses
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-[#fdfeff] p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Interested Applications
              </span>
              <FileDown className="h-5 w-5 text-[#2f228c]" />
            </div>
            <p className="mt-2 text-3xl font-extrabold text-[#18162b]">
              {totalInterestedCount}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Exportable as PDF per company
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab("companies")}
            className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === "companies"
                ? "border-[#2f228c] text-[#2f228c]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Building2 className="h-4 w-4" />
            Companies &amp; Interested Lists
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("students")}
            className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === "students"
                ? "border-[#2f228c] text-[#2f228c]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Users className="h-4 w-4" />
            All Registered Students ({students.length})
          </button>
        </div>

        {/* TAB 1: COMPANIES & INTERESTED STUDENTS */}
        {activeTab === "companies" && (
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Left Sidebar: Company List */}
            <div className="lg:col-span-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600">
                  Company Drives
                </h2>
                <div className="flex items-center gap-2">
                  <CompanySortSelect
                    value={companySortBy}
                    onChange={setCompanySortBy}
                  />
                  <button
                    type="button"
                    onClick={openCreateModal}
                    className="text-xs font-semibold text-[#2f228c] hover:underline cursor-pointer"
                  >
                    + Add New
                  </button>
                </div>
              </div>

              {sortedCompanies.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-[#fdfeff] p-8 text-center">
                  <Building2 className="mx-auto h-8 w-8 text-slate-400" />
                  <p className="mt-2 text-sm font-semibold text-[#18162b]">
                    No companies posted yet
                  </p>
                  <button
                    type="button"
                    onClick={openCreateModal}
                    className="mt-3 rounded-lg bg-[#2f228c] px-3.5 py-2 text-xs font-semibold text-[#fdfeff] hover:bg-[#23186d] cursor-pointer"
                  >
                    Post First Company
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {sortedCompanies.map((company) => {
                    const stats = countsByCompany.get(company.id);
                    const interestedCount = stats?.interested.length ?? 0;
                    const notInterestedCount = stats?.notInterestedCount ?? 0;
                    const isOpen =
                      new Date(company.deadline).getTime() > Date.now();
                    const isSelected = selectedCompany?.id === company.id;

                    return (
                      <button
                        key={company.id}
                        type="button"
                        onClick={() => setSelectedCompanyId(company.id)}
                        className={`w-full text-left rounded-2xl border p-4 transition-all cursor-pointer ${
                          isSelected
                            ? "border-[#2f228c] bg-[#2f228c]/[0.04] ring-2 ring-[#2f228c]/15 shadow-sm"
                            : "border-slate-200 bg-[#fdfeff] hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-sm font-bold text-[#18162b]">
                              {company.name}
                            </h3>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {parseCompanyRoles(company.role).map((r) => (
                                <span
                                  key={r}
                                  className="inline-block rounded-md bg-[#2f228c]/[0.08] px-1.5 py-0.5 text-[11px] font-semibold text-[#2f228c]"
                                >
                                  {r}
                                </span>
                              ))}
                            </div>
                          </div>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              isOpen
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {isOpen ? "Open" : "Closed"}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                          <span className="font-semibold text-emerald-700">
                            {interestedCount} Interested
                          </span>
                          <span>{notInterestedCount} Declined</span>
                          <span className="text-slate-400">
                            {company.package_ctc}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                          <span>
                            Posted{" "}
                            {new Date(company.created_at).toLocaleDateString(
                              "en-IN",
                              { dateStyle: "medium" }
                            )}
                          </span>
                          <span>
                            Due{" "}
                            {new Date(company.deadline).toLocaleDateString(
                              "en-IN",
                              { dateStyle: "medium" }
                            )}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Detail Panel */}
            <div className="lg:col-span-8">
              {selectedCompany ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
                    <div>
                      <h2 className="text-2xl font-bold text-[#18162b]">
                        {selectedCompany.name}
                      </h2>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {parseCompanyRoles(selectedCompany.role).map((r) => (
                          <span
                            key={r}
                            className="inline-block rounded-lg bg-[#2f228c]/[0.08] px-2.5 py-0.5 text-xs font-semibold text-[#2f228c]"
                          >
                            {r}
                          </span>
                        ))}
                        <span className="text-sm font-semibold text-[#d7201c]">
                          &bull; {selectedCompany.package_ctc}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          {selectedCompany.location}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
                          Deadline:{" "}
                          {new Date(selectedCompany.deadline).toLocaleString(
                            "en-IN",
                            { dateStyle: "medium", timeStyle: "short" }
                          )}
                        </span>
                        <span className="text-slate-500">
                          Posted:{" "}
                          {new Date(selectedCompany.created_at).toLocaleString(
                            "en-IN",
                            { dateStyle: "medium", timeStyle: "short" }
                          )}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          Emailed to {selectedCompany.email_sent_count} students
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={selectedInterestedStudents.length === 0}
                        onClick={() =>
                          downloadInterestedStudentsPdf(
                            selectedCompany,
                            selectedInterestedStudents,
                            window.location.origin
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-[#2f228c] px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#fdfeff] shadow-sm hover:bg-[#23186d] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <Download className="h-4 w-4" />
                        Download Interested List (PDF)
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditModal(selectedCompany)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-[#fdfeff] px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteCompany(
                            selectedCompany.id,
                            selectedCompany.name
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#d7201c]/30 bg-[#d7201c]/[0.07] px-3 py-2.5 text-xs font-semibold text-[#d7201c] hover:bg-[#d7201c]/15 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 whitespace-pre-line">
                    {selectedCompany.description}
                  </p>

                  {/* Interested Students Table */}
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-base font-bold text-slate-900">
                        Interested Students ({selectedInterestedStudents.length}
                        )
                      </h3>
                    </div>

                    {selectedInterestedStudents.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center text-sm text-slate-500">
                        No students have marked Interested for{" "}
                        {selectedCompany.name} yet.
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                          <thead className="bg-slate-50 text-slate-700">
                            <tr>
                              <th className="px-3 py-2.5 font-semibold">#</th>
                              <th className="px-3 py-2.5 font-semibold">
                                Name &amp; Email
                              </th>
                              <th className="px-3 py-2.5 font-semibold">
                                Course / Year
                              </th>
                              <th className="px-3 py-2.5 font-semibold">
                                10th / 12th
                              </th>
                              <th className="px-3 py-2.5 font-semibold">
                                Past Sem Scores
                              </th>
                              <th className="px-3 py-2.5 font-semibold">
                                Achievements (till 12th)
                              </th>
                              <th className="px-3 py-2.5 font-semibold">CV</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {selectedInterestedStudents.map((s, idx) => (
                              <tr key={s.id} className="hover:bg-slate-50/70">
                                <td className="px-3 py-3 text-slate-500">
                                  {idx + 1}
                                </td>
                                <td className="px-3 py-3">
                                  <div className="font-semibold text-slate-900">
                                    {s.full_name}
                                  </div>
                                  <div className="text-slate-500">{s.email}</div>
                                </td>
                                <td className="px-3 py-3">
                                  <div className="font-medium text-slate-800">
                                    {s.course} ({s.branch})
                                  </div>
                                  <div className="text-slate-500">
                                    Yr {s.current_year} / Sem{" "}
                                    {s.current_semester}
                                  </div>
                                </td>
                                <td className="px-3 py-3 whitespace-nowrap">
                                  <div>10th: {s.tenth_percentage}%</div>
                                  <div>12th: {s.twelfth_percentage}%</div>
                                </td>
                                <td className="px-3 py-3 max-w-[200px] text-slate-700">
                                  {formatSemesterScores(
                                    s.semester_scores,
                                    s.score_type
                                  )}
                                </td>
                                <td className="px-3 py-3 max-w-[180px] text-slate-600">
                                  {s.achievements_till_12th?.trim() || "—"}
                                </td>
                                <td className="px-3 py-3 whitespace-nowrap">
                                  {s.resume_path ? (
                                    <a
                                      href={`/api/resumes/${s.id}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 rounded-lg bg-[#2f228c]/[0.08] px-2.5 py-1.5 font-semibold text-[#2f228c] hover:bg-[#2f228c]/15"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                      View CV
                                    </a>
                                  ) : (
                                    <span className="text-slate-400">None</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">
                  Select a company drive on the left or click{" "}
                  <strong>Post Company</strong> to create one.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ALL REGISTERED STUDENTS */}
        {activeTab === "students" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Registered Students Directory
                </h2>
                <p className="text-xs text-slate-500">
                  Search academic profiles, semester scores, achievements, and
                  download student CVs.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={studentQuery}
                    onChange={(e) => setStudentQuery(e.target.value)}
                    placeholder="Search name, email, branch..."
                    className="rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <select
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700"
                >
                  <option value="ALL">All Courses</option>
                  {COURSES.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700"
                >
                  <option value="ALL">All Years</option>
                  {[1, 2, 3, 4].map((yr) => (
                    <option key={yr} value={String(yr)}>
                      Year {yr}
                    </option>
                  ))}
                </select>

                <select
                  value={completionFilter}
                  onChange={(e) =>
                    setCompletionFilter(
                      e.target.value as "ALL" | "COMPLETED" | "INCOMPLETE"
                    )
                  }
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="COMPLETED">Profile Complete</option>
                  <option value="INCOMPLETE">Incomplete</option>
                </select>
              </div>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
                No matching students found.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700">
                    <tr>
                      <th className="px-3 py-2.5 font-semibold">#</th>
                      <th className="px-3 py-2.5 font-semibold">Student</th>
                      <th className="px-3 py-2.5 font-semibold">
                        Course &amp; Branch
                      </th>
                      <th className="px-3 py-2.5 font-semibold">Year / Sem</th>
                      <th className="px-3 py-2.5 font-semibold">10th / 12th</th>
                      <th className="px-3 py-2.5 font-semibold">
                        Past Sem Scores
                      </th>
                      <th className="px-3 py-2.5 font-semibold">
                        Achievements (till 12th)
                      </th>
                      <th className="px-3 py-2.5 font-semibold">Status &amp; CV</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredStudents.map((s, idx) => (
                      <tr key={s.id} className="hover:bg-slate-50/70">
                        <td className="px-3 py-3 text-slate-500">{idx + 1}</td>
                        <td className="px-3 py-3">
                          <div className="font-semibold text-slate-900">
                            {s.full_name || "Unnamed"}
                          </div>
                          <div className="text-slate-500">{s.email}</div>
                        </td>
                        <td className="px-3 py-3">
                          {s.course} ({s.branch || "—"})
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          Yr {s.current_year} / Sem {s.current_semester}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div>10th: {s.tenth_percentage}%</div>
                          <div>12th: {s.twelfth_percentage}%</div>
                        </td>
                        <td className="px-3 py-3 max-w-[210px] text-slate-700">
                          {formatSemesterScores(s.semester_scores, s.score_type)}
                        </td>
                        <td className="px-3 py-3 max-w-[190px] text-slate-600">
                          {s.achievements_till_12th?.trim() || "—"}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap space-y-1">
                          <div>
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                s.profile_completed
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {s.profile_completed ? "Complete" : "Incomplete"}
                            </span>
                          </div>
                          {s.resume_path && (
                            <a
                              href={`/api/resumes/${s.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-semibold text-[#2f228c] hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Open CV
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* POST / EDIT COMPANY MODAL */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingCompany
                    ? `Edit ${editingCompany.name}`
                    : "Post New Company Drive"}
                </h2>
                <p className="text-xs text-slate-500">
                  {editingCompany
                    ? "Updates take effect immediately on Student and Admin dashboards."
                    : "Published immediately to Student dashboards & emailed to registered students."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowPostModal(false);
                  setEditingCompany(null);
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCompany} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g., Infosys / TCS / Razorpay"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Package (CTC) *
                  </label>
                  <input
                    type="text"
                    required
                    value={packageCtc}
                    onChange={(e) => setPackageCtc(e.target.value)}
                    placeholder="e.g., 8.5 LPA"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                  />
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700">
                      Job Role / Position(s) *
                    </label>
                    <button
                      type="button"
                      onClick={addRoleField}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#2f228c]/25 bg-[#2f228c]/[0.06] px-2.5 py-1 text-xs font-semibold text-[#2f228c] hover:bg-[#2f228c]/10 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Role
                    </button>
                  </div>

                  <div className="space-y-2">
                    {companyRoles.map((roleVal, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          required={idx === 0}
                          value={roleVal}
                          onChange={(e) => updateRoleAt(idx, e.target.value)}
                          placeholder={
                            idx === 0
                              ? "e.g., Software Development Engineer"
                              : `Additional Role ${idx + 1} (e.g., Data Analyst)`
                          }
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                        />
                        {companyRoles.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRoleAt(idx)}
                            aria-label={`Remove role ${idx + 1}`}
                            className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:border-[#d7201c]/30 hover:text-[#d7201c] cursor-pointer"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Jaipur / Bengaluru / Hybrid"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Application Deadline *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Job Description &amp; Drive Notes *
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Key responsibilities, interview rounds, bond details, or skills required..."
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>

              {/* Optional Eligibility Criteria */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                <p className="text-xs font-bold text-slate-700">
                  Optional Eligibility Filters (leave blank for open to all)
                </p>

                <div>
                  <span className="block text-[11px] font-medium text-slate-600 mb-1.5">
                    Allowed Courses (none selected = all courses allowed)
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {COURSES.map((c) => {
                      const active = allowedCourses.includes(c.name);
                      return (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => toggleCourseSelection(c.name)}
                          className={`rounded-lg px-2.5 py-1 text-xs font-semibold border transition-colors cursor-pointer ${
                            active
                              ? "border-[#2f228c] bg-[#2f228c] text-[#fdfeff]"
                              : "border-slate-300 bg-[#fdfeff] text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {c.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Min 10th (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={minTenth}
                      onChange={(e) => setMinTenth(e.target.value)}
                      placeholder="e.g., 60"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Min 12th (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={minTwelfth}
                      onChange={(e) => setMinTwelfth(e.target.value)}
                      placeholder="e.g., 60"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Min Sem CGPA (0-10)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={minSemCgpa}
                      onChange={(e) => setMinSemCgpa(e.target.value)}
                      placeholder="e.g., 7.0"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
                    />
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2.5 text-sm font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                <span>
                  {editingCompany
                    ? "Send update notification email to all "
                    : "Send automated announcement email to all "}
                  <strong>{students.length}</strong> registered student(s) via
                  Resend
                </span>
              </label>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPostModal(false);
                    setEditingCompany(null);
                  }}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={postingCompany}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#2f228c] px-5 py-2 text-sm font-semibold text-[#fdfeff] hover:bg-[#23186d] disabled:opacity-60 cursor-pointer"
                >
                  {postingCompany && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {postingCompany
                    ? editingCompany
                      ? "Saving..."
                      : "Publishing..."
                    : editingCompany
                    ? "Save Changes"
                    : "Publish Company"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
