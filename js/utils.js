/**
 * utils.js - URL state management, clipboard, image save
 */
const Utils = (() => {
  const FRACTAL_TYPES = ['mandelbrot', 'julia', 'burningship', 'tricorn'];

  /**
   * Encode app state into a URL hash string.
   */
  function encodeState(state) {
    const params = new URLSearchParams();
    params.set('x', state.centerX.toPrecision(15));
    params.set('y', state.centerY.toPrecision(15));
    params.set('z', state.zoom.toExponential(6));
    params.set('type', FRACTAL_TYPES[state.fractalType] || 'mandelbrot');
    params.set('palette', state.palette);
    params.set('iter', state.maxIter.toString());
    params.set('lang', I18n.lang());
    if (state.fractalType === 1) {
      params.set('jr', state.juliaRe.toPrecision(10));
      params.set('ji', state.juliaIm.toPrecision(10));
    }
    return params.toString();
  }

  /**
   * Decode URL hash string into partial state object.
   * Returns null if hash is empty.
   */
  function decodeState(hash) {
    const str = hash.replace(/^#/, '');
    if (!str) return null;
    const params = new URLSearchParams(str);

    const result = {};
    if (params.has('x')) result.centerX = parseFloat(params.get('x'));
    if (params.has('y')) result.centerY = parseFloat(params.get('y'));
    if (params.has('z')) result.zoom = parseFloat(params.get('z'));
    if (params.has('type')) {
      const idx = FRACTAL_TYPES.indexOf(params.get('type'));
      if (idx >= 0) result.fractalType = idx;
    }
    if (params.has('palette')) result.palette = params.get('palette');
    if (params.has('iter')) result.maxIter = parseInt(params.get('iter'), 10);
    if (params.has('lang')) result.lang = params.get('lang');
    if (params.has('jr')) result.juliaRe = parseFloat(params.get('jr'));
    if (params.has('ji')) result.juliaIm = parseFloat(params.get('ji'));

    return result;
  }

  /**
   * Copy text to clipboard and show toast.
   */
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    }
  }

  /**
   * Save canvas content as PNG.
   */
  function saveImage(canvas, fractalName) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `fractal_${fractalName}_${timestamp}.png`;

    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  }

  /**
   * Show a toast notification.
   */
  function showToast(message, duration = 2000) {
    const el = document.getElementById('toast');
    el.textContent = message;
    el.classList.remove('hidden');
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.add('hidden'), duration);
  }

  /**
   * Format a number for display.
   */
  function formatNum(n, digits = 4) {
    if (Math.abs(n) < 0.0001 && n !== 0) return n.toExponential(2);
    return n.toFixed(digits);
  }

  function formatZoom(z) {
    if (z >= 1e6) return z.toExponential(2);
    if (z >= 100) return z.toFixed(0);
    if (z >= 1) return z.toFixed(2);
    return z.toFixed(4);
  }

  return {
    FRACTAL_TYPES,
    encodeState,
    decodeState,
    copyToClipboard,
    saveImage,
    showToast,
    formatNum,
    formatZoom
  };
})();
