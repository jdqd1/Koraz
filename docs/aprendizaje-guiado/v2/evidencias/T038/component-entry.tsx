// Isolated browser fixture. Imports the actual production component and focus helper.
import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { ActivityEditorV2 } from "../../../../../apps/web/src/components/learning/editor/v2/activity-editor";
import { draftFromRouteV2 } from "../../../../../apps/web/src/components/learning/editor/v2/editor-model";
import { focusFieldIssueV2 } from "../../../../../apps/web/src/components/learning/editor/v2/sources-fields";
import fixture from "./browser-fixture.json";
import small from "./component-small-fixture.json";
function Fixture() {
  const [draft, setDraft] = useState(() => draftFromRouteV2(fixture));
  const surface = useRef<HTMLDivElement>(null);
  useEffect(() => { window.t038 = { draft }; }, [draft]);
  return <div ref={surface}><button type="button" onClick={() => focusFieldIssueV2(surface.current, "package.activities.0.prompt")}>Localizar consigna de estudio</button><button type="button" onClick={() => setDraft(draftFromRouteV2(small))}>Cargar fixture pequeña</button><ActivityEditorV2 draft={draft} disabled={false} onChange={setDraft} /></div>;
}
createRoot(document.getElementById("root")!).render(<Fixture />);
