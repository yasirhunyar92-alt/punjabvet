import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import "@fontsource/outfit/300.css";
import "@fontsource/outfit/400.css";
import "@fontsource/outfit/500.css";
import "@fontsource/outfit/600.css";
import "@fontsource/outfit/700.css";
import App from "./App.tsx";
import "./index.css";

// After a new deploy, old cached files can fail to load on refresh — reload once to fetch fresh ones.
const reloadOnce = () => {
  if (sessionStorage.getItem("pv-reloaded")) return;
  sessionStorage.setItem("pv-reloaded", "1");
  window.location.reload();
};
window.addEventListener("vite:preloadError", (e) => { e.preventDefault(); reloadOnce(); });
window.addEventListener("error", (e) => {
  if (/Loading chunk|dynamically imported module|Importing a module script failed/i.test(e.message || "")) reloadOnce();
});
window.setTimeout(() => sessionStorage.removeItem("pv-reloaded"), 10000);

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
