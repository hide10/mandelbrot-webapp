/**
 * i18n - Internationalization module
 * Supports Japanese (ja) and English (en)
 */
const I18n = (() => {
  const texts = {
    ja: {
      title: 'フラクタルエクスプローラー',
      fractalType: 'フラクタル種類',
      mandelbrot: 'マンデルブロ集合',
      julia: 'ジュリア集合',
      burningship: 'バーニングシップ',
      tricorn: 'トリコーン',
      juliaParam: 'ジュリアパラメータ (c)',
      apply: '適用',
      colorPalette: 'カラーパレット',
      maxIterations: '最大反復回数',
      reset: '表示をリセット',
      share: 'URLを共有',
      langLabel: 'EN',
      toastCopied: 'URLをクリップボードにコピーしました',
      toastSaved: '画像を保存しました',
      webglError: 'WebGLに対応していないブラウザです。Chrome、Firefox、Safari等をご利用ください。',
      palettes: {
        classic: 'クラシック',
        fire: 'ファイア',
        rainbow: 'レインボー',
        ocean: 'オーシャン',
        mono: 'モノクロ',
        neon: 'ネオン'
      }
    },
    en: {
      title: 'Fractal Explorer',
      fractalType: 'Fractal Type',
      mandelbrot: 'Mandelbrot',
      julia: 'Julia',
      burningship: 'Burning Ship',
      tricorn: 'Tricorn',
      juliaParam: 'Julia Parameter (c)',
      apply: 'Apply',
      colorPalette: 'Color Palette',
      maxIterations: 'Max Iterations',
      reset: 'Reset View',
      share: 'Share URL',
      langLabel: 'JP',
      toastCopied: 'URL copied to clipboard',
      toastSaved: 'Image saved',
      webglError: 'Your browser does not support WebGL. Please use Chrome, Firefox, or Safari.',
      palettes: {
        classic: 'Classic',
        fire: 'Fire',
        rainbow: 'Rainbow',
        ocean: 'Ocean',
        mono: 'Mono',
        neon: 'Neon'
      }
    }
  };

  let currentLang = 'en';

  function detect() {
    const nav = navigator.language || navigator.userLanguage || 'en';
    return nav.startsWith('ja') ? 'ja' : 'en';
  }

  function set(lang) {
    currentLang = lang;
    applyToDOM();
  }

  function get(key) {
    const keys = key.split('.');
    let val = texts[currentLang];
    for (const k of keys) {
      if (val == null) return key;
      val = val[k];
    }
    return val != null ? val : key;
  }

  function lang() {
    return currentLang;
  }

  function toggle() {
    set(currentLang === 'ja' ? 'en' : 'ja');
    return currentLang;
  }

  function applyToDOM() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const text = get(key);
      if (el.tagName === 'OPTION') {
        el.textContent = text;
      } else if (el.tagName === 'INPUT') {
        el.placeholder = text;
      } else {
        el.textContent = text;
      }
    });
    document.documentElement.lang = currentLang;
  }

  return { detect, set, get, lang, toggle, applyToDOM };
})();
