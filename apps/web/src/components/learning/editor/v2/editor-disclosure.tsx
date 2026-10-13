"use client";

import { useState, type ReactNode } from "react";
import local from "./styles.module.css";

/** Keep fields mounted so validation can open the group and focus the exact input. */
export function EditorDisclosureV2({ title, description, badge, children, initiallyOpen = false, card = false }: {
  title: string; description?: string; badge?: ReactNode; children: ReactNode; initiallyOpen?: boolean; card?: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  return <details className={card ? local.itemDisclosure : local.optionsDisclosure} open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
    <summary><span><strong>{title}</strong>{description ? <small>{description}</small> : null}</span>{badge}</summary>
    <div className={local.disclosureBody}>{children}</div>
  </details>;
}
