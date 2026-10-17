"use client";

import { ActivityPromptV2, ActivityFeedbackV2, type ActivityFieldsPropsV2 } from "./activity-fields";
import { ActivityStudyV2, ActivityChoiceOptionsV2, ActivityChoiceSolutionV2, ActivityShortSolutionV2, ActivityConstructedSolutionV2 } from "./activity-payloads";
import { VisualActivityV2 } from "./visual-activity";
import local from "./styles.module.css";

/** The same question and solution fields are used in the journey and assessment bank. */
export function ActivityContentV2(props: ActivityFieldsPropsV2) {
  const { activity } = props;
  return <><section className={local.configurationSection} aria-label="Contenido de la actividad"><h4>Contenido</h4><div className={local.stack}>
    <ActivityPromptV2 {...props} />
    {activity.kind === "study" ? <ActivityStudyV2 {...props} activity={activity} /> : null}
    {activity.kind === "single_choice" ? <ActivityChoiceOptionsV2 {...props} activity={activity} /> : null}
    <VisualActivityV2 {...props} />
  </div></section><section className={local.configurationSection} aria-label="Respuesta y explicación"><h4>{activity.kind === "study" ? "Explicación" : "Respuesta y explicación"}</h4><div className={local.stack}>
    {activity.kind === "single_choice" ? <ActivityChoiceSolutionV2 {...props} activity={activity} /> : null}
    {activity.kind === "short_answer" ? <ActivityShortSolutionV2 {...props} activity={activity} /> : null}
    {activity.kind === "constructed_response" ? <ActivityConstructedSolutionV2 {...props} activity={activity} /> : null}
    <VisualActivityV2 {...props} solution />
    <ActivityFeedbackV2 {...props} />
  </div></section></>;
}
