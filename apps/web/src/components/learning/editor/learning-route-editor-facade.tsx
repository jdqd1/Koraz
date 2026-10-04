"use client";

import type { LearningEditorResource, LearningPathDetail, V2BoundRouteDefinition } from "@cediah/contracts";
import { EditorShellV2 } from "./v2/editor-shell";
import type { EditorV2Draft } from "./v2/editor-model";
import type { EditorV2Api } from "./v2/editor-api";
import { EditorShell } from "./editor-shell";
import { EditorQueryProvider } from "./editor-query-provider";
import { EditorFocusProvider } from "./editor-focus";
import type { EditorApi } from "./editor-api";
import { useRouteEditor } from "./use-route-editor";

export type LearningRouteEditorProps = {
  actorUserId: string;
  canPublish: boolean;
  canReview: boolean;
  initialPath?: LearningPathDetail | V2BoundRouteDefinition;
  initialV2Draft?: EditorV2Draft;
  v2Transport?: EditorV2Api;
  initialResources: LearningEditorResource[];
  resourceNextCursor: string | null;
  resourceTopics: string[];
  routeTopics: Array<{ id: string; title: string }>;
  transport?: EditorApi;
  replaceUrl?: (href: string) => void;
};

export function LearningRouteEditor(props: LearningRouteEditorProps) {
  if (props.initialPath && "engineVersion" in props.initialPath) {
    return <EditorShellV2 actorUserId={props.actorUserId} canReview={props.canReview} canPublish={props.canPublish} key={`${props.actorUserId}:${props.initialPath.pathId}:${props.initialPath.pathVersionId}`} replaceUrl={props.replaceUrl} route={props.initialPath} transport={props.v2Transport} />;
  }
  if (!props.initialPath && props.initialV2Draft) {
    return <EditorShellV2 actorUserId={props.actorUserId} canReview={props.canReview} canPublish={props.canPublish} draft={props.initialV2Draft} key={`${props.actorUserId}:new:v2`} replaceUrl={props.replaceUrl} transport={props.v2Transport} />;
  }
  return <LearningRouteEditorV1 {...props} initialPath={props.initialPath} />;
}

function LearningRouteEditorV1(props: Omit<LearningRouteEditorProps, "initialPath"> & { initialPath?: LearningPathDetail }) {
  const editor = useRouteEditor({
    actorUserId: props.actorUserId,
    initialPath: props.initialPath,
    replaceUrl: props.replaceUrl,
    routeTopics: props.routeTopics,
    transport: props.transport,
  });

  const pathSessionId = editor.state.savedPath?.id ?? `new:${editor.state.creationId}`;
  return (
    <EditorQueryProvider key={`${props.actorUserId}:${pathSessionId}`} transport={props.transport}>
      <EditorFocusProvider>
        <EditorShell {...props} editor={editor} />
      </EditorFocusProvider>
    </EditorQueryProvider>
  );
}
