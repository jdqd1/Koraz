import type { ReactNode } from "react";
import { AuthenticatedAppLayout } from "@/components/authenticated-app-layout";
import { PlatformTimeZone } from "@/components/user-time-zone";

export default function PanelLayout({ children }: { children: ReactNode }) {
  return <PlatformTimeZone><AuthenticatedAppLayout>{children}</AuthenticatedAppLayout></PlatformTimeZone>;
}
