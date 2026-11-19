"use client";

import { RouteDetailContent } from "../route-detail-content";
import type { LearningRouteContext } from "@/lib/learning-navigation";
import type { V2Path, V2State } from "./model";
import { RouteCurriculum, CurriculumResources } from "./curriculum";

export function RouteContent({ path, state, focusUnit, unitOnly = false, returnTo, context }: { path: V2Path; state: V2State | null; focusUnit?: string; unitOnly?: boolean; returnTo?: string | null; context?: LearningRouteContext }) {
  return <RouteDetailContent slug={path.slug} context={context ?? { unit: focusUnit }}
    activities={<RouteCurriculum path={path} state={state} focusUnit={focusUnit} unitOnly={unitOnly} returnTo={returnTo} />}
    resources={<CurriculumResources path={path} focusUnit={focusUnit} unitOnly={unitOnly} returnTo={returnTo} />} />;
}
