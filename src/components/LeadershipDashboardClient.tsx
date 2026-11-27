"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpDown,
  Building2,
  CalendarClock,
  CheckCircle2,
  Download,
  ExternalLink,
  Filter,
  Landmark,
  Mail,
  MapPin,
  Search,
  UserCheck,
  Users,
} from "lucide-react";
import { AppHeader } from "./AppHeader";
import { CompanySortSelect } from "./CompanySortSelect";
import { SignOutButton } from "./SignOutButton";
import { sortCompanies, type CompanySortOption } from "@/lib/companySort";
import { parseCompanyRoles } from "@/lib/companyValidation";
import { COURSES } from "@/lib/constants";
import {
  calculateAverageScore,
  formatSemesterScores,
} from "@/lib/eligibility";
import { downloadInterestedStudentsPdf } from "@/lib/pdf";
import type { Company, CompanyResponse, StudentProfile } from "@/lib/types";

interface LeadershipDashboardClientProps {
  viewerEmail: string;
  initialCompanies: Company[];
  initialStudents: StudentProfile[];
  initialResponses: CompanyResponse[];
}

type StudentSortOption = "interest_desc" | "interest_asc" | "name_asc";

export function LeadershipDashboardClient({
  viewerEmail,
  initialCompanies,
  initialStudents,
  initialResponses,
}: LeadershipDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<"companies" | "students">(
    "companies"
  );

  // Tab 1: Companies & Admin Filter State
  const [adminFilter, setAdminFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OPEN" | "CLOSED">(
    "ALL"
  );
  const [companyQuery, setCompanyQuery] = useState("");
  const [companySortBy, setCompanySortBy] =
    useState<CompanySortOption>("posted_desc");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    initialCompanies[0]?.id ?? null
  );

  // Tab 2: Student Interest Tracker State
  const [studentQuery, setStudentQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("ALL");
  const [yearFilter, setYearFilter] = useState("ALL");
  const [interestFilter, setInterestFilter] = useState<
    "ALL" | "ONE_PLUS" | "TWO_PLUS" | "ZERO"
  >("ALL");
  const [studentSortBy, setStudentSortBy] =
    useState<StudentSortOption>("interest_desc");

  const studentById = useMemo(() => {
    const map = new Map<string, StudentProfile>();
    for (const s of initialStudents) {
      map.set(s.id, s);
    }
    return map;
  }, [initialStudents]);

  const companyById = useMemo(() => {
    const map = new Map<string, Company>();
    for (const c of initialCompanies) {
      map.set(c.id, c);
    }
    return map;
  }, [initialCompanies]);

  // Per-company interested / declined counts
  const countsByCompany = useMemo(() => {
    const map = new Map<
      string,
      { interested: StudentProfile[]; notInterestedCount: number }
    >();
    for (const c of initialCompanies) {
      map.set(c.id, { interested: [], notInterestedCount: 0 });
    }
    for (const r of initialResponses) {
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
  }, [initialCompanies, initialResponses, studentById]);

  // Per-student interested companies list
  const interestedCompaniesByStudent = useMemo(() => {
    const map = new Map<string, Company[]>();
    for (const s of initialStudents) {
      map.set(s.id, []);
    }
    for (const r of initialResponses) {
      if (r.status !== "interested") continue;
      const company = companyById.get(r.company_id);
      const list = map.get(r.student_id);
      if (company && list) {
        list.push(company);
      }
    }
    return map;
  }, [initialStudents, initialResponses, companyById]);

  // Admin activity summary: which admin posted how many companies & total interested
  const adminSummaries = useMemo(() => {
    const map = new Map<
      string,
      { email: string; companyCount: number; interestedTotal: number }
    >();
    for (const c of initialCompanies) {
      const adminEmail = (c.created_by || "Unknown").toLowerCase();
      const existing = map.get(adminEmail) ?? {
        email: adminEmail,
        companyCount: 0,
        interestedTotal: 0,
      };
      existing.companyCount += 1;
      existing.interestedTotal +=
        countsByCompany.get(c.id)?.interested.length ?? 0;
      map.set(adminEmail, existing);
    }
    return Array.from(map.values()).sort(
      (a, b) => b.companyCount - a.companyCount
    );
  }, [initialCompanies, countsByCompany]);

  const filteredAndSortedCompanies = useMemo(() => {
    const now = Date.now();
    const q = companyQuery.trim().toLowerCase();
    const filtered = initialCompanies.filter((c) => {
      const adminEmail = (c.created_by || "").toLowerCase();
      if (adminFilter !== "ALL" && adminEmail !== adminFilter) return false;

      const isOpen = new Date(c.deadline).getTime() > now;
      if (statusFilter === "OPEN" && !isOpen) return false;
      if (statusFilter === "CLOSED" && isOpen) return false;

      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        adminEmail.includes(q)
      );
    });
    return sortCompanies(filtered, companySortBy);
  }, [
    initialCompanies,
    adminFilter,
    statusFilter,
    companyQuery,
    companySortBy,
  ]);

  // Keep selectedCompanyId synced when filters hide the previously selected company
  useEffect(() => {
    if (filteredAndSortedCompanies.length === 0) {
      setSelectedCompanyId(null);
      return;
    }
    if (
      !selectedCompanyId ||
      !filteredAndSortedCompanies.some((c) => c.id === selectedCompanyId)
    ) {
      setSelectedCompanyId(filteredAndSortedCompanies[0].id);
    }
  }, [filteredAndSortedCompanies, selectedCompanyId]);

  const selectedCompany = useMemo(
    () =>
      filteredAndSortedCompanies.find((c) => c.id === selectedCompanyId) ??
      null,
    [filteredAndSortedCompanies, selectedCompanyId]
  );

  const selectedInterestedStudents = useMemo(() => {
    if (!selectedCompany) return [];
    return countsByCompany.get(selectedCompany.id)?.interested ?? [];
  }, [selectedCompany, countsByCompany]);

  // Student Interest Tracker rows
  const filteredAndSortedStudents = useMemo(() => {
    const q = studentQuery.trim().toLowerCase();
    const rows = initialStudents
      .map((s) => ({
        student: s,
        interestedCompanies: interestedCompaniesByStudent.get(s.id) ?? [],
      }))
      .filter(({ student: s, interestedCompanies }) => {
        if (courseFilter !== "ALL" && s.course !== courseFilter) return false;
        if (yearFilter !== "ALL" && String(s.current_year) !== yearFilter)
          return false;

        if (interestFilter === "ONE_PLUS" && interestedCompanies.length < 1)
          return false;
        if (interestFilter === "TWO_PLUS" && interestedCompanies.length < 2)
          return false;
        if (interestFilter === "ZERO" && interestedCompanies.length !== 0)
          return false;

        if (!q) return true;
        const matchesStudent =
          s.full_name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.branch.toLowerCase().includes(q);
        const matchesCompany = interestedCompanies.some(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.role.toLowerCase().includes(q)
        );
        return matchesStudent || matchesCompany;
      });

    return rows.sort((a, b) => {
      if (studentSortBy === "interest_desc") {
        const diff =
          b.interestedCompanies.length - a.interestedCompanies.length;
        if (diff !== 0) return diff;
        return (a.student.full_name || a.student.email).localeCompare(
          b.student.full_name || b.student.email
        );
      }
      if (studentSortBy === "interest_asc") {
        const diff =
          a.interestedCompanies.length - b.interestedCompanies.length;
        if (diff !== 0) return diff;
        return (a.student.full_name || a.student.email).localeCompare(
          b.student.full_name || b.student.email
        );
      }
      return (a.student.full_name || a.student.email).localeCompare(
        b.student.full_name || b.student.email
      );
    });
  }, [
    initialStudents,
    interestedCompaniesByStudent,
    studentQuery,
    courseFilter,
    yearFilter,
    interestFilter,
    studentSortBy,
  ]);

  const activeInterestedStudentsCount = useMemo(
    () =>
      initialStudents.filter(
        (s) => (interestedCompaniesByStudent.get(s.id)?.length ?? 0) > 0
      ).length,
    [initialStudents, interestedCompaniesByStudent]
  );

  const totalInterestedCount = useMemo(
    () => initialResponses.filter((r) => r.status === "interested").length,
    [initialResponses]
  );

  return (
    <div className="min-h-screen bg-[#fdfeff]">
      <AppHeader
        href="/leadership"
        subtitle="Dean / Director / HoD Portal"
        maxWidthClass="max-w-7xl"
        rightContent={
          <>
            <div className="hidden lg:flex flex-col items-end">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#2f228c]">
                <Landmark className="h-3.5 w-3.5 text-[#d7201c]" />
                Leadership Oversight
              </span>
              <span className="text-xs text-slate-500">{viewerEmail}</span>
            </div>
            <SignOutButton />
          </>
        }
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
        {/* Executive Summary Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-[#fdfeff] p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Posted Companies
              </span>
              <Building2 className="h-5 w-5 text-[#d7201c]" />
            </div>
            <p className="mt-2 text-3xl font-extrabold text-[#18162b]">
              {initialCompanies.length}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Posted by {adminSummaries.length} admin coordinator(s)
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-[#fdfeff] p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Participating Students
              </span>
              <Users className="h-5 w-5 text-[#2f228c]" />
            </div>
            <p className="mt-2 text-3xl font-extrabold text-[#18162b]">
              {activeInterestedStudentsCount}{" "}
              <span className="text-base font-semibold text-slate-400">
                / {initialStudents.length}
              </span>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Students interested in at least 1 company
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-[#fdfeff] p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Interest Entries
              </span>
              <CheckCircle2 className="h-5 w-5 text-[#2f228c]" />
            </div>
            <p className="mt-2 text-3xl font-extrabold text-[#18162b]">
              {totalInterestedCount}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Avg{" "}
              {activeInterestedStudentsCount > 0
                ? (
                    totalInterestedCount / activeInterestedStudentsCount
                  ).toFixed(1)
                : "0.0"}{" "}
              companies per participating student
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
            Companies by Admin ({initialCompanies.length})
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
            <UserCheck className="h-4 w-4" />
            Student Interest Tracker ({initialStudents.length})
          </button>
        </div>

        {/* TAB 1: COMPANIES BY ADMIN */}
        {activeTab === "companies" && (
          <div className="space-y-5">
            {/* Coordinator Filter Chips & Controls */}
            <div className="rounded-2xl border border-slate-200 bg-[#fdfeff] p-4 shadow-sm space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                  <Filter className="h-4 w-4 text-[#d7201c]" />
                  Filter by Posting Admin &amp; Sort Drives
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={companyQuery}
                      onChange={(e) => setCompanyQuery(e.target.value)}
                      placeholder="Search company, role, admin..."
                      className="rounded-xl border border-slate-200 bg-[#fdfeff] pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:border-[#2f228c] focus:outline-none"
                    />
                  </div>

                  <select
                    aria-label="Filter by admin"
                    value={adminFilter}
                    onChange={(e) => setAdminFilter(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-[#fdfeff] px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-[#2f228c] focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">
                      All Admins ({initialCompanies.length})
                    </option>
                    {adminSummaries.map((admin) => (
                      <option key={admin.email} value={admin.email}>
                        {admin.email} ({admin.companyCount})
                      </option>
                    ))}
                  </select>

                  <select
                    aria-label="Filter by drive status"
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(
                        e.target.value as "ALL" | "OPEN" | "CLOSED"
                      )
                    }
                    className="rounded-xl border border-slate-200 bg-[#fdfeff] px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-[#2f228c] focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="OPEN">Open Only</option>
                    <option value="CLOSED">Closed Only</option>
                  </select>

                  <CompanySortSelect
                    value={companySortBy}
                    onChange={setCompanySortBy}
                  />
                </div>
              </div>

              {/* Quick clickable Admin pills */}
              {adminSummaries.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setAdminFilter("ALL")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold border transition-colors cursor-pointer ${
                      adminFilter === "ALL"
                        ? "border-[#2f228c] bg-[#2f228c] text-[#fdfeff]"
                        : "border-slate-200 bg-[#fdfeff] text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    All Admins ({initialCompanies.length})
                  </button>
                  {adminSummaries.map((admin) => {
                    const active = adminFilter === admin.email;
                    return (
                      <button
                        key={admin.email}
                        type="button"
                        onClick={() =>
                          setAdminFilter(active ? "ALL" : admin.email)
                        }
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold border transition-colors cursor-pointer ${
                          active
                            ? "border-[#d7201c] bg-[#d7201c] text-[#fdfeff]"
                            : "border-slate-200 bg-[#fdfeff] text-slate-700 hover:border-[#2f228c]/40"
                        }`}
                      >
                        <span>{admin.email}</span>
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                            active
                              ? "bg-white/20 text-white"
                              : "bg-[#2f228c]/10 text-[#2f228c]"
                          }`}
                        >
                          {admin.companyCount} posted &bull;{" "}
                          {admin.interestedTotal} interested
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Company List + Details */}
            <div className="grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-4 space-y-2.5">
                {filteredAndSortedCompanies.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-[#fdfeff] p-8 text-center text-sm text-slate-500">
                    No companies match your selected admin/filter.
                  </div>
                ) : (
                  filteredAndSortedCompanies.map((company) => {
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

                        <div className="mt-2.5 text-[11px] font-medium text-[#d7201c] truncate">
                          Posted by: {company.created_by}
                        </div>

                        <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                          <span className="font-semibold text-emerald-700">
                            {interestedCount} Interested
                          </span>
                          <span>{notInterestedCount} Declined</span>
                          <span className="text-slate-500">
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
                  })
                )}
              </div>

              <div className="lg:col-span-8">
                {selectedCompany ? (
                  <div className="rounded-2xl border border-slate-200 bg-[#fdfeff] p-6 shadow-sm space-y-6">
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

                        <div className="mt-2.5 flex flex-wrap gap-3 text-xs text-slate-600">
                          <span className="inline-flex items-center gap-1 rounded-md bg-[#d7201c]/[0.08] px-2 py-0.5 font-semibold text-[#d7201c]">
                            Posted by: {selectedCompany.created_by}
                          </span>
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
                            {new Date(
                              selectedCompany.created_at
                            ).toLocaleString("en-IN", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5 text-slate-400" />
                            Emailed to {selectedCompany.email_sent_count}{" "}
                            students
                          </span>
                        </div>
                      </div>

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
                    </div>

                    <p className="text-sm text-slate-600 whitespace-pre-line">
                      {selectedCompany.description}
                    </p>

                    <div>
                      <h3 className="mb-3 text-base font-bold text-[#18162b]">
                        Interested Students ({selectedInterestedStudents.length}
                        )
                      </h3>

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
                                  Total Interested Drives
                                </th>
                                <th className="px-3 py-2.5 font-semibold">
                                  CV
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-[#fdfeff]">
                              {selectedInterestedStudents.map((s, idx) => {
                                const count =
                                  interestedCompaniesByStudent.get(s.id)
                                    ?.length ?? 0;
                                return (
                                  <tr
                                    key={s.id}
                                    className="hover:bg-slate-50/70"
                                  >
                                    <td className="px-3 py-3 text-slate-500">
                                      {idx + 1}
                                    </td>
                                    <td className="px-3 py-3">
                                      <div className="font-semibold text-slate-900">
                                        {s.full_name}
                                      </div>
                                      <div className="text-slate-500">
                                        {s.email}
                                      </div>
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
                                    <td className="px-3 py-3 max-w-[190px] text-slate-700">
                                      {formatSemesterScores(
                                        s.semester_scores,
                                        s.score_type
                                      )}
                                    </td>
                                    <td className="px-3 py-3 whitespace-nowrap">
                                      <span className="rounded-full bg-[#2f228c]/10 px-2.5 py-0.5 font-semibold text-[#2f228c]">
                                        {count}{" "}
                                        {count === 1 ? "Company" : "Companies"}
                                      </span>
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
                                        <span className="text-slate-400">
                                          None
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-[#fdfeff] p-12 text-center text-sm text-slate-500">
                    Select a company drive on the left to inspect its details
                    and interested students.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STUDENT INTEREST TRACKER */}
        {activeTab === "students" && (
          <div className="rounded-2xl border border-slate-200 bg-[#fdfeff] p-6 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[#18162b]">
                  Student Interest Tracker
                </h2>
                <p className="text-xs text-slate-500">
                  See how many companies each student is interested in, which
                  companies they selected, and who posted each drive.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={studentQuery}
                    onChange={(e) => setStudentQuery(e.target.value)}
                    placeholder="Search student or company..."
                    className="rounded-xl border border-slate-300 pl-8 pr-3 py-2 text-xs text-slate-900 focus:border-[#2f228c] focus:outline-none"
                  />
                </div>

                <select
                  aria-label="Filter by course"
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="rounded-xl border border-slate-300 bg-[#fdfeff] px-3 py-2 text-xs text-slate-700"
                >
                  <option value="ALL">All Courses</option>
                  {COURSES.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Filter by year"
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="rounded-xl border border-slate-300 bg-[#fdfeff] px-3 py-2 text-xs text-slate-700"
                >
                  <option value="ALL">All Years</option>
                  {[1, 2, 3, 4].map((yr) => (
                    <option key={yr} value={String(yr)}>
                      Year {yr}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Filter by interest count"
                  value={interestFilter}
                  onChange={(e) =>
                    setInterestFilter(
                      e.target.value as "ALL" | "ONE_PLUS" | "TWO_PLUS" | "ZERO"
                    )
                  }
                  className="rounded-xl border border-slate-300 bg-[#fdfeff] px-3 py-2 text-xs text-slate-700"
                >
                  <option value="ALL">All Students</option>
                  <option value="ONE_PLUS">1+ Companies</option>
                  <option value="TWO_PLUS">2+ Companies</option>
                  <option value="ZERO">0 Companies</option>
                </select>

                <div className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-[#fdfeff] px-2.5 py-1.5">
                  <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <select
                    aria-label="Sort students"
                    value={studentSortBy}
                    onChange={(e) =>
                      setStudentSortBy(e.target.value as StudentSortOption)
                    }
                    className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="interest_desc">
                      Interested Count: High to Low
                    </option>
                    <option value="interest_asc">
                      Interested Count: Low to High
                    </option>
                    <option value="name_asc">Name: A to Z</option>
                  </select>
                </div>
              </div>
            </div>

            {filteredAndSortedStudents.length === 0 ? (
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
                        Course &amp; Year
                      </th>
                      <th className="px-3 py-2.5 font-semibold">
                        Academic Scores
                      </th>
                      <th className="px-3 py-2.5 font-semibold">
                        Interested Count
                      </th>
                      <th className="px-3 py-2.5 font-semibold">
                        Interested Companies
                      </th>
                      <th className="px-3 py-2.5 font-semibold">CV</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-[#fdfeff]">
                    {filteredAndSortedStudents.map(
                      ({ student: s, interestedCompanies }, idx) => {
                        const { average } = calculateAverageScore(
                          s.semester_scores,
                          s.score_type
                        );
                        return (
                          <tr key={s.id} className="hover:bg-slate-50/70">
                            <td className="px-3 py-3 text-slate-500">
                              {idx + 1}
                            </td>
                            <td className="px-3 py-3">
                              <div className="font-semibold text-slate-900">
                                {s.full_name || "Unnamed"}
                              </div>
                              <div className="text-slate-500">{s.email}</div>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              <div className="font-medium text-slate-800">
                                {s.course} ({s.branch || "—"})
                              </div>
                              <div className="text-slate-500">
                                Yr {s.current_year} / Sem {s.current_semester}
                              </div>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              <div>
                                10th: {s.tenth_percentage}% | 12th:{" "}
                                {s.twelfth_percentage}%
                              </div>
                              <div className="text-slate-500">
                                Sem Avg:{" "}
                                {average !== null
                                  ? `${average}${
                                      s.score_type === "PERCENTAGE"
                                        ? "%"
                                        : " CGPA"
                                    }`
                                  : "N/A"}
                              </div>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${
                                  interestedCompanies.length > 0
                                    ? "bg-[#2f228c]/10 text-[#2f228c]"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {interestedCompanies.length}{" "}
                                {interestedCompanies.length === 1
                                  ? "Company"
                                  : "Companies"}
                              </span>
                            </td>
                            <td className="px-3 py-3 max-w-[340px]">
                              {interestedCompanies.length === 0 ? (
                                <span className="text-slate-400">
                                  No companies selected yet
                                </span>
                              ) : (
                                <div className="flex flex-wrap gap-1.5">
                                  {interestedCompanies.map((c) => (
                                    <button
                                      key={c.id}
                                      type="button"
                                      title={`Role: ${c.role} | Posted by: ${c.created_by}`}
                                      onClick={() => {
                                        setSelectedCompanyId(c.id);
                                        setActiveTab("companies");
                                      }}
                                      className="inline-flex items-center gap-1 rounded-lg border border-[#2f228c]/20 bg-[#2f228c]/[0.05] px-2 py-1 text-[11px] font-semibold text-[#2f228c] hover:bg-[#2f228c] hover:text-[#fdfeff] transition-colors cursor-pointer"
                                    >
                                      <span>{c.name}</span>
                                      <span className="opacity-75">
                                        ({c.package_ctc})
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              {s.resume_path ? (
                                <a
                                  href={`/api/resumes/${s.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 font-semibold text-[#2f228c] hover:underline"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  Open CV
                                </a>
                              ) : (
                                <span className="text-slate-400">None</span>
                              )}
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
