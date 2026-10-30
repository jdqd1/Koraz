"use client";

import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth/client";
import { NewPasswordSchema, getPublicAuthErrorMessage, AUTH_PASSWORD_MAX_LENGTH } from "@/lib/auth/validation";

export function AccountSecurityForm() {
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const action = (event.nativeEvent as SubmitEvent).submitter?.getAttribute("value");
    if (action !== "revoke") {
      const checked = NewPasswordSchema.safeParse(newPassword);
      if (!checked.success) { setError(checked.error.issues[0]?.message ?? "Revisa la contraseña."); return; }
      if (newPassword !== confirmPassword) { setError("Las contraseñas no coinciden."); return; }
    }
    setBusy(true); setError("");
    try {
      if (action === "revoke") {
        const result = await fetch("/api/auth/revoke-sessions", { method: "POST", credentials: "same-origin",
          headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
        if (!result.ok) throw { ...(await result.json()), status: result.status };
      } else {
        const result = await authClient.changePassword({ currentPassword: password, newPassword, revokeOtherSessions: true });
        if (result.error) throw result.error;
        // Revoke the replacement session as well so a password change closes every device.
        const logout = await authClient.signOut();
        if (logout.error) throw logout.error;
      }
      window.location.replace(action === "revoke" ? "/acceder?mensaje=sesiones-cerradas" : "/acceder?mensaje=contrasena-actualizada");
    } catch (caught) {
      setPassword("");
      setError(getPublicAuthErrorMessage(caught, "update-password"));
    } finally { setBusy(false); }
  }

  return <form className="auth-form" onSubmit={submit}>
    <h1>Seguridad de tu cuenta</h1>
    {error && <p className="auth-message is-error" role="alert">{error}</p>}
    <label htmlFor="current-password">Contraseña actual</label>
    <input id="current-password" type="password" autoComplete="current-password" required
      maxLength={AUTH_PASSWORD_MAX_LENGTH} value={password} disabled={busy} onChange={e => setPassword(e.target.value)} />
    <label htmlFor="security-new-password">Nueva contraseña</label>
    <input id="security-new-password" type="password" autoComplete="new-password" maxLength={AUTH_PASSWORD_MAX_LENGTH}
      value={newPassword} disabled={busy} onChange={e => setNewPassword(e.target.value)} />
    <label htmlFor="security-confirm-password">Confirma la nueva contraseña</label>
    <input id="security-confirm-password" type="password" autoComplete="new-password" maxLength={AUTH_PASSWORD_MAX_LENGTH}
      value={confirmPassword} disabled={busy} onChange={e => setConfirmPassword(e.target.value)} />
    <button className="button button-primary" value="change" type="submit" disabled={busy}>
      {busy ? "Procesando..." : "Cambiar contraseña"}</button>
    <button className="button" value="revoke" type="submit" disabled={busy}>Cerrar todas las sesiones</button>
  </form>;
}
