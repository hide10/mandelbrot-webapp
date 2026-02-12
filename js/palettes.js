/**
 * palettes.js - Color palette definitions
 * Each palette is an array of RGB color stops used to build a 256-entry lookup texture.
 */
const Palettes = (() => {
  // Each palette: array of { pos: 0..1, r, g, b } color stops (0-255 values)
  const definitions = {
    classic: {
      id: 'classic',
      stops: [
        { pos: 0.0,  r: 0,   g: 7,   b: 100 },
        { pos: 0.16, r: 32,  g: 107, b: 203 },
        { pos: 0.42, r: 237, g: 255, b: 255 },
        { pos: 0.6425, r: 255, g: 170, b: 0 },
        { pos: 0.8575, r: 0,   g: 2,   b: 0 },
        { pos: 1.0,  r: 0,   g: 7,   b: 100 }
      ]
    },
    fire: {
      id: 'fire',
      stops: [
        { pos: 0.0,  r: 0,   g: 0,   b: 0 },
        { pos: 0.25, r: 128, g: 0,   b: 0 },
        { pos: 0.5,  r: 255, g: 80,  b: 0 },
        { pos: 0.75, r: 255, g: 220, b: 50 },
        { pos: 1.0,  r: 255, g: 255, b: 255 }
      ]
    },
    rainbow: {
      id: 'rainbow',
      stops: [
        { pos: 0.0,   r: 255, g: 0,   b: 0 },
        { pos: 0.167, r: 255, g: 165, b: 0 },
        { pos: 0.333, r: 255, g: 255, b: 0 },
        { pos: 0.5,   r: 0,   g: 200, b: 0 },
        { pos: 0.667, r: 0,   g: 100, b: 255 },
        { pos: 0.833, r: 128, g: 0,   b: 255 },
        { pos: 1.0,   r: 255, g: 0,   b: 0 }
      ]
    },
    ocean: {
      id: 'ocean',
      stops: [
        { pos: 0.0,  r: 0,   g: 0,   b: 40 },
        { pos: 0.3,  r: 0,   g: 40,  b: 120 },
        { pos: 0.6,  r: 0,   g: 140, b: 200 },
        { pos: 0.8,  r: 140, g: 220, b: 255 },
        { pos: 1.0,  r: 230, g: 250, b: 255 }
      ]
    },
    mono: {
      id: 'mono',
      stops: [
        { pos: 0.0, r: 0,   g: 0,   b: 0 },
        { pos: 1.0, r: 255, g: 255, b: 255 }
      ]
    },
    neon: {
      id: 'neon',
      stops: [
        { pos: 0.0,  r: 10,  g: 0,   b: 20 },
        { pos: 0.2,  r: 180, g: 0,   b: 255 },
        { pos: 0.4,  r: 0,   g: 255, b: 200 },
        { pos: 0.6,  r: 255, g: 255, b: 0 },
        { pos: 0.8,  r: 255, g: 0,   b: 100 },
        { pos: 1.0,  r: 10,  g: 0,   b: 20 }
      ]
    }
  };

  /**
   * Build a 256x1 RGBA Uint8Array from color stops (for use as a WebGL texture).
   */
  function buildTextureData(paletteId) {
    const pal = definitions[paletteId];
    if (!pal) return null;
    const stops = pal.stops;
    const data = new Uint8Array(256 * 4);

    for (let i = 0; i < 256; i++) {
      const t = i / 255;
      // Find surrounding stops
      let s0 = stops[0], s1 = stops[stops.length - 1];
      for (let j = 0; j < stops.length - 1; j++) {
        if (t >= stops[j].pos && t <= stops[j + 1].pos) {
          s0 = stops[j];
          s1 = stops[j + 1];
          break;
        }
      }
      const range = s1.pos - s0.pos;
      const f = range > 0 ? (t - s0.pos) / range : 0;
      const idx = i * 4;
      data[idx]     = Math.round(s0.r + (s1.r - s0.r) * f);
      data[idx + 1] = Math.round(s0.g + (s1.g - s0.g) * f);
      data[idx + 2] = Math.round(s0.b + (s1.b - s0.b) * f);
      data[idx + 3] = 255;
    }
    return data;
  }

  /**
   * Generate a CSS linear-gradient string for palette swatch preview.
   */
  function toGradientCSS(paletteId) {
    const pal = definitions[paletteId];
    if (!pal) return 'black';
    const parts = pal.stops.map(s =>
      `rgb(${s.r},${s.g},${s.b}) ${(s.pos * 100).toFixed(1)}%`
    );
    return `linear-gradient(to right, ${parts.join(', ')})`;
  }

  function list() {
    return Object.keys(definitions);
  }

  return { definitions, buildTextureData, toGradientCSS, list };
})();
