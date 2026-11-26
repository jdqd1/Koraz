"use client";

import { createContext, useContext, useLayoutEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { usePathname } from "next/navigation";
import type { PlatformRole } from "@cediah/contracts";
import { isPlatformPath } from "@/lib/platform-routes";
import { AccessProvider } from "./access-context";
import { PersistentAppShell } from "./app-shell";

type ShellSession = {
  features: { guidedLearning: boolean; guidedLearningMap?: boolean };
  roles: PlatformRole[];
  viewer: { email: string };
};
const SessionBridge = createContext<Dispatch<SetStateAction<ShellSession | null>> | null>(null);

function AuthenticatedFrame({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<ShellSession | null>(null);
  return (
    <SessionBridge.Provider value={setSession}>
      <AccessProvider roles={session?.roles ?? []}>
        <PersistentAppShell
          guidedLearningEnabled={session?.features.guidedLearning ?? false}
          viewer={session?.viewer}
          profilePending={!session}
        >
          {children}
        </PersistentAppShell>
      </AccessProvider>
    </SessionBridge.Provider>
  );
}

/** The root layout survives transitions between all protected route segments.
 * Authorization stays in each server layout; this frame contains chrome only. */
export function PlatformFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return isPlatformPath(pathname) ? <AuthenticatedFrame>{children}</AuthenticatedFrame> : children;
}

/** Reflect the server's session verification in the persistent chrome. */
export function AuthenticatedShellSession({ session }: { session: ShellSession | null }) {
  const setSession = useContext(SessionBridge);
  useLayoutEffect(() => {
    setSession?.((previous) => {
      if (!session) return null;
      return previous?.viewer.email === session.viewer.email &&
        previous.roles.join() === session.roles.join() &&
        previous.features.guidedLearning === session.features.guidedLearning &&
        previous.features.guidedLearningMap === session.features.guidedLearningMap
        ? previous
        : session;
    });
  }, [session, setSession]);
  return null;
}
