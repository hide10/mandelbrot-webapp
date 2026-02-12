/**
 * app.js - Application entry point, state management, module integration
 */
(() => {
  // --- Default state ---
  const state = {
    centerX: -0.5,
    centerY: 0,
    zoom: 0.35,
    fractalType: 0,       // 0=mandelbrot, 1=julia, 2=burningship, 3=tricorn
    palette: 'classic',
    maxIter: 500,
    juliaRe: -0.7,
    juliaIm: 0.27015
  };

  let renderQueued = false;

  function requestRender() {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(() => {
      renderQueued = false;
      Renderer.draw(state);
      UI.updateInfoBar();
    });
  }

  function initialize() {
    // 1. Detect language
    const detectedLang = I18n.detect();
    I18n.set(detectedLang);

    // 2. Restore state from URL hash (if present)
    const hashState = Utils.decodeState(location.hash);
    if (hashState) {
      Object.assign(state, hashState);
      if (hashState.lang) {
        I18n.set(hashState.lang);
      }
    }

    // 3. Apply i18n texts
    I18n.applyToDOM();
    document.getElementById('lang-btn').textContent = I18n.get('langLabel');

    // 4. Initialize WebGL renderer
    const canvas = document.getElementById('fractal-canvas');
    const ok = Renderer.init(canvas);
    if (!ok) {
      document.body.innerHTML =
        `<div style="display:flex;align-items:center;justify-content:center;height:100vh;padding:20px;text-align:center;color:#e0e0e0;background:#1a1a2e;font-size:16px;">
          ${I18n.get('webglError')}
        </div>`;
      return;
    }

    // 5. Set initial palette
    Renderer.setPalette(state.palette);

    // 6. Initialize UI
    UI.init(state, requestRender);
    UI.syncFromState();

    // 7. Initialize controls
    Controls.init(canvas, state, requestRender);

    // 8. Handle window resize
    window.addEventListener('resize', () => requestRender());

    // 9. Initial render
    requestRender();
  }

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
