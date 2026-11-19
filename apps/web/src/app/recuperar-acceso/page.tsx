import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { CediahLogo } from "@/components/cediah-logo";

export const dynamic = "force-dynamic";

export default function RecoverAccessPage() {
  return (
    <main className="auth-page auth-page-paper auth-page-recover">
      <header className="auth-header">
        <Link className="brand" href="/" aria-label="Koras, inicio">
          <CediahLogo variant="dark" priority />
        </Link>
        <Link className="auth-mode-link" href="/acceder">Volver a acceder</Link>
      </header>
      <div className="auth-content">
        <AuthForm mode="recover" />
      </div>
    </main>
  );
}
