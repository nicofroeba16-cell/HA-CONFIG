/* Apple Optik — dashboard background route helper v5.
 * Keeps the existing gradient definitions in apple-optik.js untouched.
 * Ensures all personal dashboards get the same data-panel/data-view context
 * as dashboard-x, so the exact same per-view backgrounds are used.
 */
(() => {
  const STYLE_ID = "apple-mobile-gradient";
  const DASHBOARD_RE = /^\/dashboard-(x|timo|juli|mika|gabi)(?:\/|$)/;
  const VIEW_RE = /^\/dashboard-(?:x|timo|juli|mika|gabi)\/([^/?#]+)/;

  const markRoute = () => {
    const path = window.location.pathname || "";
    const root = document.documentElement;
    const isDashboard = DASHBOARD_RE.test(path);

    root.setAttribute("data-panel", isDashboard ? "dash" : "admin");

    const match = path.match(VIEW_RE);
    if (match?.[1]) {
      root.setAttribute("data-view", decodeURIComponent(match[1]));
    } else {
      root.removeAttribute("data-view");
    }
  };

  const CSS = `
    @media (max-width: 600px) {
      ha-panel-lovelace,
      hui-root,
      hui-view,
      hui-sections-view,
      #view,
      hui-view-background {
        background: transparent !important;
        background-color: transparent !important;
        --primary-background-color: transparent !important;
      }
    }
  `;

  const install = (root) => {
    if (!root || root.getElementById?.(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = CSS;
    root.appendChild(style);
  };

  const scan = (node = document) => {
    if (node.shadowRoot) {
      install(node.shadowRoot);
      scan(node.shadowRoot);
    }
    node.querySelectorAll?.("*").forEach((el) => {
      if (el.shadowRoot) {
        install(el.shadowRoot);
        scan(el.shadowRoot);
      }
    });
  };

  const refresh = () => {
    markRoute();
    scan();
  };

  install(document.head);
  refresh();

  window.addEventListener("location-changed", refresh);
  window.addEventListener("popstate", refresh);

  new MutationObserver(refresh).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
