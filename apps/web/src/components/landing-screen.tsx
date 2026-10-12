"use client";

import Link from "next/link";
import { useState, type MouseEvent } from "react";
import {
  ArrowRight,
  Check,
  ClipboardText,
  ClockCountdown,
  BookOpen,
  Crown,
  ImagesSquare,
  InstagramLogo,
  Lightning,
  List,
  Sparkle,
  X,
} from "@phosphor-icons/react";
import { BrandPlatformPreview } from "./brand-platform-preview";
import { LandingOrbits } from "./landing-orbits";
import styles from "./landing-orbit.module.css";

const featureItems = [
  { title: "Materias médicas", icon: BookOpen },
  { title: "Guías de estudio", icon: BookOpen },
  { title: "Flashcards", icon: ImagesSquare },
  { title: "Cuestionarios", icon: ClipboardText },
  { title: "Seguimiento", icon: ClockCountdown },
] as const;

const planFeatures = [
  "Materias esenciales",
  "Guías de estudio",
  "Cuestionarios",
  "Seguimiento de progreso",
  "Acceso a todas las materias",
  "Flashcards ilimitadas",
  "Casos clínicos exclusivos",
  "Soporte prioritario",
] as const;

const plans = [
  {
    name: "Básico",
    slug: "basico",
    icon: Sparkle,
    monthlyPrice: 4.99,
    annualPrice: 47.9,
    includedFeatures: 4,
    popular: false,
  },
  {
    name: "Pro",
    slug: "pro",
    icon: Lightning,
    monthlyPrice: 8.99,
    annualPrice: 86.3,
    includedFeatures: 6,
    popular: true,
  },
  {
    name: "Premium",
    slug: "premium",
    icon: Crown,
    monthlyPrice: 12.99,
    annualPrice: 124.7,
    includedFeatures: planFeatures.length,
    popular: false,
  },
] as const;

const footerGroups = [
  { title: "Empresa", links: ["Sobre nosotros", "Términos", "Privacidad", "Contacto"] },
  { title: "¿Necesitas ayuda?", links: ["Soporte", "Centro de ayuda", "Preguntas frecuentes"] },
] as const;

const accessHref = "/acceder";
const registerHref = "/acceder?modo=registro";

export function LandingScreen() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");

  const scrollToPlans = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("planes")?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  return (
    <main className={`marketing-page marketing-page-orbit ${styles.page}`}>
      <section className="marketing-hero" aria-labelledby="marketing-title">
        <header className="marketing-header">
          <Link className="marketing-brand" href="/" aria-label="Koraz, inicio">
            <span className={styles.brandMark} aria-hidden="true"><i /><i /><i /><i /></span>
            <span>KORAZ</span>
          </Link>

          <nav className="marketing-navigation" id="marketing-navigation" aria-label="Navegación principal">
            <details className={styles.mobileMenu}>
              <summary aria-label="Abrir navegación"><List size={21} aria-hidden="true" /></summary>
              <div>
                <Link href="/aprendizaje">Rutas</Link>
                <Link href="/asignaturas">Materias</Link>
                <a href="#recursos" onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")}>Recursos</a>
                <a href="#planes" onClick={(event) => { scrollToPlans(event); event.currentTarget.closest("details")?.removeAttribute("open"); }}>Planes</a>
              </div>
            </details>
            <div className="marketing-nav-links">
              <a href="#marketing-title" aria-current="page">Inicio</a>
              <Link href="/aprendizaje">Rutas</Link>
              <Link href="/asignaturas">Materias</Link>
              <a href="#recursos">Recursos</a>
              <a className="marketing-plans-link" href="#planes" onClick={scrollToPlans}>Planes</a>
            </div>
            <div className="marketing-nav-actions">
              <Link className="marketing-login" href={accessHref}>Iniciar sesión</Link>
              <Link className="marketing-register" href={registerHref}>Comenzar</Link>
            </div>
          </nav>
        </header>

        <div className={styles.heroStage}>
          <LandingOrbits />
          <div className="marketing-hero-inner">
            <div className="marketing-hero-copy">
              <h1 id="marketing-title">
                <span>Aprende medicina</span>
                <span>con <em>claridad.</em></span>
              </h1>
              <p>Una plataforma para estudiar, comprender<br className={styles.desktopBreak} /> y avanzar en tu camino en medicina.</p>
              <div className="marketing-hero-actions">
                <Link className="marketing-primary-button" href={registerHref}>
                  Comenzar ahora <ArrowRight aria-hidden="true" size={20} weight="bold" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="marketing-features" id="recursos" aria-label="Recursos de la plataforma">
        {featureItems.map(({ title, icon: Icon }) => (
          <div className="marketing-feature" key={title}>
            <Icon aria-hidden="true" size={35} weight="thin" />
            <strong>{title}</strong>
          </div>
        ))}
      </section>

      <section className="marketing-platform" id="plataforma" aria-labelledby="platform-title">
        <div className="marketing-platform-inner">
          <div className="marketing-platform-copy">
            <span className={styles.eyebrow}>TU ESPACIO DE ESTUDIO</span>
            <h2 id="platform-title">Estudia desde cualquier lugar y dispositivo</h2>
            <p>Tus guías, cuestionarios y rutas te acompañan estés donde estés.</p>
            <Link className={styles.textLink} href={registerHref}>Descubre tu próxima ruta <ArrowRight size={18} aria-hidden="true" /></Link>
          </div>
          <div className="marketing-devices">
            <BrandPlatformPreview />
          </div>
        </div>
      </section>

      <section className="marketing-pricing" id="planes" aria-labelledby="plans-title">
        <div className="marketing-pricing-heading">
          <span className={styles.eyebrow}>APRENDE A TU RITMO</span>
          <h2 id="plans-title">Un plan para cada etapa de tu camino</h2>
          <p>Compara beneficios y regístrate</p>
          <div className="marketing-billing-switch" role="group" aria-label="Frecuencia de facturación">
            <button
              className={billingCycle === "monthly" ? "is-active" : ""}
              type="button"
              aria-pressed={billingCycle === "monthly"}
              onClick={() => setBillingCycle("monthly")}
            >
              Mensual
            </button>
            <button
              className={billingCycle === "yearly" ? "is-active" : ""}
              type="button"
              aria-pressed={billingCycle === "yearly"}
              onClick={() => setBillingCycle("yearly")}
            >
              Anual <span>-20%</span>
            </button>
          </div>
        </div>
        <div className="marketing-plan-grid">
          {plans.map((plan, planIndex) => {
            const PlanIcon = plan.icon;
            const annualMonthlyPrice = plan.annualPrice / 12;
            const annualSavings = plan.monthlyPrice * 12 - plan.annualPrice;
            const displayedPrice = billingCycle === "yearly" ? annualMonthlyPrice : plan.monthlyPrice;

            return (
              <article
                className={`marketing-plan-card marketing-plan-tier-${planIndex + 1} ${plan.popular ? "is-popular" : ""}`}
                key={plan.name}
              >
                {plan.popular ? (
                  <span className="marketing-popular-badge"><Lightning aria-hidden="true" size={11} weight="fill" /> MÁS ELEGIDO</span>
                ) : null}
                <div className="marketing-plan-heading">
                  <span className="marketing-plan-icon"><PlanIcon aria-hidden="true" size={21} weight="fill" /></span>
                  <h3>{plan.name}</h3>
                </div>
                <div className="marketing-price" aria-live="polite">
                  <strong>${displayedPrice.toFixed(2)}</strong><span>/mes</span>
                  {billingCycle === "monthly" ? (
                    <small className="marketing-annual-comparison">
                      Con anual <b>${annualMonthlyPrice.toFixed(2)}/mes</b>
                    </small>
                  ) : null}
                </div>
                {billingCycle === "yearly" ? (
                  <div className="marketing-billing-detail">
                    <span>Pago único de <strong>${plan.annualPrice.toFixed(2)}</strong> al año</span>
                    <b><Sparkle aria-hidden="true" size={12} weight="fill" /> Ahorras ${annualSavings.toFixed(2)}</b>
                  </div>
                ) : null}
                <ul>
                  {planFeatures.map((feature, featureIndex) => {
                    const included = featureIndex < plan.includedFeatures;

                    return (
                      <li
                        className={included ? "is-included" : "is-excluded"}
                        key={feature}
                        aria-label={`${feature}: ${included ? "incluido" : "no incluido"}`}
                      >
                        {included ? (
                          <Check aria-hidden="true" size={12} weight="bold" />
                        ) : (
                          <X aria-hidden="true" size={12} weight="bold" />
                        )}
                        {feature}
                      </li>
                    );
                  })}
                </ul>
                <Link href={`${registerHref}&plan=${plan.slug}&facturacion=${billingCycle === "yearly" ? "anual" : "mensual"}`}>
                  Elegir {plan.name} <ArrowRight aria-hidden="true" size={13} weight="bold" />
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      <footer className="marketing-footer" id="instituciones">
        <div className="marketing-footer-inner">
          <div className="marketing-footer-brand">
            <Link className="marketing-brand" href="/" aria-label="Koraz, inicio"><span className={styles.brandMark} aria-hidden="true"><i /><i /><i /><i /></span><span>KORAZ</span></Link>
            <p>Aprendizaje que conecta,<br />conocimiento que se queda.</p>
            <div className="marketing-socials" aria-label="Redes sociales" role="group">
              <a href="#instagram" aria-label="Instagram"><InstagramLogo size={16} /></a>
            </div>
          </div>
          <div className="marketing-footer-groups">
            {footerGroups.map((group) => (
              <div className="marketing-footer-group" key={group.title}>
                <strong>{group.title}</strong>
                {group.links.map((label) => <a href="#plataforma" key={label}>{label}</a>)}
              </div>
            ))}
          </div>
          <p className="marketing-copyright">© 2026 Koraz. Todos los derechos reservados.</p>
        </div>
      </footer>
    </main>
  );
}
