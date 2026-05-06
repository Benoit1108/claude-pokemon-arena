<template>
  <div class="min-h-screen surface-bg text-primary font-mono transition-colors duration-150">
    <!-- Floating theme toggle, top-right -->
    <div class="fixed top-4 right-4 z-50">
      <ColorModeToggle />
    </div>
    <NuxtPage />
  </div>
</template>

<style>
/*
 * Page transition "gb-dither" — Configured globally via nuxt.config.ts
 * (app.pageTransition). The leaving page briefly desaturates + scales-in
 * while fading out, the entering page reverses it. Combined with a low-opacity
 * pixel-grid overlay during the transition, it gives a subtle GameBoy-screen
 * feel without slowing navigation. CSS-only, no JS animation lib.
 */
.gb-dither-enter-active,
.gb-dither-leave-active {
  transition:
    opacity 0.22s ease-out,
    transform 0.22s ease-out,
    filter 0.22s ease-out;
}
.gb-dither-enter-from {
  opacity: 0;
  transform: scale(0.98);
  filter: contrast(1.4) saturate(0.4);
}
.gb-dither-leave-to {
  opacity: 0;
  transform: scale(1.02);
  filter: contrast(1.4) saturate(0.4);
}

/*
 * Subtle 2px scanline-style overlay that fades in/out with the page.
 * Pure CSS pattern (alternating rgba lines), only visible at low opacity
 * during the transition.
 */
.gb-dither-enter-active::after,
.gb-dither-leave-active::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 100;
  background-image: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.06) 0,
    rgba(0, 0, 0, 0.06) 1px,
    transparent 1px,
    transparent 2px
  );
  opacity: 0;
  animation: gb-dither-scanlines 0.22s ease-out;
}
@keyframes gb-dither-scanlines {
  0% {
    opacity: 0;
  }
  50% {
    opacity: 0.7;
  }
  100% {
    opacity: 0;
  }
}

/* Respect prefers-reduced-motion : flat fade, no scale/filter/scanlines. */
@media (prefers-reduced-motion: reduce) {
  .gb-dither-enter-active,
  .gb-dither-leave-active {
    transition: opacity 0.15s ease-out;
  }
  .gb-dither-enter-from,
  .gb-dither-leave-to {
    transform: none;
    filter: none;
  }
  .gb-dither-enter-active::after,
  .gb-dither-leave-active::after {
    display: none;
  }
}
</style>
