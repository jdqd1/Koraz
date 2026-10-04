"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { createEditorV2State, type EditorV2Draft } from "./editor-model";
import { createEditorV2Controller } from "./editor-controller";
import { editorV2RecoveryKey, parseEditorV2Recovery, recoveryMatchesV2, type EditorV2Recovery } from "./editor-recovery";
import type { EditorV2Api } from "./editor-api";
import type { V2BoundRouteDefinition } from "@cediah/contracts";

export function useRouteEditorV2(input: {
  actorUserId: string; route?: V2BoundRouteDefinition; draft?: EditorV2Draft;
  transport?: EditorV2Api; replaceUrl?: (href: string) => void;
}) {
  const router = useRouter();
  const [controller] = useState(() => createEditorV2Controller({
    state: createEditorV2State(input), actorUserId: input.actorUserId, api: input.transport,
    storage: {
      setItem(key, value) { sessionStorage.setItem(key, value); },
      removeItem(key) { sessionStorage.removeItem(key); },
    },
    onCreated: (pathId) => (input.replaceUrl ?? router.replace)(`/panel/rutas/${encodeURIComponent(pathId)}`),
  }));
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const [recoveryStore] = useState(() => {
    const serverSnapshot = { candidate: null as EditorV2Recovery | null, available: true };
    let snapshot: typeof serverSnapshot | null = null;
    return {
      subscribe: () => () => {},
      getServerSnapshot: () => serverSnapshot,
      getSnapshot() {
        if (!snapshot) {
          try {
            const base = controller.getSnapshot();
            snapshot = { candidate: parseEditorV2Recovery(sessionStorage.getItem(editorV2RecoveryKey(input.actorUserId, base.confirmed?.pathId)), input.actorUserId, base.confirmed?.pathId ?? null), available: true };
          } catch { snapshot = { candidate: null, available: false }; }
        }
        return snapshot;
      },
    };
  });
  const recoverySnapshot = useSyncExternalStore(recoveryStore.subscribe, recoveryStore.getSnapshot, recoveryStore.getServerSnapshot);
  const [recoveryDismissed, setRecoveryDismissed] = useState(false);
  const recoveryCandidate = recoveryDismissed ? null : recoverySnapshot.candidate;
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const leavingConfirmed = useRef(false);
  useEffect(() => {
    function beforeUnload(event: BeforeUnloadEvent) {
      if (leavingConfirmed.current || !controller.getSnapshot().dirty) return;
      event.preventDefault();
    }
    function followLink(event: MouseEvent) {
      const anchor = event.target instanceof Element ? event.target.closest("a") : null;
      if (!controller.getSnapshot().dirty || !anchor || anchor.download || anchor.target === "_blank" || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const url = new URL(anchor.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      event.preventDefault();
      event.stopPropagation();
      setPendingNavigation(anchor.href);
    }
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", followLink, true);
    return () => { window.removeEventListener("beforeunload", beforeUnload); document.removeEventListener("click", followLink, true); };
  }, [controller]);
  function downloadDraft(recovery = controller.recovery()) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(recovery, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `${state.draft.package.packageKey}.borrador-local.json`;
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return {
    state, controller, downloadDraft, recoveryCandidate,
    recoveryConflict: Boolean(recoveryCandidate && !recoveryMatchesV2(recoveryCandidate, state)),
    recoveryAvailable: recoverySnapshot.available && controller.storageAvailable(),
    recover() { if (recoveryCandidate && controller.recover(recoveryCandidate)) setRecoveryDismissed(true); },
    discardRecovery() { controller.discardRecovery(); setRecoveryDismissed(true); },
    pendingNavigation, setPendingNavigation,
    leave() { if (pendingNavigation) { leavingConfirmed.current = true; window.location.assign(pendingNavigation); } },
    async saveAndLeave() { if (await controller.save()) { if (pendingNavigation) window.location.assign(pendingNavigation); } },
  };
}
