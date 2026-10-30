import { betterAuth } from "better-auth";
import { captcha } from "better-auth/plugins";
import { isPasswordCompromised } from "better-auth/plugins/haveibeenpwned";
import { hashPassword } from "better-auth/crypto";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { createHmac, timingSafeEqual } from "node:crypto";
import nodemailer from "nodemailer";
import { Pool } from "pg";
import type { IdentityProvider, IdentityRequest, ProviderUser } from "@cediah/contracts";
import { AUTH_PASSWORD_MIN_LENGTH, AUTH_PASSWORD_MAX_LENGTH, NewPasswordSchema,
  AUTH_SESSION_SECONDS, AUTH_SESSION_MAX_SECONDS, AUTH_SESSION_UPDATE_SECONDS } from "@cediah/contracts";

export type SmtpConfiguration = {
  from: string;
  host: string;
  password?: string;
  port: number;
  secure: boolean;
  user?: string;
};

export type BetterAuthConfiguration = {
  databaseUrl: string;
  publicUrl: string;
  proxySecret?: string;
  requireEmailVerification: boolean;
  secret: string;
  smtp?: SmtpConfiguration;
  turnstileSecretKey?: string;
  trustedOrigins: string[];
};

export interface AuthService extends IdentityProvider {
  close(): Promise<void>;
  handle(request: Request): Promise<Response>;
}

function requestHeaders(input: IdentityRequest) {
  const headers = new Headers();
  if (input.authorization) headers.set("authorization", input.authorization);
  if (input.cookie) headers.set("cookie", input.cookie);
  if (input.forwardedFor) headers.set("x-forwarded-for", input.forwardedFor);
  if (input.userAgent) headers.set("user-agent", input.userAgent);
  return headers;
}

function createMailer(configuration: SmtpConfiguration | undefined) {
  if (!configuration) return undefined;

  return nodemailer.createTransport({
    auth:
      configuration.user && configuration.password
        ? { pass: configuration.password, user: configuration.user }
        : undefined,
    host: configuration.host,
    port: configuration.port,
    secure: configuration.secure,
  });
}

export function createBetterAuthService(
  configuration: BetterAuthConfiguration,
  dependencies: { pool?: Pool } = {},
): AuthService {
  const ownsPool = !dependencies.pool;
  const pool = dependencies.pool ?? new Pool({ connectionString: configuration.databaseUrl, max: 4,
    connectionTimeoutMillis: 5_000, idleTimeoutMillis: 30_000 });
  const mailer = createMailer(configuration.smtp);
  const sendAuthEmail = mailer && configuration.smtp
    ? async (input: { subject: string; text: string; to: string }) => {
        await mailer.sendMail({
          from: configuration.smtp?.from,
          subject: input.subject,
          text: input.text,
          to: input.to,
        });
      }
    : undefined;

  const auth = betterAuth({
    account: {
      additionalFields: { issuer: { type: "string", required: true, input: false, defaultValue: "local:credential" } },
      fields: {
        accessToken: "access_token",
        accessTokenExpiresAt: "access_token_expires_at",
        accountId: "account_id",
        createdAt: "created_at",
        idToken: "id_token",
        providerId: "provider_id",
        refreshToken: "refresh_token",
        refreshTokenExpiresAt: "refresh_token_expires_at",
        updatedAt: "updated_at",
        userId: "user_id",
      },
      modelName: "auth_accounts",
    },
    advanced: {
      cookiePrefix: "cediah",
      database: { generateId: "uuid" },
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: "lax",
        secure: new URL(configuration.publicUrl).protocol === "https:",
      },
    },
    baseURL: configuration.publicUrl,
    database: pool,
    databaseHooks: {
      session: {
        create: { before: async (session, ctx) => ({ data: { ...session,
          rememberMe: ctx?.body?.rememberMe === true,
          expiresAt: new Date(Date.now() + (ctx?.body?.rememberMe === true ? AUTH_SESSION_SECONDS : AUTH_SESSION_UPDATE_SECONDS) * 1000),
        } }) },
      },
    },
    hooks: {
      before: createAuthMiddleware(async ctx => {
        if (["/sign-in/email", "/sign-up/email"].includes(ctx.path)) {
          ctx.body.rememberMe = ctx.body.rememberMe === true;
        }
        const password = ctx.path === "/sign-up/email" ? ctx.body?.password
          : ["/change-password", "/reset-password", "/set-password"].includes(ctx.path) ? ctx.body?.newPassword : undefined;
        if (password !== undefined && !NewPasswordSchema.safeParse(password).success) {
          throw new APIError("BAD_REQUEST", { code: "WEAK_PASSWORD", message: "La contraseña no cumple los requisitos." });
        }
        if (ctx.path === "/change-password") ctx.body.revokeOtherSessions = true;
        if (ctx.path === "/request-password-reset" && !sendAuthEmail) {
          throw new APIError("SERVICE_UNAVAILABLE", { code: "AUTH_SERVICE_UNAVAILABLE", message: "No fue posible solicitar el enlace." });
        }
        if (ctx.path === "/sign-in/email" && typeof ctx.body?.email === "string") {
          const key = "account:" + createHmac("sha256", configuration.secret)
            .update(ctx.body.email.trim().toLowerCase() + "|" + (ctx.headers?.get("x-forwarded-for") ?? "local")).digest("hex");
          const now = Date.now();
          const result = await pool.query<{ count: number; last_request: string }>(`
            insert into auth_rate_limits(key,count,last_request) values($1,1,$2)
            on conflict(key) do update set
              count=case when auth_rate_limits.last_request <= $2::bigint-900000 then 1 else auth_rate_limits.count+1 end,
              last_request=case when auth_rate_limits.last_request <= $2::bigint-900000 then $2::bigint else auth_rate_limits.last_request end
            returning count,last_request`, [key, now]);
          if (result.rows[0]!.count > 5) {
            ctx.setHeader("Retry-After", String(Math.max(1, Math.ceil((Number(result.rows[0]!.last_request) + 900000 - now) / 1000))));
            throw new APIError("TOO_MANY_REQUESTS", { code: "TOO_MANY_REQUESTS", message: "Espera antes de volver a intentarlo." });
          }
        }
        if (ctx.path === "/revoke-sessions") {
          if (typeof ctx.body?.password !== "string" || !ctx.headers) throw new APIError("BAD_REQUEST", { message: "Confirma tu contraseña." });
          await auth.api.verifyPassword({ headers: ctx.headers, body: { password: ctx.body.password } });
        }
      }),
    },
    emailAndPassword: {
      autoSignIn: true,
      enabled: true,
      password: { hash: async password => {
        let timeout: ReturnType<typeof setTimeout> | undefined;
        try {
          const compromised = await Promise.race([isPasswordCompromised(password), new Promise<never>((_, reject) => {
            timeout = setTimeout(() => reject(new APIError("SERVICE_UNAVAILABLE", { code: "AUTH_SERVICE_UNAVAILABLE", message: "No pudimos comprobar la contraseña. Inténtalo de nuevo." })), 5_000);
          })]);
          if (compromised) throw new APIError("BAD_REQUEST", { code: "PASSWORD_COMPROMISED", message: "Elige una contraseña que no aparezca en filtraciones." });
          return hashPassword(password);
        } finally { clearTimeout(timeout); }
      } },
      maxPasswordLength: AUTH_PASSWORD_MAX_LENGTH,
      minPasswordLength: AUTH_PASSWORD_MIN_LENGTH,
      requireEmailVerification: configuration.requireEmailVerification,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: sendAuthEmail
        ? async ({ url, user }) => {
            await sendAuthEmail({
              subject: "Restablece tu contraseña de CEDIAH",
              text: `Abre este enlace para crear una contraseña nueva: ${url}`,
              to: user.email,
            });
          }
        : undefined,
    },
    emailVerification: sendAuthEmail
      ? {
          autoSignInAfterVerification: true,
          sendOnSignUp: configuration.requireEmailVerification,
          async sendVerificationEmail({ url, user }) {
            await sendAuthEmail({
              subject: "Verifica tu correo de CEDIAH",
              text: `Abre este enlace para verificar tu correo: ${url}`,
              to: user.email,
            });
          },
        }
      : undefined,
    plugins: [...(configuration.turnstileSecretKey
      ? [
          captcha({
            provider: "cloudflare-turnstile",
            secretKey: configuration.turnstileSecretKey,
          }),
        ]
      : [])],
    rateLimit: {
      enabled: true,
      modelName: "auth_rate_limits",
      storage: "database",
      fields: { lastRequest: "last_request" },
      window: 900,
      max: 100,
      customRules: {
        "/sign-in/email": { window: 900, max: 100 },
        "/sign-up/email": { window: 3600, max: 10 },
        "/change-password": { window: 900, max: 10 },
        "/revoke-sessions": { window: 900, max: 5 },
        "/get-session": false,
      },
    },
    secret: configuration.secret,
    session: {
      expiresIn: AUTH_SESSION_SECONDS,
      updateAge: AUTH_SESSION_UPDATE_SECONDS,
      // Only the HTTP response below renews sessions, atomically with browser cookies.
      disableSessionRefresh: true,
      cookieCache: { enabled: false },
      additionalFields: { rememberMe: { type: "boolean", required: false, input: false, fieldName: "remember_me" } },
      fields: {
        createdAt: "created_at",
        expiresAt: "expires_at",
        ipAddress: "ip_address",
        updatedAt: "updated_at",
        userAgent: "user_agent",
        userId: "user_id",
      },
      modelName: "auth_sessions",
    },
    trustedOrigins: configuration.trustedOrigins,
    user: {
      fields: {
        createdAt: "created_at",
        emailVerified: "email_verified",
        updatedAt: "updated_at",
      },
      modelName: "auth_users",
    },
    verification: {
      fields: {
        createdAt: "created_at",
        expiresAt: "expires_at",
        updatedAt: "updated_at",
      },
      modelName: "auth_verifications",
      storeIdentifier: "hashed",
    },
  });

  const cleanup = setInterval(() => {
    void pool.query(`
      delete from auth_sessions where id in (select id from auth_sessions where expires_at < now() limit 1000);
      delete from auth_verifications where id in (select id from auth_verifications where expires_at < now() limit 1000);
      delete from auth_rate_limits where id in (select id from auth_rate_limits where last_request < extract(epoch from now() - interval '1 day') * 1000 limit 1000);
      delete from audit_log where id in (select id from audit_log where action like 'auth.%' and occurred_at < now()-interval '30 days' limit 1000)
    `).catch(() => console.error("Auth maintenance failed"));
  }, 60 * 60 * 1000);
  cleanup.unref();

  return {
    async close() {
      clearInterval(cleanup);
      if (ownsPool) await pool.end();
    },
    getUser: async (input): Promise<ProviderUser | null> => {
      const session = await auth.api.getSession({ headers: requestHeaders(input), query: { disableRefresh: true, disableCookieCache: true } });
      if (
        !session?.user.email ||
        (configuration.requireEmailVerification && !session.user.emailVerified)
      ) {
        return null;
      }
      return { email: session.user.email, id: session.user.id };
    },
    async handle(request) {
      if (configuration.proxySecret) {
        const supplied = Buffer.from(request.headers.get("x-auth-proxy-secret") ?? "");
        const expected = Buffer.from(configuration.proxySecret);
        if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
          return Response.json({ code: "UNAUTHORIZED" }, { status: 401, headers: { "Cache-Control": "private, no-store" } });
        }
      }
      if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
        const origin = request.headers.get("origin");
        if (!origin || !configuration.trustedOrigins.includes(origin) || request.headers.get("sec-fetch-site") === "cross-site") {
          return Response.json({ code: "INVALID_ORIGIN" }, { status: 403, headers: { "Cache-Control": "private, no-store" } });
        }
      }
      const response = await auth.handler(request);
      const headers = new Headers(response.headers);
      headers.set("Cache-Control", "private, no-store");
      if (response.status === 429) headers.set("Retry-After", headers.get("Retry-After") ?? headers.get("X-Retry-After") ?? "900");
      const operation = new URL(request.url).pathname.split("/api/auth/")[1];
      if (response.ok && ["sign-up/email", "sign-in/email", "sign-out", "change-password", "revoke-sessions"].includes(operation ?? "")) {
        const data = await response.clone().json().catch(() => null);
        await pool.query("insert into audit_log(actor_user_id,action,target_type) values($1,$2,'auth_session')",
          [data?.user?.id ?? null, "auth." + operation!.replaceAll("/", ".")])
          .catch(() => console.error("Auth audit write failed"));
      }
      const cookieName = `${new URL(configuration.publicUrl).protocol === "https:" ? "__Secure-" : ""}cediah.session_token`;
      const cookies = response.headers.getSetCookie();
      const isSessionRead = new URL(request.url).pathname.endsWith("/get-session");
      if (response.ok && (isSessionRead || cookies.some(value => value.startsWith(cookieName + "=")))) {
        const data = await response.clone().json().catch(() => null);
        if (isSessionRead && data?.session?.rememberMe === true &&
          Date.now() - new Date(data.session.updatedAt).getTime() >= AUTH_SESSION_UPDATE_SECONDS * 1000) {
          const updated = await pool.query<{ expires_at: Date; updated_at: Date }>(`
            update auth_sessions set expires_at=least(now()+($2::int*interval '1 second'),created_at+($3::int*interval '1 second'))
            where token=$1 and remember_me is true and expires_at > now()
              and created_at > now()-($3::int*interval '1 second') and updated_at <= now()-($4::int*interval '1 second')
            returning expires_at,updated_at`, [data.session.token, AUTH_SESSION_SECONDS, AUTH_SESSION_MAX_SECONDS, AUTH_SESSION_UPDATE_SECONDS]);
          if (updated.rows[0]) {
            data.session.expiresAt = updated.rows[0].expires_at.toISOString();
            data.session.updatedAt = updated.rows[0].updated_at.toISOString();
            const value = request.headers.get("cookie")?.split(";").map(part => part.trim())
              .find(part => part.startsWith(cookieName + "="));
            if (value) headers.append("set-cookie", `${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.max(0,
              Math.floor((updated.rows[0].expires_at.getTime()-Date.now())/1000))}${cookieName.startsWith("__Secure-") ? "; Secure" : ""}`);
            headers.delete("content-length");
            return Response.json(data, { status: response.status, headers });
          }
        }
        if (cookies.some(value => value.startsWith(cookieName + "=")) && data?.token) {
          const result = await pool.query<{ remember_me: boolean | null; expires_at: Date }>(
            "select remember_me,expires_at from auth_sessions where token=$1", [data.token]);
          const session = result.rows[0];
          if (session) {
            headers.delete("set-cookie");
            for (const cookie of cookies) headers.append("set-cookie", cookie.startsWith(cookieName + "=")
              ? cookie.replace(/; Max-Age=[^;]*/gi, "").replace(/; Expires=[^;]*/gi, "") +
                (session.remember_me ? `; Max-Age=${Math.max(0, Math.floor((session.expires_at.getTime() - Date.now()) / 1000))}` : "")
              : cookie);
            if (session.remember_me) headers.append("set-cookie", `${cookieName.replace("session_token", "dont_remember")}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${cookieName.startsWith("__Secure-") ? "; Secure" : ""}`);
          }
        }
      }
      return new Response(response.body, { status: response.status, headers });
    },
    async revokeSessions(userId) {
      await pool.query('delete from "auth_sessions" where "user_id" = $1', [userId]);
    },
  };
}
