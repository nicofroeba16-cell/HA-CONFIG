/* Apple mobile gradient override — background only.
 * Codex mechanism: paint the gradient directly on body[data-view].
 */
(function () {
  const STYLE_ID = "apple-mobile-gradient";
  const TRANSPARENCY_STYLE_ID = "apple-mobile-gradient-transparency";
  const DASHBOARD_RE = /^\/dashboard-(x|timo|juli|mika|gabi)(?:\/|$)/;
  const VIEW_RE = /^\/dashboard-(?:x|timo|juli|mika|gabi)\/([^/?#]+)/;
  const VIEW_BG = {
    haus: "linear-gradient(180deg, rgba(232,181,122,0.28) 0%, rgba(232,181,122,0.08) 42%, rgba(125,122,255,0.06) 100%), #000000",
    wohnzimmer: "linear-gradient(180deg, rgba(232,181,122,0.28) 0%, rgba(232,181,122,0.08) 42%, rgba(125,122,255,0.06) 100%), #000000",
    mobilgeraete: "linear-gradient(180deg, rgba(100,210,255,0.26) 0%, rgba(100,210,255,0.08) 42%, rgba(125,122,255,0.06) 100%), #000000",
    "nico-zimmer": "linear-gradient(180deg, rgba(125,122,255,0.28) 0%, rgba(125,122,255,0.08) 42%, rgba(232,181,122,0.06) 100%), #000000",
    medien: "linear-gradient(180deg, rgba(100,210,255,0.28) 0%, rgba(100,210,255,0.08) 42%, rgba(232,181,122,0.06) 100%), #000000",
    system: "linear-gradient(180deg, rgba(142,142,147,0.24) 0%, rgba(142,142,147,0.08) 42%, rgba(232,181,122,0.05) 100%), #000000",
    "system-warnungen": "linear-gradient(180deg, rgba(255,105,97,0.28) 0%, rgba(255,105,97,0.08) 42%, rgba(232,181,122,0.05) 100%), #000000",
    "timo-zimmer": "linear-gradient(180deg, rgba(48,219,91,0.26) 0%, rgba(48,219,91,0.08) 42%, rgba(232,181,122,0.05) 100%), #000000",
    huette: "linear-gradient(180deg, rgba(255,179,64,0.28) 0%, rgba(255,179,64,0.08) 42%, rgba(232,181,122,0.05) 100%), #000000",
    aussenbereich: "linear-gradient(180deg, rgba(48,219,91,0.26) 0%, rgba(48,219,91,0.08) 42%, rgba(64,203,224,0.06) 100%), #000000",
    erdgeschoss: "linear-gradient(180deg, rgba(64,203,224,0.26) 0%, rgba(64,203,224,0.08) 42%, rgba(125,122,255,0.06) 100%), #000000",
    "mika-zimmer": "linear-gradient(180deg, rgba(10,132,255,0.28) 0%, rgba(10,132,255,0.08) 42%, rgba(232,181,122,0.06) 100%), #000000",
    "juli-zimmer": "linear-gradient(180deg, rgba(255,55,95,0.42) 0%, rgba(255,55,95,0.16) 42%, rgba(255,55,95,0.04) 100%), #000000",
    flur: "linear-gradient(180deg, rgba(142,142,147,0.24) 0%, rgba(142,142,147,0.08) 42%, rgba(232,181,122,0.05) 100%), #000000",
  };

  function markRoute() {
    const path = globalThis.location?.pathname || globalThis.window?.location?.pathname;
    if (!path) return;
    const root = document.documentElement;
    const isDashboard = DASHBOARD_RE.test(path);
    root.setAttribute("data-panel", isDashboard ? "dash" : "admin");
    const match = path.match(VIEW_RE);
    if (!isDashboard) {
      root.removeAttribute("data-view");
      root.removeAttribute("data-view-next");
      if (document.body) document.body.removeAttribute("data-view");
      return;
    }
    const view = match?.[1] ? decodeURIComponent(match[1]) : "haus";
    root.style.setProperty("--apple-mobile-next-bg", VIEW_BG[view] || VIEW_BG.haus);
    if (!root.hasAttribute("data-view")) root.setAttribute("data-view", view);
    if (!root.hasAttribute("data-view-next") && document.body) {
      document.body.setAttribute("data-view", root.getAttribute("data-view") || view);
    }
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
    isolation: isolate;
  }
  body[data-view-next]::before {
    content: "";
    position: fixed;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    background: var(--apple-mobile-next-bg, #000000);
    opacity: var(--apple-wash-next-opacity, 0);
    transform: translate3d(0, 0, 0) scale(var(--apple-wash-scale, 1));
    transform-origin: 50% 0;
  }
  html.apple-wash-animating body[data-view-next]::before {
    transition: opacity 0.32s cubic-bezier(0.22, 0.61, 0.36, 1),
                transform 0.32s cubic-bezier(0.22, 0.61, 0.36, 1);
  }
  @media (prefers-reduced-motion: reduce) {
    body[data-view-next]::before { transition: opacity 0.01s linear !important; transform: none !important; }
  }
}
`;

  function installTransparency(root) {
    if (!root) return;
    const existing = root.getElementById
      ? root.getElementById(TRANSPARENCY_STYLE_ID)
      : root.querySelector?.("#" + TRANSPARENCY_STYLE_ID);
    if (existing) return;
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

  function ensureRootStyles() {
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
  }

  let raf = 0;
  const pending = new Set();
  function schedule(node = document) {
    if (node) pending.add(node);
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      ensureRootStyles();
      const roots = Array.from(pending);
      pending.clear();
      for (const root of roots) scan(root);
    });
  }

  function apply() {
    ensureRootStyles();
    scan(document);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", apply, { once: true });
  } else {
    apply();
  }
  window.addEventListener("location-changed", () => schedule(document));
  window.addEventListener("popstate", () => schedule(document));
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === 1) schedule(node);
      }
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
