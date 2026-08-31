import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App";

// GitHub Pages 深链回退：恢复 404.html 暂存的请求路径（如 /projects/secrag）。
(function restoreDeepLink() {
  try {
    const redirect = sessionStorage.getItem(":redirect");
    if (redirect && redirect !== location.pathname + location.search) {
      sessionStorage.removeItem(":redirect");
      window.history.replaceState(null, "", redirect);
    }
  } catch {
    /* noop */
  }
})();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
