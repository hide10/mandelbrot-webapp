/**
 * shaders.js - GLSL shader sources for fractal rendering
 * Uses double-float emulation (two float32 = ~float64 precision)
 * to allow deep zoom up to ~10^13
 */
const Shaders = (() => {
  const vertexSource = `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  const fragmentSource = `
    precision highp float;

    uniform vec2 u_resolution;
    uniform vec2 u_centerHi;     // center high bits (float32)
    uniform vec2 u_centerLo;     // center low bits  (remainder)
    uniform float u_zoom;
    uniform int u_maxIter;
    uniform int u_fractalType;   // 0=mandelbrot, 1=julia, 2=burningship, 3=tricorn
    uniform vec2 u_juliaC;
    uniform sampler2D u_palette;

    // ===== Double-float arithmetic =====
    // A "df" number is vec2(hi, lo) representing hi + lo

    vec2 quickTwoSum(float a, float b) {
      float s = a + b;
      float e = b - (s - a);
      return vec2(s, e);
    }

    vec2 twoSum(float a, float b) {
      float s = a + b;
      float v = s - a;
      float e = (a - (s - v)) + (b - v);
      return vec2(s, e);
    }

    vec2 dfSplit(float a) {
      float t = a * 4097.0;   // 2^12 + 1
      float hi = t - (t - a);
      float lo = a - hi;
      return vec2(hi, lo);
    }

    vec2 twoProd(float a, float b) {
      float p = a * b;
      vec2 as = dfSplit(a);
      vec2 bs = dfSplit(b);
      float err = ((as.x * bs.x - p) + as.x * bs.y + as.y * bs.x) + as.y * bs.y;
      return vec2(p, err);
    }

    vec2 dfAdd(vec2 a, vec2 b) {
      vec2 s = twoSum(a.x, b.x);
      s.y += a.y + b.y;
      return quickTwoSum(s.x, s.y);
    }

    vec2 dfSub(vec2 a, vec2 b) {
      return dfAdd(a, vec2(-b.x, -b.y));
    }

    vec2 dfMul(vec2 a, vec2 b) {
      vec2 p = twoProd(a.x, b.x);
      p.y += a.x * b.y + a.y * b.x;
      return quickTwoSum(p.x, p.y);
    }

    vec2 dfSet(float a) {
      return vec2(a, 0.0);
    }

    vec2 dfAbs(vec2 a) {
      return a.x < 0.0 || (a.x == 0.0 && a.y < 0.0)
        ? vec2(-a.x, -a.y)
        : a;
    }

    // ===== Main =====
    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution;
      float aspect = u_resolution.x / u_resolution.y;

      // Per-pixel offset from center (single float is fine — it's small)
      float dx = (uv.x - 0.5) * aspect / u_zoom;
      float dy = (uv.y - 0.5) / u_zoom;

      // Pixel coordinate in double-float: center(hi,lo) + offset
      vec2 cx = dfAdd(vec2(u_centerHi.x, u_centerLo.x), dfSet(dx));
      vec2 cy = dfAdd(vec2(u_centerHi.y, u_centerLo.y), dfSet(dy));

      // z and c initialization based on fractal type
      vec2 zx, zy, pcx, pcy;
      if (u_fractalType == 1) {
        // Julia: z = pixel coord, c = fixed parameter
        zx = cx; zy = cy;
        pcx = dfSet(u_juliaC.x);
        pcy = dfSet(u_juliaC.y);
      } else {
        zx = dfSet(0.0); zy = dfSet(0.0);
        pcx = cx; pcy = cy;
      }

      float iter = 0.0;
      const int MAX_LOOP = 5000;

      for (int i = 0; i < MAX_LOOP; i++) {
        if (i >= u_maxIter) break;

        // Escape check (hi parts are enough for this)
        float mag2 = zx.x * zx.x + zy.x * zy.x;
        if (mag2 > 4.0) break;

        // Fractal-specific pre-processing
        if (u_fractalType == 2) {
          // Burning Ship: abs(Re), abs(Im)
          zx = dfAbs(zx);
          zy = dfAbs(zy);
        } else if (u_fractalType == 3) {
          // Tricorn: conjugate z
          zy = vec2(-zy.x, -zy.y);
        }

        // z = z^2 + c  in double-float
        vec2 xx = dfMul(zx, zx);
        vec2 yy = dfMul(zy, zy);
        vec2 xy = dfMul(zx, zy);
        vec2 xy2 = dfAdd(xy, xy);

        zx = dfAdd(dfSub(xx, yy), pcx);
        zy = dfAdd(xy2, pcy);

        iter += 1.0;
      }

      // Smooth coloring
      float mag2 = zx.x * zx.x + zy.x * zy.x;
      if (iter < float(u_maxIter) && mag2 > 4.0) {
        float log_zn = log(mag2) / 2.0;
        float nu = log(log_zn / log(2.0)) / log(2.0);
        iter = iter + 1.0 - nu;
      }

      // Palette lookup
      if (iter >= float(u_maxIter)) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      } else {
        float t = fract(iter / float(u_maxIter) * 4.0);
        vec3 color = texture2D(u_palette, vec2(t, 0.5)).rgb;
        gl_FragColor = vec4(color, 1.0);
      }
    }
  `;

  return { vertexSource, fragmentSource };
})();
