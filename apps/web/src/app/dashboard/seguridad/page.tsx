import { AccountSecurityForm } from "@/components/account-security-form";

export const dynamic = "force-dynamic";

export default function AccountSecurityPage() {
  return <section className="auth-content"><AccountSecurityForm /></section>;
}
