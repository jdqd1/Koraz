"use client";

import {
  ArrowRight,
  BookOpen,
  Brain,
  CaretRight,
  CheckCircle,
  Flame,
  Heartbeat,
  MagnifyingGlass,
  Sparkle,
  Stethoscope,
} from "@phosphor-icons/react";

type BrandPlatformPreviewProps = {
  className?: string;
};

export function BrandPlatformPreview({ className = "" }: BrandPlatformPreviewProps) {
  return (
    <div className={`brand-platform-preview modern-preview ${className}`.trim()} aria-hidden="true">
      {/* Desktop Application Window Mockup */}
      <div className="brand-preview-window">
        {/* Window Chrome / Title Bar */}
        <div className="brand-preview-window-bar">
          <div className="brand-preview-window-dots">
            <span className="dot-close" />
            <span className="dot-minimize" />
            <span className="dot-expand" />
          </div>
          <div className="brand-preview-window-address">
            <span className="address-lock">🔒</span>
            <span className="address-url">koras.app/estudio/cardiologia</span>
          </div>
          <div className="brand-preview-window-actions">
            <span className="window-action-chip">
              <Flame size={12} weight="fill" className="text-amber-500" />
              <span>14 días</span>
            </span>
          </div>
        </div>

        <div className="brand-preview-body">
          {/* App Sidebar */}
          <div className="brand-preview-sidebar">
            <div className="brand-preview-sidebar-brand">
              <svg viewBox="0 0 1254 1254" className="sidebar-logo-mark" fill="none">
                <rect x="290" y="210" width="245" height="820" rx="122.5" fill="#0B1F3D" />
                <path
                  d="M 805,210 L 865,210 L 925,240 L 967,315 L 970,345 L 961,390 L 919,447 L 859,477 L 784,483 L 709,507 L 646,594 L 643,624 L 661,684 L 712,738 L 787,759 L 862,762 L 937,807 L 970,882 L 964,942 L 922,1002 L 862,1035 L 802,1035 L 742,1008 L 685,921 L 652,801 L 595,750 L 505,699 L 466,612 L 484,567 L 556,516 L 646,453 L 691,378 L 709,288 L 760,231 Z"
                  fill="#0A8EFE"
                />
              </svg>
              <strong>KORAS</strong>
            </div>

            <nav className="brand-preview-sidebar-nav">
              <span className="preview-nav-item is-active">
                <Heartbeat size={15} weight="fill" />
                <span>Cardiología</span>
              </span>
              <span className="preview-nav-item">
                <Brain size={15} weight="regular" />
                <span>Neurología</span>
              </span>
              <span className="preview-nav-item">
                <BookOpen size={15} weight="regular" />
                <span>Guías clínicas</span>
              </span>
              <span className="preview-nav-item">
                <Stethoscope size={15} weight="regular" />
                <span>Casos prácticos</span>
              </span>
            </nav>

            <div className="brand-preview-sidebar-footer">
              <div className="preview-user-avatar">
                <span>MD</span>
              </div>
              <div className="preview-user-meta">
                <small>Estudiante</small>
                <strong>Medicina Interna</strong>
              </div>
            </div>
          </div>

          {/* App Workspace / Content */}
          <div className="brand-preview-content">
            <div className="brand-preview-toolbar">
              <div className="brand-preview-search-mock">
                <MagnifyingGlass size={13} />
                <span>Buscar término, arteria, fármaco...</span>
                <kbd>⌘K</kbd>
              </div>
              <div className="brand-preview-pill-badge">
                <Sparkle size={12} weight="fill" />
                <span>Ruta en progreso</span>
              </div>
            </div>

            {/* Main Learning Card */}
            <div className="brand-preview-hero-card">
              <div className="hero-card-meta">
                <span className="hero-card-tag">Lección 4 de 12</span>
                <h4>Ciclo Cardíaco & Presiones Cavitarias</h4>
                <p>Análisis de sístole, diástole y curvas de presión ventricular.</p>
              </div>
              <div className="hero-card-progress-bar">
                <div className="hero-card-progress-fill" style={{ width: "74%" }} />
              </div>
              <div className="hero-card-stats">
                <span>74% completado</span>
                <span className="continue-action">
                  Continuar <ArrowRight size={12} weight="bold" />
                </span>
              </div>
            </div>

            {/* Interactive Grid Items */}
            <div className="brand-preview-cards">
              <div className="preview-card-item">
                <div className="preview-card-item-head">
                  <span className="preview-card-icon card-icon-red">
                    <Heartbeat size={16} weight="fill" />
                  </span>
                  <span className="preview-card-badge">Cuestionario</span>
                </div>
                <strong>Presión de fin de diástole</strong>
                <small>15 preguntas clínicas</small>
                <div className="preview-card-result">
                  <CheckCircle size={13} weight="fill" className="text-emerald-500" />
                  <span>96% de precisión</span>
                </div>
              </div>

              <div className="preview-card-item">
                <div className="preview-card-item-head">
                  <span className="preview-card-icon card-icon-blue">
                    <Brain size={16} weight="fill" />
                  </span>
                  <span className="preview-card-badge">Flashcards</span>
                </div>
                <strong>Inervación autónoma cardíaca</strong>
                <small>28 tarjetas activas</small>
                <div className="preview-card-result">
                  <Sparkle size={13} weight="fill" className="text-blue-500" />
                  <span>Repaso al día</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Smartphone Mockup */}
      <div className="brand-preview-phone">
        {/* Dynamic Island / Speaker */}
        <div className="phone-island">
          <span className="phone-island-camera" />
        </div>

        {/* Mobile Header Bar */}
        <div className="phone-status-bar">
          <span>9:41</span>
          <div className="phone-status-icons">
            <span className="phone-bar-icon" />
            <span className="phone-wifi-icon" />
            <span className="phone-battery-icon" />
          </div>
        </div>

        {/* Mobile App Canvas */}
        <div className="phone-canvas">
          <div className="phone-top-brand">
            <svg viewBox="0 0 1254 1254" className="phone-logo-mark" fill="none">
              <rect x="290" y="210" width="245" height="820" rx="122.5" fill="#FFFFFF" />
              <path
                d="M 805,210 L 865,210 L 925,240 L 967,315 L 970,345 L 961,390 L 919,447 L 859,477 L 784,483 L 709,507 L 646,594 L 643,624 L 661,684 L 712,738 L 787,759 L 862,762 L 937,807 L 970,882 L 964,942 L 922,1002 L 862,1035 L 802,1035 L 742,1008 L 685,921 L 652,801 L 595,750 L 505,699 L 466,612 L 484,567 L 556,516 L 646,453 L 691,378 L 709,288 L 760,231 Z"
                fill="#38BDF8"
              />
            </svg>
            <span>KORAS MOBILE</span>
          </div>

          <div className="phone-quiz-card">
            <span className="phone-quiz-tag">Caso clínico interactivo</span>
            <p className="phone-quiz-question">
              ¿Qué fase del potencial de acción cardíaco corresponde a la meseta miocárdica?
            </p>
            <div className="phone-quiz-options">
              <div className="phone-quiz-option">Fase 0: Despolarización</div>
              <div className="phone-quiz-option is-correct">
                <span>Fase 2: Entrada de Ca²⁺</span>
                <CheckCircle size={14} weight="fill" />
              </div>
              <div className="phone-quiz-option">Fase 3: Repolarización rápida</div>
            </div>
            <div className="phone-action-btn">
              <span>Continuar caso</span>
              <CaretRight size={13} weight="bold" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
