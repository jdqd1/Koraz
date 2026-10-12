"use client";

import { useEffect, useRef, type CSSProperties, type PointerEvent } from "react";
import Link from "next/link";
import { Atom, Heartbeat, Microscope, Pill, Dna, Virus, Pulse, ShieldCheck } from "@phosphor-icons/react";
import styles from "./landing-orbit.module.css";

// Eight evenly spaced anchors keep the inner orbit populated through a full revolution.
// Arrival delays and momentum stay irregular and deterministic for SSR/hydration.
const subjects = [
  { name: "Anatomía", icon: Heartbeat, color: "#ff8e95", ink: "#76212f", ring: 0, phase: 0, delay: 180, x: -54, y: -32, rotation: -18 },
  { name: "Fisiología", icon: Pulse, color: "#80b5ff", ink: "#154fa9", ring: 0, phase: 12.5, delay: 620, x: 36, y: -62, rotation: 14 },
  { name: "Histología", icon: Microscope, color: "#ffa2cd", ink: "#792e57", ring: 0, phase: 25, delay: 940, x: -38, y: 48, rotation: 12 },
  { name: "Microbiología", icon: Virus, color: "#5edbdc", ink: "#086768", ring: 0, phase: 37.5, delay: 340, x: 56, y: 26, rotation: -12 },
  { name: "Biología celular", icon: Atom, color: "#71dba4", ink: "#1b6944", ring: 0, phase: 50, delay: 760, x: -72, y: 15, rotation: 16 },
  { name: "Farmacología", icon: Pill, color: "#ffab72", ink: "#8b3b13", ring: 0, phase: 62.5, delay: 90, x: 62, y: -20, rotation: -20 },
  { name: "Bioquímica", icon: Dna, color: "#ffd36b", ink: "#775700", ring: 0, phase: 75, delay: 470, x: -44, y: 64, rotation: -10 },
  { name: "Inmunología", icon: ShieldCheck, color: "#b99aff", ink: "#542c96", ring: 0, phase: 87.5, delay: 1100, x: 48, y: 42, rotation: 18 },
  { name: "Embriología", icon: Dna, color: "#ffb3a0", ink: "#8c4330", ring: 1, phase: 93, delay: 820, x: 34, y: 50, rotation: -15 },
  { name: "Patología", icon: Microscope, color: "#98c8ff", ink: "#244e85", ring: 1, phase: 43, delay: 260, x: -42, y: -40, rotation: 10 },
  { name: "Genética", icon: Dna, color: "#a8b1ff", ink: "#444c91", ring: 2, phase: 7, delay: 530, x: 40, y: -32, rotation: 17 },
  { name: "Parasitología", icon: Virus, color: "#9edbac", ink: "#356541", ring: 2, phase: 57, delay: 1050, x: -35, y: 45, rotation: -11 },
] as const;

function SubjectCard({ subject }: { subject: (typeof subjects)[number] }) {
  const bounds = useRef<DOMRect | null>(null);
  const Icon = subject.icon;

  function tilt(event: PointerEvent<HTMLAnchorElement>) {
    if (event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = bounds.current;
    if (!rect) return;
    const x = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
    const y = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
    event.currentTarget.style.setProperty("--tilt-x", `${-y * 9}deg`);
    event.currentTarget.style.setProperty("--tilt-y", `${x * 12}deg`);
    event.currentTarget.style.setProperty("--tilt-z", `${x * 3}deg`);
  }

  return (
    <div className={styles.traveller} style={{
      "--phase": `${subject.phase}%`, "--mobile-phase": `${subject.phase}%`,
      "--arrival-delay": `${subject.delay}ms`,
      "--arrival-x": `${subject.x}px`, "--arrival-y": `${subject.y}px`,
      "--arrival-rotation": `${subject.rotation}deg`, "--subject-color": subject.color,
      "--subject-ink": subject.ink,
    } as CSSProperties}>
      <div className={styles.arrival}>
        <Link className={styles.subjectCard} href="/asignaturas" prefetch={false} aria-label={`Explorar materias: ${subject.name}`}
          onPointerEnter={(event) => { bounds.current = event.currentTarget.getBoundingClientRect(); }}
          onPointerMove={tilt}
          onPointerLeave={(event) => {
            bounds.current = null;
            ["--tilt-x", "--tilt-y", "--tilt-z"].forEach((property) => event.currentTarget.style.removeProperty(property));
          }}>
          <span className={styles.subjectIcon}><Icon size={26} weight="regular" aria-hidden="true" /></span>
          <span className={styles.subjectLabel}>{subject.name}</span>
        </Link>
      </div>
    </div>
  );
}

export function LandingOrbits() {
  const field = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = field.current;
    if (!element) return;
    let inView = true;
    const update = () => { element.dataset.motionPaused = String(document.hidden || !inView); };
    const observer = new IntersectionObserver(([entry]) => { inView = entry?.isIntersecting ?? false; update(); });
    observer.observe(element);
    document.addEventListener("visibilitychange", update);
    update();
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", update); };
  }, []);

  return (
    <div className={styles.orbitField} ref={field} aria-label="Materias para explorar">
      {[0, 1, 2].map((ring) => (
        <div className={`${styles.orbitTrack} ${styles[`ring${ring}`]}`} key={ring} data-orbit={ring}>
          <span className={styles.orbitLine} aria-hidden="true" />
          {subjects.filter((subject) => subject.ring === ring).map((subject) => <SubjectCard subject={subject} key={subject.name} />)}
          {[13, 28, 36, 62, 79, 88].map((phase, index) => (
            <span key={phase} className={`${styles.traveller} ${styles.orbitDot}`} aria-hidden="true"
              style={{ "--phase": `${phase + ring * 3}%`, "--mobile-phase": `${phase + ring * 3}%`, "--dot-size": `${index % 3 === 0 ? 7 : 4}px` } as CSSProperties} />
          ))}
        </div>
      ))}
    </div>
  );
}
