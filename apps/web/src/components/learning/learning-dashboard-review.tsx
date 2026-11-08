import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, Check, ClockCounterClockwise } from "@phosphor-icons/react/dist/ssr";
import type { LearningHome } from "@cediah/contracts";

export function LearningDashboardReview({
  available,
  enabled,
  home,
}: {
  available: boolean;
  enabled: boolean;
  home: LearningHome | null;
}) {
  if (!enabled) return null;

  const dueReviews = available && home ? home.counts.dueReviews : null;
  const reviewTone = dueReviews === null ? "calm" : dueReviews === 0
    ? "complete"
    : dueReviews <= 5 ? "calm" : dueReviews <= 12 ? "active" : dueReviews <= 20 ? "attention" : "urgent";
  const reviewAngle = dueReviews === null ? 0 : dueReviews === 0
    ? 360
    : Math.max(36, Math.min(dueReviews, 20) / 20 * 360);
  const reviewRingStyle = {
    "--dashboard-review-angle": `${reviewAngle}deg`,
  } as CSSProperties;

  return (
    <section aria-labelledby="dashboard-review-title" className="dashboard-review-section">
      <div className="section-heading-row">
        <h2 id="dashboard-review-title">Repaso</h2>
      </div>
      <article className="dashboard-review-card" data-tone={reviewTone}>
        <header className="dashboard-review-heading">
          <span className="dashboard-review-icon"><ClockCounterClockwise aria-hidden="true" size={24} /></span>
          <span className="dashboard-review-copy">
            <strong>Preguntas y tarjetas</strong>
            <span>{dueReviews === null
              ? "Consulta el centro de repaso para confirmar tus pendientes."
              : dueReviews === 0
                ? "Sin ítems pendientes aquí. Consulta también tus rutas por objetivos."
                : `${dueReviews} ${dueReviews === 1 ? "ítem pendiente" : "ítems pendientes"}`}</span>
          </span>
          {dueReviews !== null && (
            <div
              aria-label={dueReviews === 0 ? "No hay repasos pendientes" : `${dueReviews} repasos pendientes`}
              className="dashboard-review-ring"
              role="img"
              style={reviewRingStyle}
            >
              <span aria-hidden="true">
                {dueReviews === 0 ? <Check size={24} weight="bold" /> : <><strong>{dueReviews}</strong><small>pendientes</small></>}
              </span>
            </div>
          )}
        </header>
        <Link className="dashboard-review-button" href="/aprendizaje/repaso">
          Ver repasos pendientes <ArrowRight aria-hidden="true" size={19} />
        </Link>
      </article>
    </section>
  );
}
