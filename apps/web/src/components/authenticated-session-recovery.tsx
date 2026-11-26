"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

const retryDelaysMs = [4_000, 8_000, 16_000, 32_000] as const;

export function AuthenticatedSessionRecovery() {
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);
  const [pending, startTransition] = useTransition();
  const delay = retryDelaysMs[attempt];

  useEffect(() => {
    if (pending || delay === undefined) return;

    const timer = window.setTimeout(() => {
      setAttempt(attempt + 1);
      startTransition(() => router.refresh());
    }, delay);

    return () => window.clearTimeout(timer);
  }, [attempt, delay, pending, router]);

  if (!pending && delay === undefined) return null;
  return <p role="status">Koraz volverá a intentar cargar esta página automáticamente.</p>;
}
