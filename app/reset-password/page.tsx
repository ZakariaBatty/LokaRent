import { redirectAuthenticatedUser } from "@/shared/auth";
import { ResetPasswordForm } from "@/components/reset-password/reset-password-form";

type SearchParams = Promise<{ token?: string }>;

export default async function ResetPasswordPage({ searchParams }: { searchParams: SearchParams }) {
  await redirectAuthenticatedUser();
  const params = await searchParams;
  return <ResetPasswordForm token={params.token ?? ""} />;
}
