import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import "@/styles/catalyst-light.css";

/** Route prefixes rendered by legacy pages that must use the unified light palette.
 *  Separate products (/match, /exitfund), the marketing site and FeaturesApp keep their own themes. */
const BOTH = [
  "/dashboard", "/updates", "/matches", "/connections", "/coffeechat", "/safes", "/safe",
  "/captable", "/founder-analytics", "/market-pulse", "/investments", "/requests",
  "/settings", "/filters", "/referrals", "/portal", "/concierge", "/profile",
  "/catalystdeck/edit", "/onboarding",
];
// Only the /app form is legacy here; bare /home, /portfolio, /admin belong to signup, FeaturesApp and the new admin.
const APP_ONLY = ["/app/home", "/app/portfolio", "/app/admin"];
export const LIGHT_ROUTE_PREFIXES = [...BOTH, ...BOTH.map((p) => "/app" + p), ...APP_ONLY, "/unsubscribe"];

export function isLightRoute(pathname: string) {
  return LIGHT_ROUTE_PREFIXES.some((r) => pathname === r || pathname.startsWith(r + "/"));
}

export function CatalystLightTheme() {
  const { pathname } = useLocation();
  const on = isLightRoute(pathname);
  useEffect(() => {
    document.documentElement.classList.toggle("cl-light", on);
  }, [on]);
  return null;
}
