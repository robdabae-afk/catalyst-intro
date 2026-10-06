import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { appPathFor, isAppShell, isNative } from "./lib/platform";

// Inside the native shell / installed PWA, never show marketing pages: start at /.
if (isAppShell()) {
  sessionStorage.setItem("cat-app", "1");
  const to = appPathFor(location.pathname);
  if (to) history.replaceState(null, "", to);
  document.documentElement.classList.add("is-app");
}
if (isNative()) {
  import("@capacitor/status-bar").then(({ StatusBar, Style }) => { StatusBar.setStyle({ style: Style.Light }).catch(() => {}); StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {}); });
  import("@capacitor/splash-screen").then(({ SplashScreen }) => setTimeout(() => SplashScreen.hide().catch(() => {}), 300));
  import("@capacitor/app").then(({ App }) => App.addListener("backButton", ({ canGoBack }) => { if (canGoBack) history.back(); else App.exitApp(); }));
} else if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {}));
}

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
