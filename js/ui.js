/**
 * ui.js - UI controls: side panel, palette selector, sliders, buttons
 */
const UI = (() => {
  let state = null;
  let onStateChange = null;

  function init(appState, changeCb) {
    state = appState;
    onStateChange = changeCb;

    setupMenuToggle();
    setupFractalSelect();
    setupPaletteGrid();
    setupIterSlider();
    setupJuliaParams();
    setupResetBtn();
    setupShareBtn();
    setupSaveBtn();
    setupLangBtn();
  }

  // --- Side panel toggle ---
  function setupMenuToggle() {
    const btn = document.getElementById('menu-btn');
    const panel = document.getElementById('side-panel');
    const overlay = document.getElementById('overlay');

    function toggle() {
      panel.classList.toggle('hidden');
      overlay.classList.toggle('hidden');
    }

    btn.addEventListener('click', toggle);
    overlay.addEventListener('click', toggle);
  }

  // --- Fractal type selector ---
  function setupFractalSelect() {
    const sel = document.getElementById('fractal-select');
    sel.addEventListener('change', () => {
      const val = sel.value;
      const idx = Utils.FRACTAL_TYPES.indexOf(val);
      if (idx >= 0) {
        state.fractalType = idx;
        // Show/hide Julia params
        document.getElementById('julia-params').style.display =
          idx === 1 ? 'block' : 'none';
        onStateChange();
      }
    });
  }

  // --- Palette grid ---
  function setupPaletteGrid() {
    const grid = document.getElementById('palette-grid');
    const ids = Palettes.list();

    ids.forEach(id => {
      const swatch = document.createElement('div');
      swatch.className = 'palette-swatch';
      swatch.style.background = Palettes.toGradientCSS(id);
      swatch.title = I18n.get('palettes.' + id);
      swatch.dataset.palette = id;

      if (id === state.palette) swatch.classList.add('active');

      swatch.addEventListener('click', () => {
        grid.querySelectorAll('.palette-swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        state.palette = id;
        Renderer.setPalette(id);
        onStateChange();
      });

      grid.appendChild(swatch);
    });
  }

  // --- Iteration slider (logarithmic: 10^slider value) ---
  function setupIterSlider() {
    const slider = document.getElementById('iter-slider');
    const display = document.getElementById('iter-value');

    // Sync slider to state
    slider.value = Math.log10(state.maxIter).toFixed(2);
    display.textContent = state.maxIter;

    slider.addEventListener('input', () => {
      const val = Math.round(Math.pow(10, parseFloat(slider.value)));
      state.maxIter = Math.max(50, Math.min(5000, val));
      display.textContent = state.maxIter;
      document.getElementById('info-iter').textContent = state.maxIter;
      onStateChange();
    });
  }

  // --- Julia parameter inputs ---
  function setupJuliaParams() {
    const btn = document.getElementById('julia-apply');
    btn.addEventListener('click', () => {
      state.juliaRe = parseFloat(document.getElementById('julia-re').value) || -0.7;
      state.juliaIm = parseFloat(document.getElementById('julia-im').value) || 0.27015;
      onStateChange();
    });
  }

  // --- Reset button ---
  function setupResetBtn() {
    document.getElementById('reset-btn').addEventListener('click', () => {
      state.centerX = -0.5;
      state.centerY = 0;
      state.zoom = 0.35;
      state.fractalType = 0;
      state.maxIter = 500;

      // Sync UI
      document.getElementById('fractal-select').value = 'mandelbrot';
      document.getElementById('julia-params').style.display = 'none';
      document.getElementById('iter-slider').value = Math.log10(500).toFixed(2);
      document.getElementById('iter-value').textContent = '500';

      onStateChange();
    });
  }

  // --- Share URL ---
  function setupShareBtn() {
    document.getElementById('share-btn').addEventListener('click', async () => {
      const hash = Utils.encodeState(state);
      const url = location.origin + location.pathname + '#' + hash;
      history.replaceState(null, '', '#' + hash);
      const ok = await Utils.copyToClipboard(url);
      if (ok) Utils.showToast(I18n.get('toastCopied'));
    });
  }

  // --- Save image ---
  function setupSaveBtn() {
    document.getElementById('save-btn').addEventListener('click', () => {
      const name = Utils.FRACTAL_TYPES[state.fractalType] || 'fractal';
      Utils.saveImage(Renderer.getCanvas(), name);
      Utils.showToast(I18n.get('toastSaved'));
    });
  }

  // --- Language toggle ---
  function setupLangBtn() {
    const btn = document.getElementById('lang-btn');
    btn.addEventListener('click', () => {
      I18n.toggle();
      btn.textContent = I18n.get('langLabel');
      // Update palette swatch titles
      document.querySelectorAll('.palette-swatch').forEach(s => {
        s.title = I18n.get('palettes.' + s.dataset.palette);
      });
    });
  }

  // --- Update info bar ---
  function updateInfoBar() {
    document.getElementById('info-x').textContent = Utils.formatNum(state.centerX);
    document.getElementById('info-y').textContent = Utils.formatNum(state.centerY);
    document.getElementById('info-zoom').textContent = Utils.formatZoom(state.zoom);
    document.getElementById('info-iter').textContent = state.maxIter;
  }

  // --- Sync UI from state (for URL restore) ---
  function syncFromState() {
    document.getElementById('fractal-select').value =
      Utils.FRACTAL_TYPES[state.fractalType] || 'mandelbrot';
    document.getElementById('julia-params').style.display =
      state.fractalType === 1 ? 'block' : 'none';
    document.getElementById('julia-re').value = state.juliaRe;
    document.getElementById('julia-im').value = state.juliaIm;
    document.getElementById('iter-slider').value = Math.log10(state.maxIter).toFixed(2);
    document.getElementById('iter-value').textContent = state.maxIter;

    // Active palette
    document.querySelectorAll('.palette-swatch').forEach(s => {
      s.classList.toggle('active', s.dataset.palette === state.palette);
    });
  }

  return { init, updateInfoBar, syncFromState };
})();
