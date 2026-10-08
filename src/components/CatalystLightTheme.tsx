import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import "@/styles/catalyst-light.css";

/** Legacy member pages (people swipe, person DMs, settings, profiles, connections, requests, concierge, finance), kept for their data logic, styled with the features palette.
 *  Separate products (/match, /exitfund), the marketing site and FeaturesApp keep their own themes. */
const BOTH = ["/dashboard", "/matches", "/settings", "/profile", "/connections", "/requests", "/concierge",
  // finance + member tools still on legacy pages
  "/safes", "/safe", "/captable", "/investments", "/founder-analytics", "/market-pulse", "/portal", "/referrals", "/filters", "/updates", "/coffeechat"];
const SHELL = ["/people/swipe", "/messages"];
// Only the /app form is legacy here; bare /home, /portfolio, /admin belong to signup, FeaturesApp and the new admin.
const APP_ONLY: string[] = [];
export const LIGHT_ROUTE_PREFIXES = [...BOTH, ...BOTH.map((p) => "/app" + p), ...APP_ONLY, ...SHELL];

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
