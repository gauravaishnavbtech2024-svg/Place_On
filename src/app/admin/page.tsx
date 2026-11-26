import { redirect } from "next/navigation";
import { AdminDashboardClient } from "@/components/AdminDashboardClient";
import { isAdminEmail, normalizeEmail } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Company, CompanyResponse, StudentProfile } from "@/lib/types";

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

  const [{ data: companies }, { data: students }, { data: responses }] =
    await Promise.all([
      client
        .from("companies")
        .select("*")
        .order("created_at", { ascending: false }),
      client
        .from("students")
        .select("*")
        .order("updated_at", { ascending: false }),
      client.from("company_responses").select("*"),
    ]);

  return (
    <AdminDashboardClient
      adminEmail={normalizeEmail(user.email)}
      initialCompanies={(companies as Company[]) ?? []}
      initialStudents={(students as StudentProfile[]) ?? []}
      initialResponses={(responses as CompanyResponse[]) ?? []}
    />
  );
}
