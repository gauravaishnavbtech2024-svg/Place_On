import { GoogleSignInCard } from "@/components/GoogleSignInCard";

interface LeadershipLoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function LeadershipLoginPage({
  searchParams,
}: LeadershipLoginPageProps) {
  const params = await searchParams;
  return <GoogleSignInCard role="leadership" errorCode={params.error} />;
}
