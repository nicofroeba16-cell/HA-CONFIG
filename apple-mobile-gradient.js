/* Apple mobile gradient override — background only.
 * Codex mechanism: paint the gradient directly on body[data-view].
 */
(function () {
  const STYLE_ID = "apple-mobile-gradient";
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

  function apply() {
    if (!document.head) return;
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      document.head.appendChild(style);
    }
    if (style.textContent !== CSS) style.textContent = CSS;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", apply, { once: true });
  } else {
    apply();
  }
  window.addEventListener("location-changed", apply);
  window.addEventListener("popstate", apply);
})();
