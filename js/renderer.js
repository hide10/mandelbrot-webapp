/**
 * renderer.js - WebGL fractal rendering engine
 * Passes center coordinates as double-float (hi+lo) pairs for deep zoom precision.
 */
const Renderer = (() => {
  let gl = null;
  let program = null;
  let paletteTexture = null;
  let uniforms = {};
  let canvas = null;

  /**
   * Split a JavaScript float64 into two float32 values: hi + lo ≈ value
   */
  function splitDouble(value) {
    const hi = Math.fround(value);
    const lo = value - hi;
    return [hi, lo];
  }

  function init(canvasEl) {
    canvas = canvasEl;
    gl = canvas.getContext('webgl', { preserveDrawingBuffer: true, antialias: false })
      || canvas.getContext('experimental-webgl', { preserveDrawingBuffer: true, antialias: false });

    if (!gl) return false;

    // Compile shaders
    const vs = compileShader(gl.VERTEX_SHADER, Shaders.vertexSource);
    const fs = compileShader(gl.FRAGMENT_SHADER, Shaders.fragmentSource);
    if (!vs || !fs) return false;

    program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return false;
    }

    gl.useProgram(program);

    // Full-screen quad
    const verts = new Float32Array([-1,-1, 1,-1, -1,1, 1,1]);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    // Cache uniform locations
    uniforms = {
      resolution:  gl.getUniformLocation(program, 'u_resolution'),
      centerHi:    gl.getUniformLocation(program, 'u_centerHi'),
      centerLo:    gl.getUniformLocation(program, 'u_centerLo'),
      zoom:        gl.getUniformLocation(program, 'u_zoom'),
      maxIter:     gl.getUniformLocation(program, 'u_maxIter'),
      fractalType: gl.getUniformLocation(program, 'u_fractalType'),
      juliaC:      gl.getUniformLocation(program, 'u_juliaC'),
      palette:     gl.getUniformLocation(program, 'u_palette')
    };

    // Create palette texture
    paletteTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, paletteTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(uniforms.palette, 0);

    return true;
  }

  function compileShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function setPalette(paletteId) {
    const data = Palettes.buildTextureData(paletteId);
    if (!data) return;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, paletteTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  }

  function draw(state) {
    if (!gl) return;
    resize();

    // Split center coordinates into hi + lo for double-float precision
    const [cxHi, cxLo] = splitDouble(state.centerX);
    const [cyHi, cyLo] = splitDouble(state.centerY);

    gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
    gl.uniform2f(uniforms.centerHi, cxHi, cyHi);
    gl.uniform2f(uniforms.centerLo, cxLo, cyLo);
    gl.uniform1f(uniforms.zoom, state.zoom);
    gl.uniform1i(uniforms.maxIter, state.maxIter);
    gl.uniform1i(uniforms.fractalType, state.fractalType);
    gl.uniform2f(uniforms.juliaC, state.juliaRe, state.juliaIm);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function getGL() {
    return gl;
  }

  function getCanvas() {
    return canvas;
  }

  return { init, draw, setPalette, resize, getGL, getCanvas };
})();
