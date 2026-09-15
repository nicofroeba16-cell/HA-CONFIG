/* Apple Optik — shadow background helper v6.
 * apple-optik.js owns dashboard routes and animated data-view state.
 * This helper only keeps mobile Shadow DOM surfaces transparent.
 */
(() => {
  const STYLE_ID = "apple-mobile-gradient";
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
