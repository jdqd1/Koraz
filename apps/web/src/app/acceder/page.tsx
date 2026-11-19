import Link from "next/link";
import { CheckCircle, Flame, Heartbeat, Sparkle, Stethoscope } from "@phosphor-icons/react/dist/ssr";
import { AuthForm } from "@/components/auth-form";
import { CediahLogo } from "@/components/cediah-logo";
import { getSafeNextPath } from "@/lib/auth/validation";

type AccessPageProps = {
  searchParams: Promise<{
    error?: string;
    mensaje?: string;
    next?: string;
    modo?: string;
  }>;
};

const callbackErrorMessages: Record<string, string> = {
  confirmacion: "El enlace de acceso no es válido o ya expiró. Solicita uno nuevo.",
  configuracion: "El acceso no está disponible en este ambiente.",
  sesion: "Tu sesión terminó. Inicia sesión de nuevo para continuar.",
};

const authMessages: Record<string, string> = {
  "sesiones-cerradas": "Cerramos todas tus sesiones. Inicia sesión para continuar.",
  "contrasena-actualizada":
    "Tu contraseña fue actualizada. Inicia sesión con la nueva contraseña.",
};

export default async function AccessPage({ searchParams }: AccessPageProps) {
  const { error, mensaje, modo, next } = await searchParams;
  const mode = modo === "registro" ? "sign-up" : "sign-in";
  const nextPath = getSafeNextPath(next);
  const toggleParameters = new URLSearchParams();
  if (mode !== "sign-up") toggleParameters.set("modo", "registro");
  if (nextPath !== "/dashboard") toggleParameters.set("next", nextPath);
  const toggleHref = `/acceder${toggleParameters.size ? `?${toggleParameters}` : ""}`;

  const signInHref = `/acceder${nextPath !== "/dashboard" ? `?next=${nextPath}` : ""}`;
  const signUpHref = `/acceder?modo=registro${nextPath !== "/dashboard" ? `&next=${nextPath}` : ""}`;

  return (
    <main className={`auth-page auth-page-paper auth-page-${mode}`}>
      <header className="auth-header">
        <Link className="brand" href="/" aria-label="Koras, inicio">
          <CediahLogo variant="dark" priority />
        </Link>
        <div className="auth-header-actions">
          <span>
            {mode === "sign-up" ? "¿Ya tienes una cuenta?" : "¿Aún no tienes una cuenta?"}
          </span>
          <Link className="auth-mode-link" href={toggleHref}>
            {mode === "sign-up" ? "Inicia sesión" : "Regístrate"}
          </Link>
        </div>
      </header>

      <div className="auth-content">
        {/* Dedicated Pure-Code Medical Showcase (Desktop) */}
        <aside className="auth-showcase" aria-label="Recursos de aprendizaje de Koras">
          <div className="auth-showcase-copy">
            <span className="auth-showcase-badge">
              <Sparkle size={12} weight="fill" />
              <span>PLATAFORMA MÉDICA INTEGRADA</span>
            </span>
            <h2>
              Domina la medicina
              <span>con claridad y confianza.</span>
            </h2>
            <p>
              Accede a guías clínicas interactivas, rutas estructuradas por materia
              y cuestionarios con justificación clínica en cada paso.
            </p>
          </div>

          <div className="auth-showcase-art" aria-hidden="true">
            {/* Visual Card 1: Active Study Path */}
            <div className="auth-visual-card card-primary">
              <div className="auth-visual-head">
                <span className="auth-visual-icon">
                  <Heartbeat size={18} weight="fill" />
                </span>
                <span className="auth-visual-tag">En curso</span>
              </div>
              <strong>Cardiología: Ciclo Cardíaco & Presiones</strong>
              <small>Lección 4 de 12 • Fisiología hemodinámica</small>
              <div className="auth-visual-progress">
                <div className="auth-visual-progress-fill" style={{ width: "78%" }} />
              </div>
              <div className="auth-visual-meta">
                <span>78% completado</span>
                <span className="auth-streak-chip">
                  <Flame size={12} weight="fill" /> 14 días de racha
                </span>
              </div>
            </div>

            {/* Visual Card 2: Interactive Clinical Case */}
            <div className="auth-visual-card card-secondary">
              <div className="auth-visual-head">
                <span className="auth-visual-icon icon-blue">
                  <Stethoscope size={18} weight="fill" />
                </span>
                <span className="auth-visual-badge-check">
                  <CheckCircle size={14} weight="fill" /> Correcto (+20 XP)
                </span>
              </div>
              <p className="auth-visual-question">
                Determinante crítico del gradiente alvéolo-capilar de O₂:
              </p>
              <div className="auth-visual-answer">
                <span>Presión parcial alveolar de oxígeno (PAO₂)</span>
              </div>
            </div>

            {/* Visual Chip: Stats */}
            <div className="auth-visual-stat-pill">
              <Sparkle size={13} weight="fill" className="text-blue-500" />
              <span>Más de 1,500 lecciones clínicas y flashcards</span>
            </div>
          </div>
        </aside>

        {/* Form Panel with Intuitive Tabs */}
        <section className="auth-form-panel" aria-label={mode === "sign-up" ? "Registro" : "Inicio de sesión"}>
          {/* Mode Switcher Tabs */}
          <div className="auth-mode-tabs" role="tablist" aria-label="Opciones de acceso">
            <Link
              className={`auth-mode-tab ${mode === "sign-in" ? "is-active" : ""}`}
              href={signInHref}
              role="tab"
              aria-selected={mode === "sign-in"}
            >
              Iniciar sesión
            </Link>
            <Link
              className={`auth-mode-tab ${mode === "sign-up" ? "is-active" : ""}`}
              href={signUpHref}
              role="tab"
              aria-selected={mode === "sign-up"}
            >
              Crear cuenta
            </Link>
          </div>

          <AuthForm
            initialMessage={
              error
                ? callbackErrorMessages[error]
                : mensaje
                  ? authMessages[mensaje]
                  : undefined
            }
            initialMessageTone={mensaje && !error ? "success" : "error"}
            mode={mode}
            nextPath={nextPath}
          />
        </section>
      </div>
    </main>
  );
}
