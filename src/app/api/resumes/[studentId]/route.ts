import { NextResponse } from "next/server";
import { isAdminEmail, isLeadershipEmail } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Please sign in to access resumes." },
      { status: 401 }
    );
  }

  const isOwner = user.id === studentId;
  const isStaff =
    (await isAdminEmail(user.email)) || (await isLeadershipEmail(user.email));

  if (!isOwner && !isStaff) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const client = (isStaff ? createAdminClient() : null) ?? supabase;

  const { data: student, error } = await client
    .from("students")
    .select("resume_path, resume_filename")
    .eq("id", studentId)
    .maybeSingle();

  if (error || !student?.resume_path) {
    return NextResponse.json(
      { error: "Resume not found for this student." },
      { status: 404 }
    );
  }

  const { data: signedData, error: signedError } = await client.storage
    .from("resumes")
    .createSignedUrl(student.resume_path, 120, {
      download: false,
    });

  if (signedError || !signedData?.signedUrl) {
    return NextResponse.json(
      { error: "Could not generate resume download link." },
      { status: 500 }
    );
  }

  return NextResponse.redirect(signedData.signedUrl, { status: 302 });
}
