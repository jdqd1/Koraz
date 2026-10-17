import { CheckCircle, Info, WarningCircle, ArrowRight } from "@phosphor-icons/react";
import type { RoutePackage } from "@cediah/contracts";
import { reviewTaskV2 } from "./review-issues";
import styles from "../route-editor.module.css";
import local from "./styles.module.css";

type Issue = Parameters<typeof reviewTaskV2>[0];
export function ReviewTasksV2({ issues, pkg, onLocate }: { issues: Issue[]; pkg: RoutePackage; onLocate: (path: string) => void }) {
  const tasks = [...new Map(issues.map(issue => {
    const task = { issue, ...reviewTaskV2(issue, pkg) };
    return [JSON.stringify([issue.code, issue.severity, task.path, task.title, task.detail, task.context]), task] as const;
  })).values()];
  const groups = [...new Set(tasks.map(task => task.group))];
  const errors = tasks.filter(task => task.issue.severity === "error").length;
  const warnings = tasks.length - errors;
  if (!issues.length) return <div className={local.reviewClear} data-review-tasks><CheckCircle size={22} aria-hidden /><span>Sin pendientes en esta comprobación</span></div>;
  return <section className={local.reviewTasks} aria-label="Pendientes de la ruta" data-review-tasks>
    <div className={local.reviewTasksHeading}><h3>Por completar</h3><span>{errors ? `${errors} ${errors === 1 ? "pendiente" : "pendientes"}` : ""}{errors && warnings ? " · " : ""}{warnings ? `${warnings} ${warnings === 1 ? "sugerencia" : "sugerencias"}` : ""}</span></div>
    {groups.map((group, groupIndex) => <details key={group} className={local.reviewTaskGroup} open={groupIndex === 0}><summary><strong>{group}</strong><span>{tasks.filter(task => task.group === group).length}</span></summary><ul>
      {tasks.filter(task => task.group === group).map((task, index) => <li key={`${task.issue.code}:${task.issue.path}:${index}`} className={local.reviewTask} data-review-task={task.issue.code} data-severity={task.issue.severity}>
        {task.issue.severity === "error" ? <WarningCircle size={20} aria-hidden /> : <Info size={20} aria-hidden />}
        <div><h5>{task.title}{task.issue.severity === "warning" ? <small>Sugerencia</small> : null}</h5>{task.context ? <p className={local.reviewTaskContext}>{task.context}</p> : null}<p className={local.reviewTaskDetail}>{task.detail}</p><button className={styles.textButton} type="button" onClick={() => onLocate(task.path)}>{task.action}<ArrowRight size={15} aria-hidden /></button></div>
      </li>)}
    </ul></details>)}
  </section>;
}
