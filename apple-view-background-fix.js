/* Apple Optik — Codex hui-view-background fix for all personal dashboards.
 * Based on the working v1.9.21 fix: mark dashboard panel, remove the opaque
 * HUI background layer in DOM + Shadow DOM + inline styles, keep admin opaque.
 */
(() => {
  const STYLE_ID = "apple-view-background-fix";
  const DASH_RE = /^\/dashboard-(?:x|timo|mika|juli|gabi)(?:\/|$)/;
  const VIEW_RE = /^\/dashboard-(?:x|timo|mika|juli|gabi)\/([^/?#]+)/;

  const CSS = `
:host(hui-root),
:host(hui-view-background),
:host(hui-view),
:host(hui-sections-view),
:host(ha-app-layout),
hui-root,
hui-view,
hui-sections-view,
#view,
hui-view-background {
  --lovelace-background: transparent !important;
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
}
:host(hui-view-background)::before,
:host(hui-view-background)::after,
hui-view-background::before,
hui-view-background::after {
  content: none !important;
  display: none !important;
  background: none !important;
  background-image: none !important;
}
`;

  const painted = new WeakSet();

  function isDashboard() {
    return DASH_RE.test(location.pathname || "");
  }

  function markRoute() {
    const root = document.documentElement;
    const dashboard = isDashboard();
    root.setAttribute("data-panel", dashboard ? "dash" : "admin");

    if (!dashboard) {
      root.removeAttribute("data-view");
      root.removeAttribute("data-view-next");
      document.body?.removeAttribute("data-view");
      return false;
    }

    const match = (location.pathname || "").match(VIEW_RE);
    const view = match?.[1] || "haus";
    root.setAttribute("data-view", view);
    document.body?.setAttribute("data-view", view);
    return true;
  }

  function installStyle(root) {
    if (!root || painted.has(root)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = CSS;
    root.appendChild(style);
    painted.add(root);
  }

  function clearBackground(node) {
    if (!node || node.localName !== "hui-view-background") return;
    node.style.setProperty("--lovelace-background", "transparent", "important");
    node.style.setProperty("background", "transparent", "important");
    node.style.setProperty("background-color", "transparent", "important");
    node.style.setProperty("background-image", "none", "important");
  }

  function scan(node = document) {
    if (!isDashboard()) return;

    if (node.nodeType === Node.ELEMENT_NODE) clearBackground(node);
    if (node.shadowRoot) {
      installStyle(node.shadowRoot);
      scan(node.shadowRoot);
    }

    node.querySelectorAll?.("hui-view-background").forEach(clearBackground);
    node.querySelectorAll?.("*").forEach((el) => {
      clearBackground(el);
      if (el.shadowRoot) {
        installStyle(el.shadowRoot);
        scan(el.shadowRoot);
      }
    });
  }

  function apply() {
    if (!markRoute()) return;
    installStyle(document.head);
    scan(document);
  }

  const schedule = () => requestAnimationFrame(apply);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", apply, { once: true });
  } else {
    apply();
  }

  new MutationObserver(schedule).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  window.addEventListener("location-changed", schedule);
  window.addEventListener("popstate", schedule);

  customElements.whenDefined("hui-view-background").then(schedule);
  customElements.whenDefined("hui-view").then(schedule);
  customElements.whenDefined("home-assistant").then(schedule);
})();
