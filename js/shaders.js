/**
 * shaders.js - GLSL shader sources for fractal rendering
 */
const Shaders = (() => {
  const vertexSource = `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  // Fragment shader: supports Mandelbrot, Julia, Burning Ship, Tricorn
  // Uses smooth coloring and palette texture lookup
  const fragmentSource = `
    precision highp float;

    uniform vec2 u_resolution;
    uniform vec2 u_center;
    uniform float u_zoom;
    uniform int u_maxIter;
    uniform int u_fractalType; // 0=mandelbrot, 1=julia, 2=burningship, 3=tricorn
    uniform vec2 u_juliaC;
    uniform sampler2D u_palette;

    // Smooth iteration count
    vec3 getColor(float iter, int maxIter) {
      if (iter >= float(maxIter)) {
        return vec3(0.0); // inside set = black
      }
      float t = iter / float(maxIter);
      // Wrap palette a few times for detail at deep zoom
      t = fract(t * 4.0);
      return texture2D(u_palette, vec2(t, 0.5)).rgb;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution;
      float aspect = u_resolution.x / u_resolution.y;

      // Map pixel to complex plane
      vec2 c;
      c.x = (uv.x - 0.5) * aspect / u_zoom + u_center.x;
      c.y = (uv.y - 0.5) / u_zoom + u_center.y;

      vec2 z;
      vec2 param_c;

      // Fractal type setup
      if (u_fractalType == 1) {
        // Julia: z starts at pixel coord, c is fixed
        z = c;
        param_c = u_juliaC;
      } else {
        // Mandelbrot, Burning Ship, Tricorn: z starts at 0, c is pixel coord
        z = vec2(0.0);
        param_c = c;
      }

      float iter = 0.0;
      const int MAX_LOOP = 5000;

      for (int i = 0; i < MAX_LOOP; i++) {
        if (i >= u_maxIter) break;
        if (dot(z, z) > 4.0) break;

        // Apply fractal formula
        if (u_fractalType == 2) {
          // Burning Ship: take abs of components before squaring
          z = vec2(abs(z.x), abs(z.y));
        } else if (u_fractalType == 3) {
          // Tricorn: conjugate z
          z = vec2(z.x, -z.y);
        }

        // z = z^2 + c
        float xtemp = z.x * z.x - z.y * z.y + param_c.x;
        z.y = 2.0 * z.x * z.y + param_c.y;
        z.x = xtemp;

        iter += 1.0;
      }

      // Smooth coloring: subtract fractional escape
      if (iter < float(u_maxIter)) {
        float log_zn = log(dot(z, z)) / 2.0;
        float nu = log(log_zn / log(2.0)) / log(2.0);
        iter = iter + 1.0 - nu;
      }

      vec3 color = getColor(iter, u_maxIter);
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  return { vertexSource, fragmentSource };
})();
