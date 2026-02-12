/**
 * controls.js - Mouse and touch input handling for pan/zoom
 */
const Controls = (() => {
  let canvas = null;
  let onUpdate = null; // callback(state)
  let state = null;    // reference to app state

  // Drag state
  let isDragging = false;
  let dragStart = { x: 0, y: 0 };
  let dragCenterStart = { x: 0, y: 0 };

  // Pinch state
  let pinchStartDist = 0;
  let pinchStartZoom = 0;
  let pinchCenter = { x: 0, y: 0 };

  // Double-tap detection
  let lastTap = 0;

  function init(canvasEl, appState, updateCb) {
    canvas = canvasEl;
    state = appState;
    onUpdate = updateCb;

    // Mouse events
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseleave', onMouseUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('dblclick', onDblClick);

    // Touch events
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);

    canvas.style.cursor = 'grab';
  }

  // --- Coordinate conversion ---
  function pixelToComplex(px, py) {
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const aspect = w / h;
    const cx = (px / w - 0.5) * aspect / state.zoom + state.centerX;
    const cy = (0.5 - py / h) * 1.0 / state.zoom + state.centerY;
    return { x: cx, y: cy };
  }

  // --- Mouse handlers ---
  function onMouseDown(e) {
    if (e.button !== 0) return;
    isDragging = true;
    dragStart.x = e.clientX;
    dragStart.y = e.clientY;
    dragCenterStart.x = state.centerX;
    dragCenterStart.y = state.centerY;
    canvas.style.cursor = 'grabbing';
  }

  function onMouseMove(e) {
    if (!isDragging) return;
    const rect = canvas.getBoundingClientRect();
    const dx = (e.clientX - dragStart.x) / rect.width;
    const dy = (e.clientY - dragStart.y) / rect.height;
    const aspect = rect.width / rect.height;

    state.centerX = dragCenterStart.x - dx * aspect / state.zoom;
    state.centerY = dragCenterStart.y + dy / state.zoom;
    onUpdate();
  }

  function onMouseUp() {
    isDragging = false;
    canvas.style.cursor = 'grab';
  }

  function onWheel(e) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Zoom toward cursor position
    const before = pixelToComplex(mx, my);
    const factor = e.deltaY < 0 ? 1.3 : 1 / 1.3;
    state.zoom *= factor;

    const after = pixelToComplex(mx, my);
    state.centerX += before.x - after.x;
    state.centerY += before.y - after.y;

    onUpdate();
  }

  function onDblClick(e) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const pt = pixelToComplex(mx, my);

    if (e.shiftKey) {
      state.zoom /= 3;
    } else {
      state.centerX = pt.x;
      state.centerY = pt.y;
      state.zoom *= 3;
    }
    onUpdate();
  }

  // --- Touch handlers ---
  function onTouchStart(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
      // Check double-tap
      const now = Date.now();
      if (now - lastTap < 300) {
        const rect = canvas.getBoundingClientRect();
        const t = e.touches[0];
        const pt = pixelToComplex(t.clientX - rect.left, t.clientY - rect.top);
        state.centerX = pt.x;
        state.centerY = pt.y;
        state.zoom *= 3;
        onUpdate();
        lastTap = 0;
        return;
      }
      lastTap = now;

      isDragging = true;
      dragStart.x = e.touches[0].clientX;
      dragStart.y = e.touches[0].clientY;
      dragCenterStart.x = state.centerX;
      dragCenterStart.y = state.centerY;
    } else if (e.touches.length === 2) {
      isDragging = false;
      pinchStartDist = getTouchDist(e.touches);
      pinchStartZoom = state.zoom;
      pinchCenter = getTouchCenter(e.touches);
    }
  }

  function onTouchMove(e) {
    e.preventDefault();
    if (e.touches.length === 1 && isDragging) {
      const rect = canvas.getBoundingClientRect();
      const dx = (e.touches[0].clientX - dragStart.x) / rect.width;
      const dy = (e.touches[0].clientY - dragStart.y) / rect.height;
      const aspect = rect.width / rect.height;

      state.centerX = dragCenterStart.x - dx * aspect / state.zoom;
      state.centerY = dragCenterStart.y + dy / state.zoom;
      onUpdate();
    } else if (e.touches.length === 2) {
      const dist = getTouchDist(e.touches);
      const rect = canvas.getBoundingClientRect();
      const center = getTouchCenter(e.touches);

      // Zoom
      const before = pixelToComplex(center.x - rect.left, center.y - rect.top);
      state.zoom = pinchStartZoom * (dist / pinchStartDist);
      const after = pixelToComplex(center.x - rect.left, center.y - rect.top);
      state.centerX += before.x - after.x;
      state.centerY += before.y - after.y;

      onUpdate();
    }
  }

  function onTouchEnd(e) {
    if (e.touches.length < 2) {
      isDragging = false;
    }
    if (e.touches.length === 1) {
      isDragging = true;
      dragStart.x = e.touches[0].clientX;
      dragStart.y = e.touches[0].clientY;
      dragCenterStart.x = state.centerX;
      dragCenterStart.y = state.centerY;
    }
  }

  function getTouchDist(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function getTouchCenter(touches) {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2
    };
  }

  return { init };
})();
