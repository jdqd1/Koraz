"use client";
import { contextFromQuery, learningRouteHref, type LearningRouteContext } from "@/lib/learning-navigation";
import { useLearningActivityLauncher } from "./use-learning-activity-launcher";

export function LearningOptionAction({ optionId, existingAttemptId, slug, context, children, completed }: {
  optionId: string; existingAttemptId: string | null; slug: string; context: LearningRouteContext; children: React.ReactNode; completed?: boolean;
}) {
  const launcher = useLearningActivityLauncher();
  return <div><button type="button" className="learning-option" disabled={launcher.busy} onClick={() => {
    const current = contextFromQuery(Object.fromEntries(new URLSearchParams(window.location.search)));
    void launcher.launch(optionId, existingAttemptId, learningRouteHref(slug, { ...current, ...context, tab: current.tab }));
  }}>{children}<em>{launcher.busy ? "Preparando…" : existingAttemptId ? "Retomar actividad" : completed ? "Practicar de nuevo" : "Comenzar actividad"}</em></button><p role="status">{launcher.message}</p></div>;
}
