import { NextResponse } from "next/server";
import { getEnvAdminEmails, isAdminEmail, normalizeEmail } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdminEmail(user.email))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const email = normalizeEmail(body.email);

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  const client = createAdminClient() ?? supabase;
  const { data, error } = await client
    .from("admin_whitelist")
    .upsert(
      {
        email,
        added_by: normalizeEmail(user.email),
      },
      { onConflict: "email" }
    )
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ entry: data });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdminEmail(user.email))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const email = normalizeEmail(body.email);

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  if (email === normalizeEmail(user.email)) {
    return NextResponse.json(
      { error: "You cannot remove your own active admin email." },
      { status: 400 }
    );
  }

  if (getEnvAdminEmails().includes(email)) {
    return NextResponse.json(
      {
        error:
          "This email is configured in ADMIN_EMAILS environment variable and cannot be removed from the UI.",
      },
      { status: 400 }
    );
  }

  const client = createAdminClient() ?? supabase;
  const { error } = await client
    .from("admin_whitelist")
    .delete()
    .eq("email", email);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ removed: true });
}
