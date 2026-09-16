/* Apple mobile gradient override — background only.
 * Codex mechanism: paint the gradient directly on body[data-view].
 */
(function () {
  const STYLE_ID = "apple-mobile-gradient";
  const TRANSPARENCY_STYLE_ID = "apple-mobile-gradient-transparency";
  const DASHBOARD_RE = /^\/dashboard-(x|timo|juli|mika|gabi)(?:\/|$)/;
  const VIEW_RE = /^\/dashboard-(?:x|timo|juli|mika|gabi)\/([^/?#]+)/;

  function markRoute() {
    const path = globalThis.location?.pathname || globalThis.window?.location?.pathname;
    if (!path) return;
    const root = document.documentElement;
    const isDashboard = DASHBOARD_RE.test(path);
    root.setAttribute("data-panel", isDashboard ? "dash" : "admin");
    const match = path.match(VIEW_RE);
    if (match?.[1]) root.setAttribute("data-view", decodeURIComponent(match[1]));
    else root.removeAttribute("data-view");
  }

  const TRANSPARENCY_CSS = `
@media (max-width: 700px) {
  ha-panel-lovelace, hui-root, hui-view, hui-sections-view, #view, hui-view-background {
    background: transparent !important;
    background-color: transparent !important;
    --primary-background-color: transparent !important;
  }
}`;
  const CSS = `
@media (max-width: 700px) {
  body[data-view="haus"],
  body[data-view="wohnzimmer"] {
    background: linear-gradient(180deg, rgba(232,181,122,0.28) 0%, rgba(232,181,122,0.08) 42%, rgba(125,122,255,0.06) 100%), #000000 !important;
  }

  body[data-view="mobilgeraete"] {
    background: linear-gradient(180deg, rgba(100,210,255,0.26) 0%, rgba(100,210,255,0.08) 42%, rgba(125,122,255,0.06) 100%), #000000 !important;
  }

  body[data-view="nico-zimmer"] {
    background: linear-gradient(180deg, rgba(125,122,255,0.28) 0%, rgba(125,122,255,0.08) 42%, rgba(232,181,122,0.06) 100%), #000000 !important;
  }

  body[data-view="medien"] {
    background: linear-gradient(180deg, rgba(100,210,255,0.28) 0%, rgba(100,210,255,0.08) 42%, rgba(232,181,122,0.06) 100%), #000000 !important;
  }

  body[data-view="system"] {
    background: linear-gradient(180deg, rgba(142,142,147,0.24) 0%, rgba(142,142,147,0.08) 42%, rgba(232,181,122,0.05) 100%), #000000 !important;
  }

  body[data-view="system-warnungen"] {
    background: linear-gradient(180deg, rgba(255,105,97,0.28) 0%, rgba(255,105,97,0.08) 42%, rgba(232,181,122,0.05) 100%), #000000 !important;
  }

  body[data-view="timo-zimmer"] {
    background: linear-gradient(180deg, rgba(48,219,91,0.26) 0%, rgba(48,219,91,0.08) 42%, rgba(232,181,122,0.05) 100%), #000000 !important;
  }

  body[data-view="huette"] {
    background: linear-gradient(180deg, rgba(255,179,64,0.28) 0%, rgba(255,179,64,0.08) 42%, rgba(232,181,122,0.05) 100%), #000000 !important;
  }

  body[data-view="aussenbereich"] {
    background: linear-gradient(180deg, rgba(48,219,91,0.26) 0%, rgba(48,219,91,0.08) 42%, rgba(64,203,224,0.06) 100%), #000000 !important;
  }

  body[data-view="erdgeschoss"] {
    background: linear-gradient(180deg, rgba(64,203,224,0.26) 0%, rgba(64,203,224,0.08) 42%, rgba(125,122,255,0.06) 100%), #000000 !important;
  }

  body[data-view="mika-zimmer"] {
    background: linear-gradient(180deg, rgba(10,132,255,0.28) 0%, rgba(10,132,255,0.08) 42%, rgba(232,181,122,0.06) 100%), #000000 !important;
  }

  body[data-view="juli-zimmer"] {
    background: linear-gradient(180deg, rgba(255,55,95,0.42) 0%, rgba(255,55,95,0.16) 42%, rgba(255,55,95,0.04) 100%), #000000 !important;
  }

  body[data-view="flur"] {
    background: linear-gradient(180deg, rgba(142,142,147,0.24) 0%, rgba(142,142,147,0.08) 42%, rgba(232,181,122,0.05) 100%), #000000 !important;
  }

  body[data-view] {
    background-attachment: fixed !important;
    background-repeat: no-repeat !important;
    background-size: 100% 100% !important;
  }
}
`;

  function installTransparency(root) {
    if (!root || root.getElementById?.(TRANSPARENCY_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = TRANSPARENCY_STYLE_ID;
    style.textContent = TRANSPARENCY_CSS;
    root.appendChild(style);
  }

  function scan(node = document) {
    if (node.shadowRoot) {
      installTransparency(node.shadowRoot);
      scan(node.shadowRoot);
    }
    node.querySelectorAll?.("*").forEach((el) => {
      if (el.shadowRoot) {
        installTransparency(el.shadowRoot);
        scan(el.shadowRoot);
      }
    });
  }

  function apply() {
    if (!document.head) return;
    markRoute();
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      document.head.appendChild(style);
    }
    if (style.textContent !== CSS) style.textContent = CSS;
    installTransparency(document.head);
    scan();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", apply, { once: true });
  } else {
    apply();
  }
  window.addEventListener("location-changed", apply);
  window.addEventListener("popstate", apply);
  new MutationObserver(apply).observe(document.documentElement, { childList: true, subtree: true });
})();
