import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/server/current-user";
import { AccessProvider } from "./access-context";
import { AuthenticatedShellSession } from "./platform-frame";
import { InteractiveTermEditorBridge } from "./interactive-term-editor-bridge";
import { UserTimeZoneSync } from "./user-time-zone";

type AuthenticatedAppLayoutProps = {
  children: ReactNode;
};

export async function AuthenticatedAppLayout({
  children,
}: AuthenticatedAppLayoutProps) {
  const current = await getCurrentUser();

  if (current.status === "unavailable") {
    const explanation = {
      timeout: "El servidor tardó demasiado en responder. Puedes volver a intentarlo.",
      connection: "Revisa tu conexión y vuelve a intentarlo.",
      service: "El servicio de acceso está temporalmente inactivo. Reintenta en unos momentos.",
      invalid_response: "Recibimos datos de sesión que no pudimos leer. Si el problema persiste, comparte la referencia con soporte.",
    };
    return <main className="page-shell"><h1>No pudimos verificar tu sesión</h1>
      <p>{explanation[current.reason]}</p>
      <a className="button button-primary" href="">Reintentar</a>
      <details><summary>Detalles del problema</summary><p>Referencia: {current.reference}</p></details></main>;
  }
  if (current.status !== "authenticated") {
    redirect(
      "/acceder?error=sesion",
    );
  }

  return (
    <AccessProvider roles={current.roles}>
      <UserTimeZoneSync key={current.user.id} userId={current.user.id} />
      <AuthenticatedShellSession
        features={current.features}
        roles={current.roles}
        viewer={{ email: current.user.email }}
      />
      <InteractiveTermEditorBridge />
      {children}
    </AccessProvider>
  );
}
