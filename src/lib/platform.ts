import { Capacitor } from "@capacitor/core";

/* True inside the iOS/Android shell or an installed PWA. Marketing pages are never shown there. */
export const isNative = () => Capacitor.isNativePlatform();
export const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true);
export const isAppShell = () => isNative() || isStandalone() || sessionStorage.getItem("cat-app") === "1";

const LEGAL: Record<string, string> = { "/privacy": "/app/live/legal/privacy", "/terms": "/app/live/legal/terms" };
/* Paths that belong to the marketing site; inside the app they map to app screens. */
export function appPathFor(p: string): string | null {
  if (LEGAL[p]) return LEGAL[p];
  if (p.startsWith("/app") || p.startsWith("/signup") || p.startsWith("/auth") || p.startsWith("/forgot-password") || p.startsWith("/onboarding")) return null;
  return "/app/live";
}
