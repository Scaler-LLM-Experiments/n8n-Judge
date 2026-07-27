/* =========================================================
   Syntax by Scaler — GSAP motion presets
   GSAP-config equivalents of motion/presets.css, so product
   code using GSAP gets identical timing + easing to the CSS
   utility classes. Durations are in SECONDS (GSAP units);
   eases map to the system's three curves.

   Usage:
     ScalerMotion.reveal('.card', 'fadeUp', { stagger: 0.06 });
     // or read the raw config:
     gsap.from(el, ScalerMotion.presets.scaleIn);

   If gsap + CustomEase are loaded, the exact cubic-beziers are
   registered; otherwise the nearest stock ease name is used.
   ========================================================= */
(function (root) {
  // System easings (mirror --ease-* tokens). [cssCubicBezier, gsapStockFallback]
  var EASES = {
    standard: { css: '0.22, 1.00, 0.36, 1.00', gsap: 'power3.out' },   // everyday
    entrance: { css: '0.16, 1.00, 0.30, 1.00', gsap: 'expo.out' },     // dramatic settle
    soft:     { css: '0.45, 0.05, 0.55, 0.95', gsap: 'sine.inOut' },   // continuous
  };

  // Durations (mirror --dur-* tokens), in seconds.
  var DUR = { d1: 0.08, d2: 0.12, d3: 0.18, d4: 0.24, d5: 0.36, d6: 0.6 };

  function ease(name) {
    var e = EASES[name];
    if (root.gsap && root.CustomEase) {
      var id = 'scl-' + name;
      try { root.CustomEase.create(id, 'M0,0 C' + e.css.replace(/,\s*/g, ',') + ' 1,1'); return id; } catch (_) {}
    }
    return e.gsap;
  }

  // Each preset = the `from` state GSAP tweens out of, + duration + ease.
  var presets = {
    fadeIn:     { opacity: 0,                          duration: DUR.d4, ease: ease('standard') },
    fadeUp:     { opacity: 0, y: 16,                   duration: DUR.d4, ease: ease('entrance') },
    fadeDown:   { opacity: 0, y: -16,                  duration: DUR.d4, ease: ease('entrance') },
    scaleIn:    { opacity: 0, scale: 0.96,             duration: DUR.d4, ease: ease('entrance') },
    slideRight: { opacity: 0, x: -24,                  duration: DUR.d4, ease: ease('standard') },
    slideLeft:  { opacity: 0, x: 24,                   duration: DUR.d4, ease: ease('standard') },
    blurIn:     { opacity: 0, filter: 'blur(8px)',     duration: DUR.d5, ease: ease('standard') },
    rise:       { opacity: 0, y: 32,                   duration: DUR.d5, ease: ease('entrance') },
  };

  function prefersReduced() {
    return root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // Convenience: reveal target(s) from a preset, with optional stagger/delay.
  function reveal(target, presetName, opts) {
    opts = opts || {};
    var cfg = Object.assign({}, presets[presetName] || presets.fadeUp);
    if (opts.stagger != null) cfg.stagger = opts.stagger;
    if (opts.delay != null) cfg.delay = opts.delay;
    if (prefersReduced() || !root.gsap) return null; // end-state is the base; nothing to do
    return root.gsap.from(target, cfg);
  }

  root.ScalerMotion = { EASES: EASES, DUR: DUR, presets: presets, reveal: reveal };
})(typeof window !== 'undefined' ? window : this);
