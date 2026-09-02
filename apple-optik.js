/**
 * Apple Optik — ein Modul für Home Assistant
 * Resource: /local/apple-optik.js  (JavaScript-Modul)
 *
 * Enthält:
 *   - Theme / Mushroom / GPU-CSS
 *   - custom:ios-media-player
 *   - custom:ios-light-card
 *
 * Andere JS-Ressourcen (ios-media-player.js, ios-light-card.js) entfernen.
 */

/* ===== optik ===== */
(function () {
const VERSION = "1.9.23";
const STYLE_ID = "apple-optik";
const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";       // Apple default
const EASE_WASH = "cubic-bezier(0.22, 0.61, 0.36, 1)"; // Wash / View-Wechsel
const EASE_SPRING = "cubic-bezier(0.22, 1, 0.36, 1)";  // apple-in
const EASE_SNAP = "cubic-bezier(0.25, 0.1, 0.25, 1)";  // Scroll-Settle

const CSS = `
html {
  color-scheme: light dark;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: var(--apple-bg, #000);
  --lovelace-background: var(--apple-bg, #000000);
  --apple-ease: cubic-bezier(0.32, 0.72, 0, 1);
  --apple-ease-wash: cubic-bezier(0.22, 0.61, 0.36, 1);
  --apple-ease-snap: cubic-bezier(0.25, 0.1, 0.25, 1);
}

html[data-panel="dash"]::before,
html[data-panel="dash"]::after {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  transform-origin: 50% 0;
  background: linear-gradient(180deg, rgba(232,181,122,0.28) 0%, rgba(232,181,122,0.08) 42%, rgba(125,122,255,0.06) 100%), #000;
}
html[data-panel="dash"]::before {
  opacity: var(--apple-wash-cur-opacity, 1);
  -webkit-transform: translate3d(0, 0, 0);
  transform: translate3d(0, 0, 0);
}
html[data-panel="dash"]::after {
  opacity: var(--apple-wash-next-opacity, 0);
  -webkit-transform: translate3d(0, 0, 0) scale(var(--apple-wash-scale, 1));
  transform: translate3d(0, 0, 0) scale(var(--apple-wash-scale, 1));
}
html[data-panel="dash"].apple-wash-animating::before {
  transition: opacity 0.32s var(--apple-ease-wash, cubic-bezier(0.22, 0.61, 0.36, 1));
}
html[data-panel="dash"].apple-wash-animating::after {
  transition: opacity 0.32s var(--apple-ease-wash, cubic-bezier(0.22, 0.61, 0.36, 1));
}
@media (prefers-reduced-motion: no-preference) {
  html[data-panel="dash"].apple-wash-animating::after {
    transition: opacity 0.32s var(--apple-ease-wash, cubic-bezier(0.22, 0.61, 0.36, 1)),
                transform 0.32s var(--apple-ease-wash, cubic-bezier(0.22, 0.61, 0.36, 1)),
                -webkit-transform 0.32s var(--apple-ease-wash, cubic-bezier(0.22, 0.61, 0.36, 1));
  }
}
html[data-panel="dash"].apple-wash-animating::before,
html[data-panel="dash"].apple-wash-animating::after {
  will-change: opacity;
}

html[data-panel="dash"],
html[data-panel="dash"] body,
html[data-panel="dash"] home-assistant,
html[data-panel="dash"] ha-app-layout,
html[data-panel="dash"] ha-drawer,
html[data-panel="dash"] hui-root,
html[data-panel="dash"] hui-view,
html[data-panel="dash"] hui-sections-view,
html[data-panel="dash"] #view,
html[data-panel="dash"] hui-view-background {
  background: transparent !important;
  background-color: transparent !important;
}

html[data-panel="admin"],
html[data-panel="admin"] body,
html[data-panel="admin"] home-assistant,
html[data-panel="admin"] ha-app-layout,
html[data-panel="admin"] ha-drawer {
  background: var(--primary-background-color, #111) !important;
}

home-assistant, ha-app-layout, hui-view, hui-sections-view {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, sans-serif !important;
  color: var(--apple-label, #f5f5f7);
}

/* Per-View: Token-Wash. ::after = incoming (data-view-next), nur Opacity. */
html[data-view="haus"]::before,
html[data-view-next="haus"]::after {
  background: linear-gradient(180deg, rgba(232,181,122,0.28) 0%, rgba(232,181,122,0.08) 42%, rgba(125,122,255,0.06) 100%), #000;
}
html[data-view="mobilgeraete"]::before,
html[data-view-next="mobilgeraete"]::after {
  background: linear-gradient(180deg, rgba(100,210,255,0.26) 0%, rgba(100,210,255,0.08) 42%, rgba(125,122,255,0.06) 100%), #000;
}
html[data-view="nico-zimmer"]::before,
html[data-view-next="nico-zimmer"]::after {
  background: linear-gradient(180deg, rgba(125,122,255,0.28) 0%, rgba(125,122,255,0.08) 42%, rgba(232,181,122,0.06) 100%), #000;
}
html[data-view="medien"]::before,
html[data-view-next="medien"]::after {
  background: linear-gradient(180deg, rgba(100,210,255,0.28) 0%, rgba(100,210,255,0.08) 42%, rgba(232,181,122,0.06) 100%), #000;
}
html[data-view="system"]::before,
html[data-view-next="system"]::after {
  background: linear-gradient(180deg, rgba(142,142,147,0.24) 0%, rgba(142,142,147,0.08) 42%, rgba(232,181,122,0.05) 100%), #000;
}
html[data-view="system-warnungen"]::before,
html[data-view-next="system-warnungen"]::after {
  background: linear-gradient(180deg, rgba(255,105,97,0.28) 0%, rgba(255,105,97,0.08) 42%, rgba(232,181,122,0.05) 100%), #000;
}
html[data-view="timo-zimmer"]::before,
html[data-view-next="timo-zimmer"]::after {
  background: linear-gradient(180deg, rgba(48,219,91,0.26) 0%, rgba(48,219,91,0.08) 42%, rgba(232,181,122,0.05) 100%), #000;
}
html[data-view="huette"]::before,
html[data-view-next="huette"]::after {
  background: linear-gradient(180deg, rgba(255,179,64,0.28) 0%, rgba(255,179,64,0.08) 42%, rgba(232,181,122,0.05) 100%), #000;
}
html[data-view="aussenbereich"]::before,
html[data-view-next="aussenbereich"]::after {
  background: linear-gradient(180deg, rgba(48,219,91,0.26) 0%, rgba(48,219,91,0.08) 42%, rgba(64,203,224,0.06) 100%), #000;
}
html[data-view="erdgeschoss"]::before,
html[data-view-next="erdgeschoss"]::after {
  background: linear-gradient(180deg, rgba(64,203,224,0.26) 0%, rgba(64,203,224,0.08) 42%, rgba(125,122,255,0.06) 100%), #000;
}
html[data-view="mika-zimmer"]::before,
html[data-view-next="mika-zimmer"]::after {
  background: linear-gradient(180deg, rgba(10,132,255,0.28) 0%, rgba(10,132,255,0.08) 42%, rgba(232,181,122,0.06) 100%), #000;
}
html[data-view="juli-zimmer"]::before,
html[data-view-next="juli-zimmer"]::after {
  background: linear-gradient(180deg, rgba(255,55,95,0.42) 0%, rgba(255,55,95,0.16) 42%, rgba(255,55,95,0.04) 100%), #000;
}
html[data-view="flur"]::before,
html[data-view-next="flur"]::after {
  background: linear-gradient(180deg, rgba(142,142,147,0.24) 0%, rgba(142,142,147,0.08) 42%, rgba(232,181,122,0.05) 100%), #000;
}
html[data-view="wohnzimmer"]::before,
html[data-view-next="wohnzimmer"]::after {
  background: linear-gradient(180deg, rgba(232,181,122,0.28) 0%, rgba(232,181,122,0.08) 42%, rgba(125,122,255,0.06) 100%), #000;
}


hui-sections-view {
  --column-gap: 8px;
  --row-gap: 8px;
  padding-bottom: calc(224px + env(safe-area-inset-bottom, 0px)) !important;
}

/* GPU-Schicht: 3D-Transform erzwingt Compositor, kein Layout-Thrash */
ha-card {
  background: var(--ha-card-background, var(--apple-surface, #1C1C1E)) !important;
  border: 0.5px solid var(--apple-hairline, rgba(255, 255, 255, 0.14)) !important;
  border-radius: var(--ha-card-border-radius, 20px) !important;
  box-shadow: none !important;
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;
  -webkit-transform: translate3d(0, 0, 0);
  transform: translate3d(0, 0, 0);
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  contain: layout paint;
  transition: -webkit-transform 0.2s ${EASE}, transform 0.2s ${EASE};
}

hui-card {
  -webkit-transform: translate3d(0, 0, 0);
  transform: translate3d(0, 0, 0);
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  animation: apple-in 0.35s ${EASE_SPRING} both;
}

hui-card:nth-child(1) { animation-delay: 0.00s; }
hui-card:nth-child(2) { animation-delay: 0.03s; }
hui-card:nth-child(3) { animation-delay: 0.06s; }
hui-card:nth-child(4) { animation-delay: 0.09s; }
hui-card:nth-child(5) { animation-delay: 0.12s; }
hui-card:nth-child(n+6) { animation-delay: 0.15s; }

@keyframes apple-in {
  from {
    opacity: 0;
    -webkit-transform: translate3d(0, 6px, 0);
    transform: translate3d(0, 6px, 0);
  }
  to {
    opacity: 1;
    -webkit-transform: translate3d(0, 0, 0);
    transform: translate3d(0, 0, 0);
  }
}

@media (prefers-reduced-motion: no-preference) {
  ha-card:active,
  mushroom-template-card:active ha-card,
  mushroom-entity-card:active ha-card {
    -webkit-transform: scale(0.98) translate3d(0, 0, 0);
    transform: scale(0.98) translate3d(0, 0, 0);
  }
  mushroom-light-card:active ha-card,
  mushroom-chips-card mushroom-chip:active,
  mushroom-chip:active,
  ha-assist-chip:active {
    -webkit-transform: scale(0.97) translate3d(0, 0, 0);
    transform: scale(0.97) translate3d(0, 0, 0);
  }
  .navbar.mobile .button:active {
    -webkit-transform: scale(0.96) translate3d(0, 0, 0);
    transform: scale(0.96) translate3d(0, 0, 0);
  }
}

/* HIG: 44pt Tap */
mushroom-template-card,
mushroom-light-card,
mushroom-entity-card,
mushroom-person-card {
  --control-height: 44px;
  --icon-size: 30px;
  --icon-border-radius: 8px !important;
  --icon-symbol-size: 18px;
  --shape-color: rgb(var(--rgb-state, 10, 132, 255));
  --icon-color: #ffffff;
  --card-primary-font-size: 17px;
  --card-primary-font-weight: 600;
  --card-secondary-font-size: 13px;
  --card-primary-line-height: 1.2;
  --card-primary-color: var(--mush-card-primary-color, var(--apple-label, #f5f5f7));
  --card-secondary-color: var(--mush-card-secondary-color, var(--apple-secondary, #c7c7cc));
  --primary-text-color: var(--apple-label, #f5f5f7);
  --secondary-text-color: var(--apple-secondary, #c7c7cc);
}

mushroom-title-card {
  --title-font-size: 34px;
  --title-font-weight: 700;
  --title-padding: 20px 6px 8px;
  --title-color: var(--mush-title-color, var(--apple-label, #f5f5f7));
  --subtitle-font-size: 13px;
  --subtitle-font-weight: 500;
  --subtitle-color: var(--mush-subtitle-color, var(--apple-secondary, #c7c7cc));
}
mushroom-title-card ha-card:active {
  -webkit-transform: none;
  transform: none;
}

/* Large Title ist Text, keine Karte */
mushroom-title-card ha-card,
hui-card:has(mushroom-title-card) > ha-card {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  overflow: visible !important;
}

/* Now-Playing: eigene Fläche, HA-ha-card unsichtbar */
hui-card:has(ios-media-player) ha-card,
ios-media-player,
hui-card:has(ios-light-card) ha-card,
ios-light-card {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
  overflow: visible !important;
}

mushroom-chips-card ha-card {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

/*
 * iOS Settings-Kachel = Emoji-Farbwelt:
 * weiße Glyphe auf voller Systemfarbe, Squircle 8pt.
 * --rgb-state kommt von Mushroom icon_color (bereits iOS-Palette im Theme).
 */
mushroom-shape-icon {
  --shape-size: 30px;
  --icon-size: 18px;
  --icon-border-radius: 8px !important;
  --shape-color: rgb(var(--rgb-state, 10, 132, 255)) !important;
  --icon-color: #ffffff !important;
  --icon-symbol-size: 18px;
  border-radius: 8px !important;
  overflow: hidden;
}

/* Chrome: Liquid Glass, nicht verstecken (HIG: Material nur an der Leiste) */
app-header,
app-toolbar,
ha-top-app-bar,
ha-top-app-bar-fixed,
hui-view-header,
hui-header,
.header {
  display: block !important;
  height: auto !important;
  min-height: 44px !important;
  overflow: visible !important;
  background: rgba(28, 28, 30, 0.55) !important;
  -webkit-backdrop-filter: saturate(180%) blur(28px) !important;
  backdrop-filter: saturate(180%) blur(28px) !important;
  border-bottom: 0.5px solid rgba(255, 255, 255, 0.18) !important;
  box-shadow: none !important;
  color: var(--apple-label, #f5f5f7) !important;
}

/* Home-Screen-App (Safari standalone) — HA-Verwaltung bleibt in der Companion */
html.apple-app ha-sidebar,
html.apple-app notification-item-badge,
html.apple-app ha-button-menu.exit-edit-mode,
html.apple-app ha-button-menu[slot="actionItems"],
html.apple-app ha-icon-button[label="Seitenleiste"],
html.apple-app ha-icon-button[label="Sidebar"] {
  display: none !important;
}
html.apple-app ha-drawer {
  --mdc-drawer-width: 0px;
}
html.apple-app ha-drawer #drawer {
  display: none !important;
  width: 0 !important;
}

battery-state-card,
battery-state-card ha-card {
  background: var(--apple-surface, #1c1c1e) !important;
  border-radius: 20px !important;
  border: 0.5px solid var(--apple-hairline, rgba(255,255,255,0.14)) !important;
  --bsc-padding: 6px 10px;
  --bsc-name-font-size: 15px;
  --bsc-name-font-weight: 600;
  --bsc-percent-font-size: 15px;
  --bsc-icon-size: 22px;
  --bsc-height: 44px;
}

bar-card ha-card,
bar-card,
bar-card-card {
  background: var(--ha-card-background, var(--apple-surface, #1C1C1E)) !important;
  --ha-card-background: var(--apple-surface, #1C1C1E) !important;
  --bar-card-border-radius: 8px;
  --bar-card-color: var(--apple-surface, #1C1C1E);
}
bar-card .bar-card-backgroundbar,
bar-card-card .bar-card-backgroundbar {
  background: rgba(255, 255, 255, 0.12) !important;
}

mushroom-chips-card {
  --chip-background: var(--mush-chip-background, var(--apple-fill, rgba(118, 118, 128, 0.36)));
  --chip-height: 44px;
  --mush-chip-height: 44px;
  --md-assist-chip-container-height: 44px;
  --chip-border-radius: 22px;
  --chip-font-size: 13px;
  --chip-font-weight: 600;
  --chip-icon-size: 20px;
  --chip-padding: 0 14px;
  --chip-text-color: var(--mush-chip-text-color, var(--apple-label, #f5f5f7));
  --chip-icon-color: var(--mush-chip-icon-color, var(--apple-label, #f5f5f7));
}
mushroom-chips-card mushroom-chip,
mushroom-chip,
mushroom-chips-card ha-assist-chip,
ha-assist-chip,
mushroom-chips-card ha-chip,
ha-chip {
  height: 44px !important;
  min-height: 44px !important;
  min-width: 44px !important;
  box-sizing: border-box !important;
  padding: 0 14px !important;
  --chip-height: 44px;
  --mush-chip-height: 44px;
  --md-assist-chip-container-height: 44px;
  --chip-icon-size: 20px;
}

ha-control-slider, ha-bar-slider, mushroom-slider {
  --control-slider-border-radius: 100px;
  --control-slider-thickness: 8px;
}

/* Tab-Bar: HIG floating, GPU-Schicht, Blur nur hier */
.navbar.mobile ha-card,
ha-card.navbar-card.mobile,
ha-card.navbar-card.mobile.floating {
  background: rgba(28, 28, 30, 0.62) !important;
  -webkit-backdrop-filter: saturate(180%) blur(28px) !important;
  backdrop-filter: saturate(180%) blur(28px) !important;
  border: 0.5px solid rgba(255, 255, 255, 0.18) !important;
  border-radius: 28px !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28) !important;
  -webkit-transform: translate3d(0, 0, 0);
  transform: translate3d(0, 0, 0);
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
}

.navbar.mobile ha-card:active {
  -webkit-transform: translate3d(0, 0, 0);
  transform: translate3d(0, 0, 0);
}

.navbar.mobile .button {
  min-height: 44px !important;
  min-width: 44px !important;
  transition: -webkit-transform 0.2s ${EASE}, transform 0.2s ${EASE};
}
.navbar.mobile .button:active {
  -webkit-transform: translate3d(0, 0, 0);
  transform: translate3d(0, 0, 0);
}
.navbar.mobile .button.active {
  background: color-mix(in srgb, var(--apple-gold, #e8b57a) 22%, transparent) !important;
}
.navbar.mobile .icon.active,
.navbar.mobile .button.active .icon {
  color: var(--apple-gold, #e8b57a) !important;
}
.navbar.mobile .label {
  font-size: 12px !important;
  font-weight: 500 !important;
}

app-header, app-toolbar, ha-tabs {
  background: rgba(28, 28, 30, 0.55) !important;
  -webkit-backdrop-filter: saturate(180%) blur(28px) !important;
  backdrop-filter: saturate(180%) blur(28px) !important;
  border-bottom: 0.5px solid rgba(255, 255, 255, 0.18) !important;
  box-shadow: none !important;
  -webkit-transform: translate3d(0, 0, 0);
  transform: translate3d(0, 0, 0);
}

ha-dialog { --ha-dialog-border-radius: 28px; }

@media (prefers-reduced-motion: reduce) {
  hui-card {
    animation: none !important;
    -webkit-transform: none;
    transform: none;
  }
  html[data-panel="dash"]::before,
  html[data-panel="dash"]::after {
    transition: opacity 0.01s linear !important;
    -webkit-transform: translate3d(0, 0, 0) !important;
    transform: translate3d(0, 0, 0) !important;
  }
  ha-card,
  .btn,
  .iconbtn,
  .power,
  .navbar.mobile .button {
    transition: transform 0.01s linear, opacity 0.01s linear !important;
  }
}
@media (prefers-contrast: more) {
  html {
    --apple-gold: #F0C089;
    --apple-gold-dim: #E8B57A;
    --apple-secondary: #E5E5EA;
    --apple-tertiary: #C7C7CC;
    --apple-hairline: rgba(255, 255, 255, 0.42);
  }
  ha-card {
    border-color: rgba(255, 255, 255, 0.55) !important;
  }
  html[data-panel="dash"]::before { filter: saturate(0.7); }
  .navbar.mobile .button.active,
  .navbar.mobile .icon.active,
  .navbar.mobile .button.active .icon {
    color: #F0C089 !important;
  }
}
`;

const SHADOW_CSS = `
:host {
  --ha-card-border-radius: 20px;
  --ha-card-border-width: 0px;
  --ha-card-box-shadow: none;
  --icon-border-radius: 8px;
  --icon-color: #ffffff;
  --shape-color: rgb(var(--rgb-state, 10, 132, 255));
  color-scheme: light dark;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, sans-serif;
}
:host(hui-root),
:host(hui-view),
:host(hui-sections-view),
:host(hui-view-background),
hui-root,
hui-view,
hui-sections-view,
#view,
hui-view-background {
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
}
ha-card {
  background: var(--ha-card-background, var(--apple-surface, #1c1c1e)) !important;
  border: 0.5px solid var(--apple-hairline, rgba(255, 255, 255, 0.14)) !important;
  border-radius: var(--ha-card-border-radius, 20px) !important;
  box-shadow: none !important;
  -webkit-tap-highlight-color: transparent;
  -webkit-transform: translate3d(0, 0, 0);
  transform: translate3d(0, 0, 0);
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  transition: transform 0.2s cubic-bezier(0.32, 0.72, 0, 1);
}
.bar-card-backgroundbar {
  background: rgba(255, 255, 255, 0.12) !important;
}
.bar-card-card {
  background: var(--ha-card-background, var(--apple-surface, #1C1C1E)) !important;
}
.primary, .title, .name {
  font-weight: 600 !important;
  font-size: 17px !important;
  letter-spacing: -0.03em;
  color: var(--mush-card-primary-color, var(--apple-label, #f5f5f7)) !important;
}
.secondary, .label, .subtitle {
  color: var(--mush-card-secondary-color, var(--apple-secondary, #c7c7cc)) !important;
  font-size: 13px !important;
  font-weight: 500 !important;
}
.shape, mushroom-shape-icon {
  border-radius: 8px !important;
  --icon-border-radius: 8px !important;
  --icon-color: #ffffff !important;
  --icon-primary-color: #ffffff !important;
  --shape-color: rgb(var(--rgb-state, 10, 132, 255)) !important;
}
.shape {
  overflow: hidden;
}
ha-icon, ha-state-icon, .icon {
  color: #ffffff !important;
  --icon-primary-color: #ffffff !important;
}
.toolbar {
  background: #000 !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}
.button {
  min-height: 44px;
  transition: transform 0.2s cubic-bezier(0.32, 0.72, 0, 1);
}
@media (prefers-reduced-motion: no-preference) {
  .button:active { transform: scale(0.96) translate3d(0, 0, 0); }
}
.button.active, .icon.active { color: var(--apple-gold, #e8b57a) !important; }
`;

const SHAPE_CSS = `
:host {
  --icon-border-radius: 8px !important;
  --icon-color: #ffffff !important;
  --icon-primary-color: #ffffff !important;
  border-radius: 8px !important;
  overflow: hidden !important;
}
.shape, .container, .background {
  border-radius: 8px !important;
  overflow: hidden !important;
  background: rgb(var(--rgb-state, var(--rgb-icon, 10, 132, 255))) !important;
}
ha-state-icon, ha-icon, ha-svg-icon, .icon {
  color: #ffffff !important;
  --icon-primary-color: #ffffff !important;
  --mdc-theme-primary: #ffffff !important;
}
`;

const HEADER_CSS = `
:host(hui-view-header),
:host(ha-top-app-bar),
:host(ha-top-app-bar-fixed),
:host(hui-header),
:host(app-header),
hui-view-header,
ha-top-app-bar,
ha-top-app-bar-fixed,
hui-header,
app-header,
app-toolbar {
  display: block !important;
  height: auto !important;
  min-height: 44px !important;
  overflow: visible !important;
  pointer-events: auto !important;
  background: rgba(28, 28, 30, 0.55) !important;
  -webkit-backdrop-filter: saturate(180%) blur(28px) !important;
  backdrop-filter: saturate(180%) blur(28px) !important;
  border-bottom: 0.5px solid rgba(255, 255, 255, 0.18) !important;
  box-shadow: none !important;
}
`;

function applyStyle(root, css, id) {
  if (!root) return;
  let el = null;
  try {
    el = root.getElementById ? root.getElementById(id) : root.querySelector("#" + id);
  } catch (_e) {
    el = null;
  }
  if (el) {
    if (el.textContent !== css) el.textContent = css;
    return;
  }
  const style = document.createElement("style");
  style.id = id;
  style.textContent = css;
  if (root.nodeType === 11) root.appendChild(style);
  else if (root.head) root.head.appendChild(style);
  else root.appendChild(style);
}

const painted = new WeakSet();

function styleHost(node) {
  if (node.localName === "hui-view-background") {
    node.style.setProperty("background", "transparent", "important");
    node.style.setProperty("background-color", "transparent", "important");
    node.style.setProperty("background-image", "none", "important");
  }
  const sr = node.shadowRoot;
  if (!sr) return;
  if (!painted.has(sr)) {
    applyStyle(sr, SHADOW_CSS, STYLE_ID);
    painted.add(sr);
  }
  if (node.localName === "mushroom-shape-icon") {
    applyStyle(sr, SHAPE_CSS, STYLE_ID + "-shape");
  }
  if (
    node.localName === "hui-view" ||
    node.localName === "hui-view-header" ||
    node.localName === "ha-top-app-bar" ||
    node.localName === "ha-top-app-bar-fixed" ||
    node.localName === "hui-header" ||
    node.localName === "ha-panel-lovelace" ||
    node.localName === "home-assistant-main" ||
    node.localName === "app-header"
  ) {
    applyStyle(sr, HEADER_CSS, STYLE_ID + "-hdr");
  }
}

function walk(node) {
  if (!node || node.nodeType !== 1) return;
  styleHost(node);
  const sr = node.shadowRoot;
  if (sr && !painted.has(node)) {
    sr.querySelectorAll("*").forEach(walk);
  } else if (sr) {
    sr.querySelectorAll("*").forEach((el) => {
      if (!painted.has(el) || (el.shadowRoot && !painted.has(el.shadowRoot))) walk(el);
    });
  }
  painted.add(node);
}

let raf = 0;
function paint() {
  raf = 0;
  applyStyle(document, CSS, STYLE_ID + "-root");
  const ha = document.querySelector("home-assistant");
  if (ha) walk(ha);
  else if (document.body) walk(document.body);
}

function schedule() {
  if (raf) return;
  raf = window.requestAnimationFrame(paint);
}

function isStandaloneApp() {
  try {
    if (window.navigator && window.navigator.standalone === true) return true;
    if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) return true;
    if (window.matchMedia && window.matchMedia("(display-mode: fullscreen)").matches) return true;
    const ua = String((window.navigator && window.navigator.userAgent) || "");
    if (ua.indexOf("ZuhauseApp") !== -1) return true;
  } catch (_e) {}
  return false;
}

function markAppShell() {
  const root = document.documentElement;
  if (isStandaloneApp()) root.classList.add("apple-app");
  else root.classList.remove("apple-app");
  const title = "Zuhause";
  if (!document.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
    const m = document.createElement("meta");
    m.name = "apple-mobile-web-app-capable";
    m.content = "yes";
    document.head.appendChild(m);
  }
  let t = document.querySelector('meta[name="apple-mobile-web-app-title"]');
  if (!t) {
    t = document.createElement("meta");
    t.name = "apple-mobile-web-app-title";
    t.content = title;
    document.head.appendChild(t);
  } else {
    t.content = title;
  }
  let st = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
  if (!st) {
    st = document.createElement("meta");
    st.name = "apple-mobile-web-app-status-bar-style";
    st.content = "black-translucent";
    document.head.appendChild(st);
  }
  if (!document.querySelector('link[rel="apple-touch-icon"][data-apple-optik]')) {
    const l = document.createElement("link");
    l.rel = "apple-touch-icon";
    l.setAttribute("data-apple-optik", "1");
    l.href = "/local/zuhause-icon.png";
    document.head.appendChild(l);
  }
}

function boot() {
  document.documentElement.style.colorScheme = "dark";
  markAppShell();
  paint();
  const obs = new MutationObserver((muts) => {
    for (const m of muts) {
      for (const n of m.addedNodes) {
        if (n.nodeType === 1) walk(n);
      }
    }
  });
  obs.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("location-changed", schedule);
  window.addEventListener("popstate", schedule);
  console.info(
    `%c Apple Optik %c v${VERSION} GPU `,
    "background:#1c1c1e;color:#e0a96d;font-weight:700;padding:2px 6px;border-radius:4px 0 0 4px",
    "background:#e0a96d;color:#1c1c1e;padding:2px 6px;border-radius:0 4px 4px 0",
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}

customElements.whenDefined("home-assistant").then(schedule);
customElements.whenDefined("hui-view").then(schedule);
customElements.whenDefined("hui-view-background").then(schedule);

})();

/* ===== media-player ===== */
(function () {
const VERSION = "1.5.0";

const FEAT = {
  PAUSE: 1,
  SEEK: 2,
  VOLUME_SET: 4,
  VOLUME_MUTE: 8,
  PREVIOUS: 16,
  NEXT: 32,
  TURN_ON: 128,
  TURN_OFF: 256,
  PLAY: 16384,
};

const APP_TILE = [
  { test: /youtube/, bg: "#FF453A", letter: "Y" },
  { test: /netflix/, bg: "#E50914", letter: "N" },
  { test: /disney/, bg: "#0A84FF", letter: "D" },
  { test: /prime|amazon/, bg: "#00A8E1", letter: "P" },
  { test: /spotify/, bg: "#30D158", letter: "S" },
  { test: /apple\s*tv|tvplus|tv\+/, bg: "#E8B57A", letter: "A" },
  { test: /playStation|playstation|ps5|ps4/, bg: "#0070D1", letter: "P" },
];

const SVG = {
  airplay: `<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M6.2 10.2a7.2 7.2 0 0 1 11.6 0"/><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M8.4 12.6a4.4 4.4 0 0 1 7.2 0"/><path fill="currentColor" d="M12 14.8l5.4 5.2H6.6z"/></svg>`,
  prev: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M6 6h2.2v12H6V6zm3.2 6 9.8 6.2V5.8L9.2 12z"/></svg>`,
  next: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M15.8 6H18v12h-2.2V6zM5 5.8v12.4L14.8 12 5 5.8z"/></svg>`,
  play: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M8 5.5v13l11-6.5L8 5.5z"/></svg>`,
  pause: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M6.5 5h4v14h-4V5zm7 0h4v14h-4V5z"/></svg>`,
  power: `<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M12 3v8"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M7.2 6.4a7 7 0 1 0 9.6 0"/></svg>`,
};

const CSS = `
:host { display: block; }
.wrap {
  box-sizing: border-box;
  border-radius: 20px;
  background: var(--apple-surface, #1c1c1e);
  border: 0.5px solid var(--apple-hairline, rgba(255,255,255,0.14));
  padding: 10px 12px;
  color: var(--apple-label, #f5f5f7);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, sans-serif;
  -webkit-tap-highlight-color: transparent;
  -webkit-transform: translate3d(0,0,0);
  transform: translate3d(0,0,0);
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  overflow: hidden;
  transition: transform 0.2s cubic-bezier(0.32, 0.72, 0, 1);
}
@media (prefers-reduced-motion: no-preference) {
  .wrap:active {
    -webkit-transform: scale(0.97) translate3d(0,0,0);
    transform: scale(0.97) translate3d(0,0,0);
  }
}
@media (prefers-reduced-motion: reduce) {
  .wrap { transition: transform 0.01s linear; }
}
.wrap.idle {
  height: 64px;
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 4px;
}
.wrap.on {
  height: 128px;
  display: grid;
  grid-template-columns: 84px 1fr auto;
  grid-template-rows: 20px 16px 40px 32px;
  column-gap: 12px;
  row-gap: 2px;
}
.wrap.on.has-vol { height: 156px; grid-template-rows: 20px 16px 40px 32px 28px; }
.wrap.receiver {
  height: 92px;
  display: grid;
  grid-template-columns: 1fr auto auto;
  grid-template-rows: 36px 32px;
  align-items: center;
  gap: 0 8px;
  padding: 10px 12px 8px;
  overflow: hidden;
}
.wrap.idle .art,
.wrap.idle .prog,
.wrap.idle .row,
.wrap.idle .volrow,
.wrap.receiver .art,
.wrap.receiver .prog,
.wrap.receiver .row,
.wrap.on .power { display: none; }
.wrap.receiver .mid { grid-column: 1; grid-row: 1; }
.wrap.receiver .power { grid-column: 2; grid-row: 1; }
.wrap.receiver .cast { grid-column: 3; grid-row: 1; }
.wrap.receiver .volrow {
  display: grid;
  grid-column: 1 / 4;
  grid-row: 2;
  grid-template-columns: 1fr 36px;
  align-items: center;
  gap: 8px;
}
.wrap.receiver:not(.has-vol) { height: 64px; padding-bottom: 10px; }
.wrap.receiver:not(.has-vol) .volrow { display: none; }
.art {
  grid-column: 1;
  grid-row: 1 / span 5;
  width: 84px;
  height: 84px;
  border-radius: 14px;
  overflow: hidden;
  position: relative;
  align-self: center;
  background: var(--apple-surface, #1c1c1e);
}
.art img { width: 100%; height: 100%; object-fit: cover; display: block; }
.art img.off { display: none; }
.ph {
  position: absolute; inset: 0;
  display: grid; place-items: center;
  font-size: 28px; font-weight: 700; color: #fff;
}
.art.has-pic .ph { display: none; }
.mid { min-width: 0; }
.wrap.idle .mid { grid-column: 1; }
.wrap.on .mid { grid-column: 2; grid-row: 1 / span 2; }
.title {
  font-size: 15px; font-weight: 600; letter-spacing: -0.02em;
  color: var(--apple-tertiary, #8e8e93);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.title.on { color: var(--apple-label, #f5f5f7); }
.artist {
  margin-top: 1px; font-size: 13px; font-weight: 500;
  color: var(--apple-secondary, #c7c7cc);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.iconbtn {
  width: 44px; height: 44px; border: 0; padding: 0; cursor: pointer;
  border-radius: 22px; background: var(--apple-fill, rgba(118,118,128,0.36));
  color: var(--apple-label, #f5f5f7);
  display: grid; place-items: center;
}
.iconbtn svg { width: 16px; height: 16px; }
.wrap.idle .cast, .wrap.idle .power { justify-self: end; }
.wrap.on .cast { grid-column: 3; grid-row: 1; justify-self: end; align-self: start; }
.prog {
  grid-column: 2 / 4;
  grid-row: 3;
  display: grid;
  grid-template-rows: 18px 16px;
  align-items: center;
  min-width: 0;
}
.prog.off { display: none; }
.seek {
  width: 100%;
  height: 18px;
  margin: 0;
  --seek-fill: 0%;
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  touch-action: none;
}
.seek::-webkit-slider-runnable-track {
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(
    to right,
    var(--apple-gold, #e8b57a) 0%,
    var(--apple-gold, #e8b57a) var(--seek-fill),
    rgba(255, 255, 255, 0.36) var(--seek-fill),
    rgba(255, 255, 255, 0.36) 100%
  );
}
.seek::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  margin-top: -5px;
  border-radius: 50%;
  background: #f5f5f7;
  border: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
}
.seek:disabled::-webkit-slider-thumb { opacity: 0; width: 0; }
.times {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  font-weight: 500;
  color: var(--apple-tertiary, #8e8e93);
}
.row {
  grid-column: 2 / 4;
  grid-row: 4;
  display: flex; align-items: center; justify-content: flex-end; gap: 2px;
}
.btn {
  background: none; border: 0; color: var(--apple-tertiary, #8e8e93);
  width: 40px; height: 36px; display: grid; place-items: center;
  padding: 0; cursor: pointer;
  transition: transform 0.18s cubic-bezier(0.32, 0.72, 0, 1);
}
.btn svg { width: 20px; height: 20px; }
.btn.play { color: var(--apple-label, #f5f5f7); }
.btn.play svg { width: 24px; height: 24px; }
@media (prefers-reduced-motion: no-preference) {
  .btn:active { transform: scale(0.88); }
}
.btn[hidden],
.iconbtn[hidden] { display: none !important; }
.volrow {
  grid-column: 2 / 4;
  grid-row: 5;
  display: grid;
  grid-template-columns: 1fr 36px;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.voln {
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--apple-secondary, #c7c7cc);
  text-align: right;
}
.vol {
  width: 100%;
  height: 32px;
  margin: 0;
  --vol-fill: 0%;
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  touch-action: none;
}
.vol::-webkit-slider-runnable-track {
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(
    to right,
    var(--apple-gold, #e8b57a) 0%,
    var(--apple-gold, #e8b57a) var(--vol-fill),
    rgba(255, 255, 255, 0.36) var(--vol-fill),
    rgba(255, 255, 255, 0.36) 100%
  );
}
.vol::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 22px;
  height: 22px;
  margin-top: -8px;
  border-radius: 50%;
  background: #f5f5f7;
  border: 0;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.45);
}
.vol::-moz-range-track {
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.36);
}
.vol::-moz-range-progress {
  height: 6px;
  border-radius: 3px;
  background: var(--apple-gold, #e8b57a);
}
.vol::-moz-range-thumb {
  width: 22px;
  height: 22px;
  border: 0;
  border-radius: 50%;
  background: #f5f5f7;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.45);
}
.wrap.on:not(.has-vol) .volrow { display: none; }
.wrap.on.has-vol .art { grid-row: 1 / span 5; }
`;

function fmtTime(s) {
  s = Math.max(0, Math.floor(Number(s) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function bindRange(el, { live, end }) {
  const stop = (e) => e.stopPropagation();
  el.addEventListener("pointerdown", (e) => {
    stop(e);
    el._drag = true;
    try {
      el.setPointerCapture(e.pointerId);
    } catch (_e) {}
  });
  const finish = (e) => {
    stop(e);
    el._drag = false;
    end?.(Number(el.value));
  };
  el.addEventListener("pointerup", finish);
  el.addEventListener("pointercancel", () => {
    el._drag = false;
  });
  el.addEventListener("touchstart", stop, { passive: true });
  el.addEventListener("touchmove", stop, { passive: true });
  el.addEventListener("input", () => live?.(Number(el.value)));
}

function hasFeat(st, bit) {
  return !!(Number(st?.attributes?.supported_features || 0) & bit);
}

function appTile(app, name) {
  const n = `${app || ""} ${name || ""}`.toLowerCase();
  for (const row of APP_TILE) {
    if (row.test.test(n)) return row;
  }
  const letter = (app || name || "M").trim().charAt(0).toUpperCase() || "M";
  return { bg: "#3A3A3C", letter };
}

function picUrl(st, hass) {
  const a = st?.attributes || {};
  const p = a.entity_picture || a.entity_picture_local || a.media_image_url || "";
  if (!p) return "";
  if (p.startsWith("http") || p.startsWith("data:") || p.startsWith("/")) return p;
  try {
    return hass.hassUrl(p);
  } catch (_e) {
    return p;
  }
}

function progress(st) {
  const a = st?.attributes || {};
  const dur = Number(a.media_duration) || 0;
  if (!(dur > 0)) return { pos: 0, dur: 0, pct: 0 };
  let pos = Number(a.media_position) || 0;
  const upd = a.media_position_updated_at;
  if (st.state === "playing" && upd) {
    const t = Date.parse(upd);
    if (!Number.isNaN(t)) pos += (Date.now() - t) / 1000;
  }
  pos = Math.max(0, Math.min(pos, dur));
  return { pos, dur, pct: pos / dur };
}

function idleLabel(st) {
  const s = st?.state;
  if (!st || s === "off" || s === "unavailable" || s === "unknown") return "Aus";
  if (s === "idle" || s === "standby") return "Bereit";
  return st.attributes?.source || s || "";
}

class IosMediaPlayer extends HTMLElement {
  static getStubConfig() {
    return { entity: "media_player.schlafzimmer" };
  }

  setConfig(config) {
    if (!config || !config.entity) throw new Error("entity ist Pflicht");
    this._config = config;
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    return 2;
  }

  disconnectedCallback() {
    this._stopBar();
  }

  _st() {
    return this._hass?.states?.[this._config.entity];
  }

  _volSt() {
    const id = this._config.volume_entity;
    return id ? this._hass?.states?.[id] : this._st();
  }

  _call(service, data) {
    if (!this._hass || !this._config) return;
    const vol = ["volume_set", "volume_up", "volume_down", "volume_mute"];
    const entity_id =
      vol.includes(service) && this._config.volume_entity
        ? this._config.volume_entity
        : this._config.entity;
    this._hass.callService("media_player", service, { entity_id, ...data });
  }

  _more() {
    this.dispatchEvent(
      new CustomEvent("hass-more-info", {
        bubbles: true,
        composed: true,
        detail: { entityId: this._config.entity },
      }),
    );
  }

  _stopBar() {
    if (this._raf) {
      cancelAnimationFrame(this._raf);
      this._raf = 0;
    }
  }

  _paintProg(st) {
    const { pos, dur, pct } = progress(st);
    if (this._t0) this._t0.textContent = fmtTime(pos);
    if (this._t1) this._t1.textContent = fmtTime(dur);
    if (this._prog) this._prog.classList.toggle("off", !(dur > 0));
    if (this._seek && !this._seek._drag) {
      this._seek.value = String(pct);
      this._seek.style.setProperty("--seek-fill", `${Math.round(pct * 1000) / 10}%`);
    }
  }

  _runBar() {
    this._stopBar();
    const step = () => {
      const st = this._st();
      if (!st || st.state !== "playing") {
        this._stopBar();
        return;
      }
      this._paintProg(st);
      this._raf = requestAnimationFrame(step);
    };
    this._raf = requestAnimationFrame(step);
  }

  _ensure() {
    if (this._root) return;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `<style>${CSS}</style>
      <div class="wrap idle">
        <div class="art">
          <div class="ph">M</div>
          <img alt="">
        </div>
        <div class="mid">
          <div class="title">--</div>
          <div class="artist"></div>
        </div>
        <button class="iconbtn power" type="button" aria-label="Power">${SVG.power}</button>
        <button class="iconbtn cast" type="button" aria-label="Quelle">${SVG.airplay}</button>
        <div class="prog off">
          <input class="seek" type="range" min="0" max="1" step="0.001" value="0">
          <div class="times"><span class="t0">0:00</span><span class="t1">0:00</span></div>
        </div>
        <div class="row">
          <button class="btn prev" type="button" aria-label="Zurück">${SVG.prev}</button>
          <button class="btn play" type="button" aria-label="Play">${SVG.play}</button>
          <button class="btn next" type="button" aria-label="Weiter">${SVG.next}</button>
        </div>
        <div class="volrow">
          <input class="vol" type="range" min="0" max="1" step="0.01" value="0">
          <span class="voln">0</span>
        </div>
      </div>`;
    this._root = this.shadowRoot.querySelector(".wrap");
    this._art = this.shadowRoot.querySelector(".art");
    this._img = this.shadowRoot.querySelector(".art img");
    this._ph = this.shadowRoot.querySelector(".ph");
    this._title = this.shadowRoot.querySelector(".title");
    this._artist = this.shadowRoot.querySelector(".artist");
    this._play = this.shadowRoot.querySelector(".play");
    this._prev = this.shadowRoot.querySelector(".prev");
    this._next = this.shadowRoot.querySelector(".next");
    this._prog = this.shadowRoot.querySelector(".prog");
    this._seek = this.shadowRoot.querySelector(".seek");
    this._t0 = this.shadowRoot.querySelector(".t0");
    this._t1 = this.shadowRoot.querySelector(".t1");
    this._vol = this.shadowRoot.querySelector(".vol");
    this._voln = this.shadowRoot.querySelector(".voln");
    this._power = this.shadowRoot.querySelector(".power");
    this._img.addEventListener("error", () => {
      this._img.classList.add("off");
      this._art.classList.remove("has-pic");
    });
    this.shadowRoot.querySelector(".cast").addEventListener("click", () => this._more());
    this._art.addEventListener("click", () => this._more());
    this._power.addEventListener("click", (e) => {
      e.stopPropagation();
      const st = this._st();
      if (!st) return;
      if (st.state === "off") this._call("turn_on");
      else this._call("turn_off");
    });
    this._prev.addEventListener("click", (e) => {
      e.stopPropagation();
      this._call("media_previous_track");
    });
    this._next.addEventListener("click", (e) => {
      e.stopPropagation();
      this._call("media_next_track");
    });
    this._play.addEventListener("click", (e) => {
      e.stopPropagation();
      this._call("media_play_pause");
    });
    let vt = 0;
    const setVolUi = (v) => {
      this._vol.style.setProperty("--vol-fill", `${Math.round(v * 1000) / 10}%`);
      if (this._voln) this._voln.textContent = String(Math.round(v * 100));
    };
    bindRange(this._vol, {
      live: (v) => {
        setVolUi(v);
        clearTimeout(vt);
        vt = setTimeout(() => this._call("volume_set", { volume_level: v }), 50);
      },
      end: (v) => {
        clearTimeout(vt);
        this._call("volume_set", { volume_level: v });
      },
    });
    bindRange(this._seek, {
      live: (v) => {
        this._seek.style.setProperty("--seek-fill", `${Math.round(v * 1000) / 10}%`);
        const st = this._st();
        const dur = Number(st?.attributes?.media_duration) || 0;
        if (this._t0) this._t0.textContent = fmtTime(v * dur);
      },
      end: (v) => {
        const st = this._st();
        const dur = Number(st?.attributes?.media_duration) || 0;
        if (dur > 0 && hasFeat(st, FEAT.SEEK)) {
          this._call("media_seek", { seek_position: v * dur });
        }
      },
    });
  }

  _render() {
    this._ensure();
    const st = this._st();
    const name = this._config.name || st?.attributes?.friendly_name || "Player";
    const receiver = this._config.role === "receiver";
    const idle = !st || ["off", "idle", "standby", "unavailable", "unknown"].includes(st.state);
    const playing = st?.state === "playing";
    const app = st?.attributes?.app_name || "";
    const tile = appTile(app, name);
    const pic = idle || receiver ? "" : picUrl(st, this._hass);
    const volSt = this._volSt();
    const allowVol =
      this._config.volume !== false && hasFeat(volSt, FEAT.VOLUME_SET);
    const volOn = allowVol && !receiver && !idle;
    const { pos, dur, pct } = st && !idle && !receiver ? progress(st) : { pos: 0, dur: 0, pct: 0 };

    this._root.classList.toggle("idle", idle && !receiver);
    this._root.classList.toggle("on", !idle && !receiver);
    this._root.classList.toggle("receiver", receiver);
    this._root.classList.toggle("has-vol", volOn);

    let title;
    let artist;
    if (receiver) {
      title = name;
      artist = idle ? idleLabel(st) : st.attributes.source || st.attributes.media_title || "";
    } else if (idle) {
      title = name;
      artist = idleLabel(st);
    } else {
      title = st.attributes.media_title || app || name;
      artist = st.attributes.media_artist || st.attributes.media_series_title || app || "";
    }

    this._title.textContent = title || "--";
    this._title.classList.toggle("on", !idle);
    this._artist.textContent = artist;

    this._ph.textContent = tile.letter;
    this._ph.style.background = tile.bg;
    if (pic) {
      if (this._img.getAttribute("src") !== pic) {
        this._img.classList.remove("off");
        this._img.src = pic;
      }
      this._art.classList.add("has-pic");
    } else {
      this._img.removeAttribute("src");
      this._img.classList.add("off");
      this._art.classList.remove("has-pic");
    }

    const canPlay = !idle && !receiver && (hasFeat(st, FEAT.PLAY) || hasFeat(st, FEAT.PAUSE));
    this._play.hidden = !canPlay;
    this._play.innerHTML = playing ? SVG.pause : SVG.play;
    this._play.setAttribute("aria-label", playing ? "Pause" : "Play");
    this._prev.hidden = idle || receiver || !hasFeat(st, FEAT.PREVIOUS);
    this._next.hidden = idle || receiver || !hasFeat(st, FEAT.NEXT);

    if (receiver) {
      this._power.hidden = !st || st.state !== "off";
    } else {
      this._power.hidden = !idle;
    }

    this._prog.classList.toggle("off", idle || receiver || !(dur > 0));
    if (this._seek) {
      this._seek.disabled = !hasFeat(st, FEAT.SEEK);
      if (!this._seek._drag) {
        this._seek.value = String(pct);
        this._seek.style.setProperty("--seek-fill", `${Math.round(pct * 1000) / 10}%`);
      }
    }
    if (this._t0) this._t0.textContent = fmtTime(pos);
    if (this._t1) this._t1.textContent = fmtTime(dur);
    if (playing && dur > 0) this._runBar();
    else this._stopBar();

    if (volOn) {
      const v = Number(volSt?.attributes?.volume_level);
      if (!Number.isNaN(v) && !this._vol._drag) {
        this._vol.value = String(v);
        this._vol.style.setProperty("--vol-fill", `${Math.round(v * 1000) / 10}%`);
        if (this._voln) this._voln.textContent = String(Math.round(v * 100));
      }
    }
  }
}

if (!customElements.get("ios-media-player")) {
  customElements.define("ios-media-player", IosMediaPlayer);
}
window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === "ios-media-player")) {
  window.customCards.push({
    type: "ios-media-player",
    name: "iOS Media Player",
    description: "Now Playing Stufe 1",
  });
}
console.info(
  `%c iOS Media %c v${VERSION} `,
  "background:#2c2c2e;color:#fff;font-weight:700;padding:2px 6px;border-radius:4px 0 0 4px",
  "background:#e8b57a;color:#1c1c1e;padding:2px 6px;border-radius:0 4px 4px 0",
);

})();

/* ===== light-card ===== */
(function () {
const VERSION = "1.0.0";
const YELLOW = "#FFD60A";
const INK = "#1C1C1E";
const WHITE = "#F5F5F7";

const BULB = `<svg viewBox="0 0 24 24" aria-hidden="true">
  <path fill="currentColor" d="M9 21h6v1.2c0 .4-.4.8-.8.8h-4.4c-.4 0-.8-.4-.8-.8V21zm3-19a6.5 6.5 0 0 0-3.6 11.9c.5.4.9 1 .9 1.6V17h5.4v-1.5c0-.6.4-1.2.9-1.6A6.5 6.5 0 0 0 12 2z"/>
</svg>`;

const CSS = `
:host { display: block; }
.wrap {
  box-sizing: border-box;
  border-radius: 20px;
  background: var(--apple-surface, #1c1c1e);
  border: 0.5px solid var(--apple-hairline, rgba(255,255,255,0.14));
  padding: 10px 12px;
  color: var(--apple-label, #f5f5f7);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, sans-serif;
  -webkit-tap-highlight-color: transparent;
  -webkit-transform: translate3d(0,0,0);
  transform: translate3d(0,0,0);
  overflow: hidden;
  transition: transform 0.2s cubic-bezier(0.32, 0.72, 0, 1);
}
@media (prefers-reduced-motion: no-preference) {
  .wrap:active {
    -webkit-transform: scale(0.97) translate3d(0,0,0);
    transform: scale(0.97) translate3d(0,0,0);
  }
}
@media (prefers-reduced-motion: reduce) {
  .wrap { transition: transform 0.01s linear; }
}
.wrap.off {
  height: 64px;
  display: grid;
  grid-template-columns: 36px 1fr auto;
  align-items: center;
  gap: 10px;
}
.wrap.on {
  height: 92px;
  display: grid;
  grid-template-columns: 36px 1fr;
  grid-template-rows: 36px 32px;
  column-gap: 10px;
  row-gap: 4px;
  padding: 10px 12px 8px;
}
.wrap.off .bri, .wrap.on .power { display: none; }
.tile {
  width: 36px; height: 36px; border-radius: 8px;
  display: grid; place-items: center;
  background: #3a3a3c;
  color: ${WHITE};
  cursor: pointer;
}
.tile svg { width: 20px; height: 20px; }
.wrap.on .tile { grid-row: 1; }
.mid { min-width: 0; }
.wrap.on .mid { grid-column: 2; grid-row: 1; align-self: center; }
.name {
  font-size: 15px; font-weight: 600; letter-spacing: -0.02em;
  color: var(--apple-label, #f5f5f7);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.sub {
  margin-top: 1px; font-size: 13px; font-weight: 500;
  color: var(--apple-secondary, #c7c7cc);
}
.power {
  width: 44px; height: 44px; border: 0; padding: 0; cursor: pointer;
  border-radius: 22px; background: var(--apple-fill, rgba(118,118,128,0.36));
  color: var(--apple-label, #f5f5f7);
  display: grid; place-items: center;
}
.power svg { width: 16px; height: 16px; }
.bri {
  grid-column: 1 / 3;
  grid-row: 2;
  width: 100%;
  height: 32px;
  margin: 0;
  --fill: 0%;
  --track: var(--apple-light, ${YELLOW});
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  touch-action: none;
}
.bri::-webkit-slider-runnable-track {
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(
    to right,
    var(--track) 0%,
    var(--track) var(--fill),
    rgba(255,255,255,0.36) var(--fill),
    rgba(255,255,255,0.36) 100%
  );
}
.bri::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 22px; height: 22px; margin-top: -8px;
  border-radius: 50%;
  background: ${WHITE};
  border: 1px solid ${INK};
  box-shadow: 0 1px 4px rgba(0,0,0,0.45);
}
.bri::-moz-range-track {
  height: 6px; border-radius: 3px; background: rgba(255,255,255,0.36);
}
.bri::-moz-range-progress {
  height: 6px; border-radius: 3px; background: var(--track);
}
.bri::-moz-range-thumb {
  width: 22px; height: 22px; border: 1px solid ${INK};
  border-radius: 50%; background: ${WHITE};
}
`;

const POWER = `<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M12 3v8"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M7.2 6.4a7 7 0 1 0 9.6 0"/></svg>`;

function lum(r, g, b) {
  const f = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function parseCssColor(hex) {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function tileColors(st, cssYellow) {
  const on = st?.state === "on";
  if (!on) return { bg: "#3A3A3C", fg: WHITE };
  let rgb = st.attributes.rgb_color;
  if (!Array.isArray(rgb) || rgb.length < 3) rgb = parseCssColor(cssYellow || YELLOW);
  const [r, g, b] = rgb;
  const nearWhite = r > 220 && g > 220 && b > 220;
  if (nearWhite) rgb = parseCssColor(cssYellow || YELLOW);
  const bg = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
  const fg = lum(rgb[0], rgb[1], rgb[2]) > 0.4 ? INK : WHITE;
  return { bg, fg, rgb };
}

function hasBrightness(st) {
  if (!st || !String(st.entity_id || "").startsWith("light.")) return false;
  const modes = st.attributes.supported_color_modes;
  if (Array.isArray(modes) && modes.length) {
    return modes.some((m) => m !== "onoff" && m !== "unknown");
  }
  if (st.attributes.brightness != null) return true;
  return !!(Number(st.attributes.supported_features || 0) & 1);
}

function bindRange(el, { live, end }) {
  const stop = (e) => e.stopPropagation();
  el.addEventListener("pointerdown", (e) => {
    stop(e);
    el._drag = true;
    try {
      el.setPointerCapture(e.pointerId);
    } catch (_e) {}
  });
  el.addEventListener("pointerup", (e) => {
    stop(e);
    el._drag = false;
    end?.(Number(el.value));
  });
  el.addEventListener("pointercancel", () => {
    el._drag = false;
  });
  el.addEventListener("touchstart", stop, { passive: true });
  el.addEventListener("touchmove", stop, { passive: true });
  el.addEventListener("input", () => live?.(Number(el.value)));
}

class IosLightCard extends HTMLElement {
  static getStubConfig() {
    return { entity: "light.schlafzimmer" };
  }

  setConfig(config) {
    if (!config || !config.entity) throw new Error("entity ist Pflicht");
    this._config = config;
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    return 2;
  }

  _st() {
    return this._hass?.states?.[this._config.entity];
  }

  _call(service, data) {
    const domain = (this._config.entity || "light.x").split(".")[0];
    const payload = { entity_id: this._config.entity, ...(data || {}) };
    if (domain !== "light") delete payload.brightness;
    this._hass?.callService(domain, service, payload);
  }

  _more() {
    this.dispatchEvent(
      new CustomEvent("hass-more-info", {
        bubbles: true,
        composed: true,
        detail: { entityId: this._config.entity },
      }),
    );
  }

  _yellow() {
    const s = getComputedStyle(document.documentElement);
    return s.getPropertyValue("--apple-light").trim() || YELLOW;
  }

  _ensure() {
    if (this._root) return;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `<style>${CSS}</style>
      <div class="wrap off">
        <div class="tile">${BULB}</div>
        <div class="mid">
          <div class="name"></div>
          <div class="sub"></div>
        </div>
        <button class="power" type="button" aria-label="Power">${POWER}</button>
        <input class="bri" type="range" min="1" max="255" step="1" value="128">
      </div>`;
    this._root = this.shadowRoot.querySelector(".wrap");
    this._tile = this.shadowRoot.querySelector(".tile");
    this._name = this.shadowRoot.querySelector(".name");
    this._sub = this.shadowRoot.querySelector(".sub");
    this._bri = this.shadowRoot.querySelector(".bri");
    this._tile.addEventListener("click", (e) => {
      e.stopPropagation();
      this._more();
    });
    this.shadowRoot.querySelector(".power").addEventListener("click", (e) => {
      e.stopPropagation();
      this._call("toggle");
    });
    let t = 0;
    bindRange(this._bri, {
      live: (v) => {
        this._bri.style.setProperty("--fill", `${Math.round((v / 255) * 1000) / 10}%`);
        this._sub.textContent = `${Math.round((v / 255) * 100)} %`;
        clearTimeout(t);
        t = setTimeout(() => this._call("turn_on", { brightness: v }), 50);
      },
      end: (v) => {
        clearTimeout(t);
        this._call("turn_on", { brightness: v });
      },
    });
  }

  _render() {
    this._ensure();
    const st = this._st();
    const name = this._config.name || st?.attributes?.friendly_name || "Licht";
    const on = st?.state === "on";
    const briOk = hasBrightness(st);
    const yellow = this._yellow();
    const col = tileColors(st, yellow);
    const brightness = Number(st?.attributes?.brightness);

    this._root.classList.toggle("on", on && briOk);
    this._root.classList.toggle("off", !(on && briOk));
    this._name.textContent = name;
    this._tile.style.background = col.bg;
    this._tile.style.color = col.fg;

    if (on && Number.isFinite(brightness)) {
      this._sub.textContent = `${Math.round((brightness / 255) * 100)} %`;
      if (!this._bri._drag) {
        this._bri.value = String(brightness);
        this._bri.style.setProperty("--fill", `${Math.round((brightness / 255) * 1000) / 10}%`);
      }
      const track = col.rgb
        ? `rgb(${col.rgb[0]}, ${col.rgb[1]}, ${col.rgb[2]})`
        : yellow;
      this._bri.style.setProperty("--track", track);
    } else if (on) {
      this._sub.textContent = "Ein";
    } else {
      this._sub.textContent = st?.state === "unavailable" ? "Unbekannt" : "Aus";
    }
  }
}

if (!customElements.get("ios-light-card")) {
  customElements.define("ios-light-card", IosLightCard);
}
window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === "ios-light-card")) {
  window.customCards.push({
    type: "ios-light-card",
    name: "iOS Light",
    description: "Lichtzeile im iOS-Stil",
  });
}
console.info(
  `%c iOS Light %c v${VERSION} `,
  "background:#1c1c1e;color:#ffd60a;font-weight:700;padding:2px 6px;border-radius:4px 0 0 4px",
  "background:#ffd60a;color:#1c1c1e;padding:2px 6px;border-radius:0 4px 4px 0",
);

})();


/* ===== data-view for per-view backgrounds (standalone) ===== */
(function () {
  let last = "";
  let gen = 0;
  function markPanel(root) {
    const path = location.pathname || "";
    const dashboard = /\/dashboard-(?:x|timo)(?:\/|$)/.test(path);
    root.setAttribute("data-panel", dashboard ? "dash" : "admin");
    return dashboard;
  }
  function snapWash(root, view) {
    root.classList.remove("apple-wash-animating");
    root.setAttribute("data-view", view);
    root.removeAttribute("data-view-next");
    root.style.setProperty("--apple-wash-cur-opacity", "1");
    root.style.setProperty("--apple-wash-next-opacity", "0");
    root.style.setProperty("--apple-wash-scale", "1");
    if (document.body) document.body.setAttribute("data-view", view);
  }
  function setView() {
    try {
      const root = document.documentElement;
      if (!markPanel(root)) {
        last = "";
        gen += 1;
        root.classList.remove("apple-wash-animating");
        root.removeAttribute("data-view");
        root.removeAttribute("data-view-next");
        if (document.body) document.body.removeAttribute("data-view");
        return;
      }
      const m = (location.pathname || "").match(/\/dashboard-(?:x|timo)\/([^\/\?]+)/);
      const view = m ? m[1] : "haus";
      if (view === last) return;
      const prev = last;
      last = view;
      const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce || !prev) {
        snapWash(root, view);
        return;
      }
      const my = ++gen;
      root.setAttribute("data-view-next", view);
      if (document.body) document.body.setAttribute("data-view", view);
      root.style.setProperty("--apple-wash-next-opacity", "0");
      root.style.setProperty("--apple-wash-scale", "1.04");
      root.classList.add("apple-wash-animating");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (my !== gen) return;
          root.style.setProperty("--apple-wash-cur-opacity", "0");
          root.style.setProperty("--apple-wash-next-opacity", "1");
          root.style.setProperty("--apple-wash-scale", "1");
        });
      });
      setTimeout(() => {
        if (my !== gen) return;
        snapWash(root, view);
      }, 340);
    } catch (_e) {}
  }
  setView();
  window.addEventListener("location-changed", setView);
  window.addEventListener("popstate", setView);
  document.addEventListener("DOMContentLoaded", setView);
})();
