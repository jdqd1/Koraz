"use client";
import type { ActivityFieldsPropsV2 } from "./activity-fields";
import { RelationFieldsV2 } from "./relation-fields";
import { SequenceFieldsV2 } from "./sequence-fields";
import { CaseFieldsV2 } from "./case-fields";
import { VisualFieldsV2 } from "./visual-fields";

export function VisualActivityV2(props: ActivityFieldsPropsV2 & { solution?: boolean }) {
  switch (props.activity.kind) {
    case "match": return <RelationFieldsV2 {...props} activity={props.activity} />;
    case "sequence": return <SequenceFieldsV2 {...props} activity={props.activity} />;
    case "image_target": return <VisualFieldsV2 {...props} activity={props.activity} />;
    case "case": return props.solution ? null : <CaseFieldsV2 {...props} activity={props.activity} />;
    default: return null;
  }
}
