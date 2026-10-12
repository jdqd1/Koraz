"use client";
import { useState, type ReactNode } from "react";
import type { V2PublicActivity } from "@cediah/contracts";
import ui from "../../activities/activity-ui.module.css";

export function ChoiceRenderer({ activity, disabled, tools, onSubmit }: { activity: Extract<V2PublicActivity, { kind: "single_choice" }>; disabled: boolean; tools?: ReactNode; onSubmit: (optionKey: string) => void }) {
  const [selected, setSelected] = useState("");
  return <form className="learning-question-card" onSubmit={event => { event.preventDefault(); if (selected && !disabled) onSubmit(selected); }}>
    <fieldset disabled={disabled}><legend className="sr-only">Elige una respuesta</legend>{activity.payload.options.map(option => <label key={option.key} className={selected === option.key ? "is-selected" : undefined}><input type="radio" name={activity.key} value={option.key} checked={selected === option.key} onChange={() => setSelected(option.key)} /><span>{option.text}</span></label>)}</fieldset>
    {tools}<div className={ui.action}><button className="learning-primary-button" type="submit" disabled={disabled || !selected}>Comprobar respuesta</button></div>
  </form>;
}
