import { redirect } from "next/navigation";
import { AdminDashboardClient } from "@/components/AdminDashboardClient";
import { getEnvAdminEmails, isAdminEmail, normalizeEmail } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type {
  AdminWhitelistEntry,
  Company,
  CompanyResponse,
  StudentProfile,
} from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdminEmail(user.email))) {
    redirect("/login/admin?error=unauthorized_admin");
  }

  const client = createAdminClient() ?? supabase;

  const [
    { data: companies },
    { data: students },
    { data: responses },
    { data: dbWhitelist },
  ] = await Promise.all([
    client
      .from("companies")
      .select("*")
      .order("created_at", { ascending: false }),
    client
      .from("students")
      .select("*")
      .order("updated_at", { ascending: false }),
    client.from("company_responses").select("*"),
    client
      .from("admin_whitelist")
      .select("*")
      .order("created_at", { ascending: true }),
  ]);

  const envAdmins = getEnvAdminEmails();
  const dbRows = (dbWhitelist as AdminWhitelistEntry[]) ?? [];
  const mergedMap = new Map<string, AdminWhitelistEntry>();

  for (const email of envAdmins) {
    mergedMap.set(email, {
      email,
      added_by: "env",
      created_at: new Date().toISOString(),
      source: "env",
    });
  }

  for (const row of dbRows) {
    const email = normalizeEmail(row.email);
    const existing = mergedMap.get(email);
    mergedMap.set(email, {
      ...row,
      email,
      source: existing ? "both" : "database",
    });
  }

  return (
    <AdminDashboardClient
      adminEmail={normalizeEmail(user.email)}
      initialCompanies={(companies as Company[]) ?? []}
      initialStudents={(students as StudentProfile[]) ?? []}
      initialResponses={(responses as CompanyResponse[]) ?? []}
      initialWhitelist={Array.from(mergedMap.values())}
    />
  );
}
