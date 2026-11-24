import { GoogleSignInCard } from "@/components/GoogleSignInCard";

interface AdminLoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const params = await searchParams;
  return <GoogleSignInCard role="admin" errorCode={params.error} />;
}
