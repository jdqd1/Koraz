"use client";

import { useEffect, useRef, type CSSProperties, type PointerEvent } from "react";
import { Atom, Heartbeat, Microscope, Pill, Dna, Virus, Pulse, ShieldCheck, Brain, Stethoscope } from "@phosphor-icons/react";
import styles from "./landing-orbit.module.css";

const subjectGroups = [
  [
    { name: "Anatomía", icon: Heartbeat, color: "#f43f5e", ink: "#881337" },
    { name: "Fisiología", icon: Pulse, color: "#3b82f6", ink: "#1e3a8a" },
    { name: "Histología", icon: Microscope, color: "#ec4899", ink: "#831843" },
    { name: "Biología celular", icon: Atom, color: "#10b981", ink: "#064e3b" },
    { name: "Bioquímica", icon: Dna, color: "#f59e0b", ink: "#78350f" },
    { name: "Embriología", icon: Dna, color: "#f97316", ink: "#7c2d12" },
  ],
  [
    { name: "Farmacología", icon: Pill, color: "#06b6d4", ink: "#164e63" },
    { name: "Microbiología", icon: Virus, color: "#14b8a6", ink: "#134e4a" },
    { name: "Inmunología", icon: ShieldCheck, color: "#8b5cf6", ink: "#4c1d95" },
    { name: "Genética", icon: Dna, color: "#6366f1", ink: "#312e81" },
  ],
  [
    { name: "Semiología", icon: Stethoscope, color: "#2563eb", ink: "#1e3a8a" },
    { name: "Patología", icon: Microscope, color: "#d946ef", ink: "#701a75" },
    { name: "Neuroanatomía", icon: Brain, color: "#7c3aed", ink: "#4c1d95" },
    { name: "Parasitología", icon: Virus, color: "#059669", ink: "#064e3b" },
  ],
] as const;

type Subject = (typeof subjectGroups)[number][number];
type OrbitHover = (ring: number, hovered: boolean) => void;

function createOrbitMotion(track: HTMLElement) {
  let rate = 1;
  let target = 1;
  let frame = 0;
  let animations: Animation[] = [];

  function writeRate(value: number) {
    rate = value;
    animations.forEach((animation) => animation.updatePlaybackRate(value));
  }

  function sync() {
    animations = track.getAnimations({ subtree: true }).filter((animation) =>
      animation instanceof CSSAnimation && animation.animationName.includes("orbitTravel"));
    writeRate(rate);
  }

  function settle() {
    cancelAnimationFrame(frame);
    frame = 0;
    sync();
    writeRate(target);
    track.dataset.motionState = target === 0 ? "stopped" : "running";
  }

  function setHovered(hovered: boolean, canAnimate: boolean) {
    target = hovered ? 0 : 1;
    cancelAnimationFrame(frame);
    sync();
    if (!canAnimate || !animations.length || Math.abs(rate - target) < .001) { settle(); return; }
    const from = rate;
    const started = performance.now();
    const duration = hovered ? 680 : 920;
    track.dataset.motionState = hovered ? "braking" : "accelerating";

    // Frames run only during the brief speed change; CSS owns ongoing movement.
    function tick(now: number) {
      const progress = Math.min(1, (now - started) / duration);
      const eased = progress * progress * (3 - 2 * progress);
      writeRate(from + (target - from) * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
      else { frame = 0; track.dataset.motionState = target === 0 ? "stopped" : "running"; }
    }
    frame = requestAnimationFrame(tick);
  }

  return { sync, settle, setHovered, dispose: () => cancelAnimationFrame(frame) };
}

function SubjectCard({ subject, ring, index, phase, onHover }: { subject: Subject; ring: number; index: number; phase: number; onHover: OrbitHover }) {
  const bounds = useRef<DOMRect | null>(null);
  const Icon = subject.icon;
  const seed = ring * 8 + index;
  const rotation = ((seed * 13) % 37) - 18;

  function leave(element: HTMLDivElement) {
    bounds.current = null;
    delete element.dataset.hovered;
    ["--tilt-x", "--tilt-y", "--tilt-z"].forEach((property) => element.style.removeProperty(property));
    onHover(ring, false);
  }

  function tilt(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !bounds.current) return;
    const rect = bounds.current;
    const x = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
    const y = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
    event.currentTarget.style.setProperty("--tilt-x", `${-y * 9}deg`);
    event.currentTarget.style.setProperty("--tilt-y", `${x * 12}deg`);
    event.currentTarget.style.setProperty("--tilt-z", `${x * 3}deg`);
  }

  return (
    <div className={styles.traveller} data-subject={subject.name} style={{
      "--phase": `${phase}%`,
      "--arrival-delay": `${90 + ((seed * 347) % 1050)}ms`,
      "--arrival-x": `${((seed * 31) % 110) - 55}px`, "--arrival-y": `${((seed * 43) % 100) - 50}px`,
      "--arrival-rotation": `${rotation}deg`, "--catch-rotation": `${rotation / 6}deg`,
      "--subject-color": subject.color, "--subject-ink": subject.ink,
    } as CSSProperties}>
      <div className={styles.arrival}>
        <div className={styles.hoverLift}>
          <div className={styles.subjectCard} role="img" aria-label={subject.name}
            onPointerEnter={(event) => {
              if (event.pointerType !== "mouse") return;
              bounds.current = event.currentTarget.getBoundingClientRect();
              event.currentTarget.dataset.hovered = "true";
              onHover(ring, true);
            }}
            onPointerMove={tilt}
            onPointerLeave={(event) => leave(event.currentTarget)}
            onPointerCancel={(event) => leave(event.currentTarget)}>
            <span className={styles.subjectIcon}><Icon size={22} weight="fill" aria-hidden="true" /></span>
            <span className={styles.subjectLabel}>{subject.name}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingOrbits() {
  const field = useRef<HTMLDivElement>(null);
  const hoverControllers = useRef<Array<(hovered: boolean) => void>>([]);

  useEffect(() => {
    const element = field.current;
    if (!element) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const controllers = [...element.querySelectorAll<HTMLElement>("[data-orbit]")].map(createOrbitMotion);
    let inView = true;
    const canAnimate = () => !document.hidden && inView && !reduceMotion.matches;
    hoverControllers.current = controllers.map((controller) => (hovered) => controller.setHovered(hovered, canAnimate()));
    const update = () => {
      element.dataset.motionPaused = String(document.hidden || !inView);
      if (!canAnimate()) controllers.forEach((controller) => controller.settle());
      else controllers.forEach((controller) => controller.sync());
    };
    const observer = new IntersectionObserver(([entry]) => { inView = entry?.isIntersecting ?? false; update(); });
    const resize = new ResizeObserver(() => controllers.forEach((controller) => controller.sync()));
    observer.observe(element);
    resize.observe(element);
    document.addEventListener("visibilitychange", update);
    reduceMotion.addEventListener("change", update);
    update();
    return () => {
      observer.disconnect(); resize.disconnect(); controllers.forEach((controller) => controller.dispose());
      hoverControllers.current = [];
      document.removeEventListener("visibilitychange", update); reduceMotion.removeEventListener("change", update);
    };
  }, []);

  return (
    <div className={styles.orbitField} ref={field} aria-label="Materias médicas">
      {subjectGroups.map((subjects, ring) => (
        <div className={`${styles.orbitTrack} ${styles[`ring${ring}`]}`} key={ring} data-orbit={ring}>
          <span className={styles.orbitLine} aria-hidden="true" />
          {subjects.map((subject, index) => <SubjectCard subject={subject} ring={ring} index={index}
            phase={index * 100 / subjects.length + ring * 4 + 3} key={subject.name}
            onHover={(orbit, hovered) => hoverControllers.current[orbit]?.(hovered)} />)}
          {[13, 28, 36, 62, 79, 88].map((phase, index) => (
            <span key={phase} className={`${styles.traveller} ${styles.orbitDot}`} aria-hidden="true"
              style={{ "--phase": `${phase + ring * 3}%`, "--dot-size": `${index % 3 === 0 ? 7 : 4}px` } as CSSProperties} />
          ))}
        </div>
      ))}
    </div>
  );
}
