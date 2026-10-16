/**
 * Cosmic Slider Mod for Claude Desktop (v5.0 - Pure GPU Compositor Engine)
 * Breakthrough Architecture:
 * - 100% Hardware-accelerated CSS keyframe animations executed in Chromium GPU Compositor Thread
 * - Completely zero JavaScript animation loop (immune to GC and background scans)
 * - Rock-solid 60/120/144+ FPS without micro-stutters
 * - Visible STRICTLY on "Max" (Максимум) effort level
 * - Bound strictly by thumb position (overflow: hidden container)
 * - 100% original native track background
 * - Signature warm Claude Code orange glow on the thumb
 */

(function initCosmicSlider() {
  if (window.__claude_cosmic_slider_injected_v50) return;
  window.__claude_cosmic_slider_injected_v50 = true;

  if (localStorage.getItem('claude_cosmic_disabled') === 'true') {
    return;
  }

  console.log('[CosmicSlider] Initializing Pure GPU Compositor Engine v5.0...');

  // --- 1. Inject Hardware GPU Keyframes & Styles ---
  function injectCosmicStyles() {
    let style = document.getElementById('claude-cosmic-slider-styles');
    if (!style) {
      style = document.createElement('style');
      style.id = 'claude-cosmic-slider-styles';
      document.head.appendChild(style);
    }

    style.textContent = `
      /* Трек слайдера: нативный вид, опора для абсолютного позиционирования */
      div[data-cds="ModelSelectorEffort"] [data-cds="Slider"] [data-base-ui-slider-control] > div:first-child,
      div[data-cds="ModelSelectorEffort"] [data-cds="Slider"] [style*="--cds-slider-pos"] > div:first-child {
        position: relative !important;
      }

      /* Контейнер потока звезд: ширина ограничена положением бегунка */
      .claude-cosmic-gpu-stream {
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        bottom: 0 !important;
        width: 100% !important;
        overflow: hidden !important;
        pointer-events: none !important;
        z-index: 10 !important;
        border-radius: inherit !important;
        display: none;
        transform: translateZ(0) !important;
      }

      /* Аппаратная анимация в GPU Compositor Thread */
      @keyframes cosmic-gpu-warp-flight {
        0% {
          transform: translate3d(-35px, 0, 0);
          opacity: 0;
        }
        12% {
          opacity: 1;
        }
        88% {
          opacity: 1;
        }
        100% {
          transform: translate3d(240px, 0, 0);
          opacity: 0;
        }
      }

      /* Бегунок на Max: фирменное оранжевое неоновое свечение Claude Code */
      div[data-cds="ModelSelectorEffort"] [data-cds="Slider"][data-effort-level="max"] [data-slider-carriage] > span:first-child,
      div[data-cds="ModelSelectorEffort"] [data-cds="Slider"][data-at-max] [data-slider-carriage] > span:first-child {
        border-color: #ffedd5 !important;
        box-shadow: 0 0 10px #f97316, 0 0 22px #ea580c, 0 0 36px rgba(218, 119, 86, 0.8) !important;
        animation: cosmic-claude-orange-glow 1.5s infinite alternate ease-in-out !important;
      }

      @keyframes cosmic-claude-orange-glow {
        0% {
          box-shadow: 0 0 8px #f97316, 0 0 18px #ea580c, 0 0 28px rgba(218, 119, 86, 0.65);
        }
        100% {
          box-shadow: 0 0 14px #ffedd5, 0 0 26px #f97316, 0 0 40px rgba(234, 88, 12, 0.95);
        }
      }
    `;
  }

  // --- 2. Generate Hardware GPU Star DOM Nodes ---
  function createGpuStarfield(container) {
    let stream = container.querySelector('.claude-cosmic-gpu-stream');
    if (stream) return stream;

    stream = document.createElement('div');
    stream.className = 'claude-cosmic-gpu-stream';

    const starConfigs = [
      { color: '#ffffff', glow: 'rgba(255, 255, 255, 0.8)' },
      { color: '#fef08a', glow: 'rgba(250, 204, 21, 0.75)' },
      { color: '#fb923c', glow: 'rgba(251, 146, 60, 0.8)' },
      { color: '#f97316', glow: 'rgba(249, 115, 22, 0.85)' }
    ];

    const numStars = 32;
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < numStars; i++) {
      const cfg = starConfigs[i % starConfigs.length];
      const star = document.createElement('span');

      const width = Math.floor(Math.random() * 12 + 12); // 12px - 24px
      const top = Math.floor(Math.random() * 14 + 3);     // 3px - 17px
      const duration = (0.36 + Math.random() * 0.2).toFixed(2); // 0.36s - 0.56s
      const delay = (-Math.random() * 0.55).toFixed(2);

      star.style.cssText = `
        position: absolute;
        top: ${top}px;
        left: 0;
        width: ${width}px;
        height: 2px;
        border-radius: 9999px;
        pointer-events: none;
        background: linear-gradient(90deg, transparent, ${cfg.color} 55%, #ffffff 100%);
        box-shadow: 0 0 4px ${cfg.glow};
        will-change: transform;
        transform: translate3d(-35px, 0, 0);
        animation: cosmic-gpu-warp-flight ${duration}s linear infinite;
        animation-delay: ${delay}s;
      `;

      fragment.appendChild(star);
    }

    stream.appendChild(fragment);
    container.appendChild(stream);
    return stream;
  }

  // --- 3. Robust Resolver & State Controller ---
  let isMounted = false;
  let activePopup = null;

  function findSliderElements(popup) {
    const sliderRoot = popup.querySelector('[data-cds="Slider"]');
    if (!sliderRoot) return null;

    let control = sliderRoot.querySelector('[style*="--cds-slider-pos"]') ||
                  sliderRoot.querySelector('[data-base-ui-slider-control]');

    if (!control) {
      const carriage = sliderRoot.querySelector('[data-slider-carriage]');
      if (carriage) {
        control = carriage.closest('[style*="--cds-slider-pos"]') || carriage.parentElement.parentElement;
      }
    }
    if (!control) control = sliderRoot.firstElementChild;
    if (!control) return null;

    const track = control.querySelector('div:first-child') || control;
    return { sliderRoot, control, track };
  }

  function setupSlider(popup) {
    if (isMounted && activePopup === popup && document.body.contains(popup)) {
      return;
    }

    const els = findSliderElements(popup);
    if (!els) return;

    const { sliderRoot, control, track } = els;
    isMounted = true;
    activePopup = popup;

    const stream = createGpuStarfield(track);

    function syncState() {
      if (!document.body.contains(popup)) return;

      const rawPos = control.style.getPropertyValue('--cds-slider-pos');
      const pos = parseFloat(rawPos) || 0;
      const isAtMax = sliderRoot.hasAttribute('data-at-max') || pos >= 0.95;

      sliderRoot.setAttribute('data-effort-level', isAtMax ? 'max' : 'normal');

      if (isAtMax) {
        stream.style.display = 'block';

        // Вычисляем ширину контейнера звезд строго до бегунка
        const trackWidth = track.offsetWidth || 180;
        const handleInset = 10;
        const usable = Math.max(10, trackWidth - handleInset * 2);
        const thumbX = Math.round(handleInset + pos * usable);

        stream.style.width = thumbX + 'px';
      } else {
        stream.style.display = 'none';
      }
    }

    syncState();

    const controlObserver = new MutationObserver(() => {
      syncState();
    });

    controlObserver.observe(control, { attributes: true, attributeFilter: ['style'] });
    controlObserver.observe(sliderRoot, { attributes: true, attributeFilter: ['data-at-max'] });

    control.addEventListener('pointermove', syncState, { passive: true });
    control.addEventListener('pointerdown', syncState, { passive: true });
  }

  // --- 4. Global DOM Watcher ---
  function init() {
    injectCosmicStyles();

    let checkPending = false;
    function check() {
      if (checkPending) return;
      checkPending = true;
      requestAnimationFrame(() => {
        checkPending = false;
        const popup = document.querySelector('div[data-cds="ModelSelectorEffort"]:not(button)');
        if (popup) {
          setupSlider(popup);
        } else {
          isMounted = false;
          activePopup = null;
        }
      });
    }

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.addedNodes.length > 0 || m.removedNodes.length > 0) {
          check();
          break;
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    document.addEventListener('pointerdown', check, { passive: true });
    document.addEventListener('keydown', check, { passive: true });

    check();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
