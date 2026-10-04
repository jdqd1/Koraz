const localHostnames = new Set(["localhost", "127.0.0.1"]);

/** A single HTTPS origin for signed private content images in the CSP. */
export function getPublicContentStorageOrigin() {
  const value = process.env.NEXT_PUBLIC_CONTENT_STORAGE_ORIGIN?.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.origin : null;
  } catch {
    return null;
  }
}

export function getPublicTurnstileSiteKey() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  return siteKey && /^[A-Za-z0-9_-]{20,100}$/.test(siteKey) ? siteKey : null;
}

export function getPublicVideoStorageOrigin() {
  const value = process.env.NEXT_PUBLIC_VIDEO_STORAGE_ORIGIN?.trim();
  if (!value) return null;

  try {
    const url = new URL(value);
    const isLocalHttp =
      url.protocol === "http:" && localHostnames.has(url.hostname);
    if (
      url.username ||
      url.password ||
      (url.protocol !== "https:" && !isLocalHttp)
    ) {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}
