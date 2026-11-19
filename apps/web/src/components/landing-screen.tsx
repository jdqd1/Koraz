"use client";

import Link from "next/link";
import { useState, type MouseEvent } from "react";
import {
  ArrowRight,
  BookOpen,
  Brain,
  Check,
  Crown,
  DeviceMobile,
  GraduationCap,
  InstagramLogo,
  Lightning,
  List,
  Sparkle,
  Stethoscope,
  X,
} from "@phosphor-icons/react";
import { BrandPlatformPreview } from "./brand-platform-preview";
import { CediahLogo } from "./cediah-logo";
import { LandingOrbits } from "./landing-orbits";
import styles from "./landing-orbit.module.css";

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

const trustMetrics = [
  { icon: GraduationCap, label: "+15 Materias clínicas", desc: "Desde básicas hasta internado" },
  { icon: BookOpen, label: "Guías con términos activos", desc: "Definiciones anatómicas al instante" },
  { icon: Brain, label: "Repaso activo espaciado", desc: "Algoritmo de retención a largo plazo" },
  { icon: DeviceMobile, label: "100% Móvil y escritorio", desc: "Estudia donde y cuando quieras" },
] as const;

const corePillars = [
  {
    icon: Stethoscope,
    tag: "Ciencias Clínicas",
    title: "Rutas de aprendizaje paso a paso",
    description: "Avanza con un plan de estudio estructurado desde las bases fisiológicas hasta el diagnóstico y manejo clínico.",
  },
  {
    icon: BookOpen,
    tag: "Lectura Inteligente",
    title: "Términos médicos interactivos",
    description: "Toca cualquier término médico, arteria o fármaco dentro de las guías para desplegar su concepto clave sin perder tu ritmo.",
  },
  {
    icon: Brain,
    tag: "Memorización Activa",
    title: "Cuestionarios y flashcards integradas",
    description: "Pon a prueba tu razonamiento con casos clínicos reales y preguntas de opción múltiple con retroalimentación instantánea.",
  },
] as const;

const footerGroups = [
  { title: "Plataforma", links: ["Rutas", "Materias", "Guías de estudio", "Cuestionarios"] },
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
          <Link className="marketing-brand" href="/" aria-label="Koras, inicio">
            <CediahLogo variant="dark" priority sizes="36px" />
          </Link>

          <nav className="marketing-navigation" id="marketing-navigation" aria-label="Navegación principal">
            <details className={styles.mobileMenu}>
              <summary aria-label="Abrir navegación"><List size={22} weight="bold" aria-hidden="true" /></summary>
              <div className={styles.mobileDropdown}>
                <Link href="/aprendizaje">Rutas</Link>
                <Link href="/asignaturas">Materias</Link>
                <a href="#plataforma" onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")}>Recursos</a>
                <a href="#planes" onClick={(event) => { scrollToPlans(event); event.currentTarget.closest("details")?.removeAttribute("open"); }}>Planes</a>
                <div className={styles.mobileDropdownActions}>
                  <Link className={styles.mobileLoginLink} href={accessHref}>Iniciar sesión</Link>
                  <Link className={styles.mobileRegisterLink} href={registerHref}>Comenzar ahora</Link>
                </div>
              </div>
            </details>
            <div className="marketing-nav-links">
              <a href="#marketing-title" aria-current="page">Inicio</a>
              <Link href="/aprendizaje">Rutas</Link>
              <Link href="/asignaturas">Materias</Link>
              <a href="#plataforma">Recursos</a>
              <a className="marketing-plans-link" href="#planes" onClick={scrollToPlans}>Planes</a>
            </div>
            <div className="marketing-nav-actions">
              <Link className="marketing-login" href={accessHref}>Iniciar sesión</Link>
              <Link className={styles.navCtaButton} href={registerHref}>
                <span>Comenzar gratis</span>
                <ArrowRight size={14} weight="bold" />
              </Link>
            </div>
          </nav>
        </header>

        <div className={styles.heroStage}>
          <LandingOrbits />
          <div className="marketing-hero-inner">
            <div className="marketing-hero-copy">
              <div className={styles.heroBadge}>
                <span className={styles.heroBadgeGlow} />
                <Sparkle size={13} weight="fill" className={styles.badgeIcon} />
                <span>PLATAFORMA MÉDICA DE ALTO RENDIMIENTO</span>
              </div>
              <h1 id="marketing-title">
                <span>Aprende medicina</span>
                <span>con <em>claridad absoluta.</em></span>
              </h1>
              <p>
                Rutas estructuradas por materia, guías clínicas interactivas y
                cuestionarios diseñados para dominar cada concepto médico.
              </p>
              <div className="marketing-hero-actions">
                <Link className="marketing-primary-button" href={registerHref}>
                  <span>Comenzar ahora</span>
                  <ArrowRight aria-hidden="true" size={18} weight="bold" />
                </Link>
                <Link className={styles.heroSecondaryButton} href="/asignaturas">
                  <span>Ver materias</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Trust Metrics Bar */}
        <div className={styles.metricsBar}>
          <div className={styles.metricsBarInner}>
            {trustMetrics.map((metric) => {
              const MetricIcon = metric.icon;
              return (
                <div className={styles.metricItem} key={metric.label}>
                  <span className={styles.metricIconWrap}>
                    <MetricIcon size={20} weight="fill" />
                  </span>
                  <div className={styles.metricText}>
                    <strong>{metric.label}</strong>
                    <small>{metric.desc}</small>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Core Educational Pillars Section */}
      <section className={styles.pillarsSection} aria-labelledby="pillars-heading">
        <div className={styles.sectionHeader}>
          <span className={styles.eyebrow}>DISEÑADO PARA RETENER</span>
          <h2 id="pillars-heading">El método más eficiente para estudiar medicina</h2>
          <p>Olvídate de memorizar sin contexto. Koras conecta cada concepto para que perdure.</p>
        </div>
        <div className={styles.pillarsGrid}>
          {corePillars.map((pillar) => {
            const PillarIcon = pillar.icon;
            return (
              <article className={styles.pillarCard} key={pillar.title}>
                <div className={styles.pillarHead}>
                  <span className={styles.pillarIcon}>
                    <PillarIcon size={22} weight="fill" />
                  </span>
                  <span className={styles.pillarTag}>{pillar.tag}</span>
                </div>
                <h3>{pillar.title}</h3>
                <p>{pillar.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* Platform & Mobile Preview Showcase */}
      <section className="marketing-platform" id="plataforma" aria-labelledby="platform-title">
        <div className="marketing-platform-inner">
          <div className="marketing-platform-copy">
            <span className={styles.eyebrow}>EXPERIENCIA MULTIPLATAFORMA</span>
            <h2 id="platform-title">Estudia desde cualquier lugar y en cualquier dispositivo</h2>
            <p>
              Tu progreso, guías clínicas y cuestionarios se sincronizan al segundo.
              Continúa en tu móvil exactamente donde lo dejaste en el escritorio.
            </p>
            <div className={styles.platformFeatureList}>
              <div className={styles.platformFeatureItem}>
                <Check size={16} weight="bold" />
                <span>Diseño ligero y ultra-optimizado para móviles</span>
              </div>
              <div className={styles.platformFeatureItem}>
                <Check size={16} weight="bold" />
                <span>Cuestionarios interactivos con justificación clínica</span>
              </div>
              <div className={styles.platformFeatureItem}>
                <Check size={16} weight="bold" />
                <span>Términos médicos con acceso instantáneo</span>
              </div>
            </div>
            <Link className={styles.textLink} href={registerHref}>
              <span>Descubre tu próxima ruta</span>
              <ArrowRight size={17} weight="bold" aria-hidden="true" />
            </Link>
          </div>
          <div className="marketing-devices">
            <BrandPlatformPreview />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="marketing-pricing" id="planes" aria-labelledby="plans-title">
        <div className="marketing-pricing-heading">
          <span className={styles.eyebrow}>INVERSIÓN EN TU FUTURO</span>
          <h2 id="plans-title">Un plan para cada etapa de tu carrera</h2>
          <p>Sin permanencia. Cancela o actualiza tu plan en cualquier momento.</p>
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
              Anual <span>Ahorra 20%</span>
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
                  <span className="marketing-popular-badge">
                    <Lightning aria-hidden="true" size={12} weight="fill" /> MÁS ELEGIDO
                  </span>
                ) : null}
                <div className="marketing-plan-heading">
                  <span className="marketing-plan-icon">
                    <PlanIcon aria-hidden="true" size={20} weight="fill" />
                  </span>
                  <div>
                    <h3>{plan.name}</h3>
                    <small className={styles.planSub}>{planIndex === 1 ? "Ideal para estudiantes regulares" : planIndex === 2 ? "Preparación para el internado" : "Para comenzar"}</small>
                  </div>
                </div>

                <div className="marketing-price" aria-live="polite">
                  <strong>${displayedPrice.toFixed(2)}</strong>
                  <span>/mes</span>
                  {billingCycle === "monthly" ? (
                    <small className="marketing-annual-comparison">
                      Con plan anual: <b>${annualMonthlyPrice.toFixed(2)}/mes</b>
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
                          <span className={styles.featureCheckIcon}>
                            <Check aria-hidden="true" size={12} weight="bold" />
                          </span>
                        ) : (
                          <span className={styles.featureCrossIcon}>
                            <X aria-hidden="true" size={12} weight="bold" />
                          </span>
                        )}
                        <span>{feature}</span>
                      </li>
                    );
                  })}
                </ul>

                <Link
                  className={styles.planButton}
                  href={`${registerHref}&plan=${plan.slug}&facturacion=${billingCycle === "yearly" ? "anual" : "mensual"}`}
                >
                  <span>Elegir {plan.name}</span>
                  <ArrowRight aria-hidden="true" size={14} weight="bold" />
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      {/* Modern High-End Footer */}
      <footer className="marketing-footer" id="instituciones">
        <div className="marketing-footer-inner">
          <div className="marketing-footer-brand">
            <Link className="marketing-brand" href="/" aria-label="Koras, inicio">
              <CediahLogo variant="dark" sizes="36px" />
            </Link>
            <p>
              Educación médica de precisión.<br />
              Diseñada para conectar conocimiento y potenciar el éxito clínico.
            </p>
            <div className={styles.statusIndicator}>
              <span className={styles.statusDot} />
              <span>Plataforma 100% operativa</span>
            </div>
            <div className="marketing-socials" aria-label="Redes sociales" role="group">
              <a href="#instagram" aria-label="Instagram"><InstagramLogo size={18} weight="bold" /></a>
            </div>
          </div>
          <div className="marketing-footer-groups">
            {footerGroups.map((group) => (
              <div className="marketing-footer-group" key={group.title}>
                <strong>{group.title}</strong>
                {group.links.map((label) => (
                  <a href="#plataforma" key={label}>{label}</a>
                ))}
              </div>
            ))}
          </div>
          <div className="marketing-copyright">
            <p>© 2026 Koras. Todos los derechos reservados.</p>
            <span className={styles.copyrightTag}>Plataforma Médica Educativa</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
