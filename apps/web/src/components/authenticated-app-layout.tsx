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

  if (current.status !== "authenticated") {
    redirect(
      current.status === "unavailable"
        ? "/acceder?error=configuracion"
        : "/acceder?error=sesion",
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
