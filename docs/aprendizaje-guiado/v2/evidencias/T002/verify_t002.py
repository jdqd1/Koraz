"""Read-only checks for the T002 documentary handoff. Run with Python 3."""

import hashlib
import json
import re
import subprocess
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[5]
DOCS = ROOT / "docs/aprendizaje-guiado/v2"
SOURCE = Path(
    r"C:\Users\josed\Documents\Codex\2026-09-26"
    r"\act-a-como-arquitecto-principal-de-2\outputs\koraz-rutas-aprendizaje"
)


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def git(*args):
    result = subprocess.run(["git", *args], cwd=ROOT, text=True, capture_output=True)
    if result.returncode:
        raise RuntimeError(result.stderr.strip())
    return result.stdout.strip()


def topo(tasks):
    by_id = {item["id"]: item for item in tasks}
    if len(by_id) != len(tasks):
        raise AssertionError("duplicate task ID")
    waiting = {key: set(item["dependencies"]) for key, item in by_id.items()}
    for key, deps in waiting.items():
        if key in deps or not deps <= by_id.keys():
            raise AssertionError(f"invalid dependency at {key}: {sorted(deps)}")
    order = []
    while waiting:
        ready = sorted(key for key, deps in waiting.items() if not deps)
        if not ready:
            raise AssertionError(f"cycle: {sorted(waiting)}")
        order.extend(ready)
        for key in ready:
            del waiting[key]
        for deps in waiting.values():
            deps.difference_update(ready)
    return order


def main():
    tasks_source = SOURCE / "tareas.json"
    handoff = SOURCE / "HANDOFF-EJECUTOR.md"
    plan = json.loads(tasks_source.read_text(encoding="utf-8-sig"))
    registry = json.loads((DOCS / "registro-ejecucion.json").read_text(encoding="utf-8"))
    baseline = json.loads((DOCS / "evidencias/T001/baseline.json").read_text(encoding="utf-8"))
    adr = (DOCS / "ADR-v2.md").read_text(encoding="utf-8")
    policy = (DOCS / "policy-spec.md").read_text(encoding="utf-8")
    head = git("rev-parse", "HEAD")
    status = git("status", "--short")
    tracked_diff = git("diff", "--name-only", "HEAD")

    assert head == plan["baseCommit"] == baseline["baseSha"] == registry["baseSha"]
    assert baseline["status"] == "PASS"
    assert not tracked_diff, f"tracked product changes: {tracked_diff}"
    assert registry["handoffSha256"] == sha256(handoff)
    assert registry["tasksSourceSha256"] == sha256(tasks_source)
    assert len(plan["tasks"]) == len(registry["tasks"]) == 46
    order = topo(plan["tasks"])
    assert order.index("T001") < order.index("T002") < order.index("T003")

    by_registry = {item["taskId"]: item for item in registry["tasks"]}
    for item in plan["tasks"]:
        saved = by_registry[item["id"]]
        assert saved["dependencies"] == item["dependencies"]
        assert saved["capacity"] == item["capacity"]
        assert saved["objective"] == item["objective"]
    assert by_registry["T001"]["status"] == "PASS"
    assert all(by_registry[f"T{number:03d}"]["status"] == "NO VERIFICADO" for number in range(3, 47))

    decision_counts = Counter(re.findall(r"^\| (D\d{2}) \|", adr, flags=re.MULTILINE))
    requirement_counts = Counter(re.findall(r"^\| (R\d{2}) \|", adr, flags=re.MULTILINE))
    expected_decisions = {f"D{n:02d}" for n in range(1, 18)}
    expected_requirements = {f"R{n:02d}" for n in range(1, 21)}
    assert set(decision_counts) == expected_decisions and all(n == 1 for n in decision_counts.values())
    assert set(requirement_counts) == expected_requirements and all(n == 1 for n in requirement_counts.values())
    assert {row["requirementId"] for row in registry["requirementTraceability"]} == expected_requirements
    assert len(registry["pendingInputs"]) == 7

    for marker in [
        'schemaVersion="2.0"', 'policyVersion="guided-v2.0"',
        'schedulerVersion="scheduler-v2.0"',
        'GUIDED_LEARNING_V2_ENABLED=false',
        'GUIDED_LEARNING_V2_NEW_ENROLLMENTS=false',
    ]:
        assert marker in adr, f"missing ADR marker: {marker}"
    for marker in [
        '10 MiB', '30 unidades', '200 objetivos', '2000 actividades',
        '200 fuentes', '500 assets', '200 evaluaciones',
        'study`, `single_choice`, `short_answer`, `constructed_response`, `match`, `image_target`, `sequence`, `case',
        '80–100', '[1,3,7,14,30]', '1e-6',
        '360×800', '390×844', '768×1024', '1440×900', '200 %',
    ]:
        assert marker in policy, f"missing policy marker: {marker}"

    missing_logs = [check["evidence"] for check in baseline["checks"] if not (ROOT / check["evidence"]).is_file()]
    assert not missing_logs, f"missing T001 logs: {missing_logs}"
    assert len(baseline["checks"]) == 7
    assert baseline["testSummary"]["apiInitial"]["passed"] == 230
    assert baseline["testSummary"]["apiInitial"]["failed"] == 1
    assert baseline["testSummary"]["web"]["testsPassed"] == 236
    assert next(check["exitCode"] for check in baseline["checks"] if check["command"] == "pnpm.cmd --filter @cediah/api test") == 1

    result = {
        "taskId": "T002",
        "result": "PASS",
        "baseSha": head,
        "statusShort": status,
        "trackedDiff": tracked_diff,
        "handoffSha256": sha256(handoff),
        "tasksSourceSha256": sha256(tasks_source),
        "taskCount": len(plan["tasks"]),
        "dependencyGraph": "acyclic",
        "topologicalOrder": order,
        "decisionCount": len(decision_counts),
        "requirementCount": len(requirement_counts),
        "pendingInputCount": len(registry["pendingInputs"]),
        "baselineChecks": [{"command": check["command"], "exitCode": check["exitCode"], "result": check["result"], "evidence": check["evidence"]} for check in baseline["checks"]],
        "caveat": "T001 full API suite had 1/231 timeout; focused retest passed. T002 does not rerun the global baseline suites.",
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
