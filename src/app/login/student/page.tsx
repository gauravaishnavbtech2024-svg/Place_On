import { GoogleSignInCard } from "@/components/GoogleSignInCard";

interface StudentLoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function StudentLoginPage({
  searchParams,
}: StudentLoginPageProps) {
  const params = await searchParams;
  return <GoogleSignInCard role="student" errorCode={params.error} />;
}
