<script setup>
/* ── the corridor ────────────────────────────────────────────────
 * Two rails of cards ride from far behind the screen toward the
 * viewer. Perspective alone makes each card grow *and* sweep outward.
 *
 * 1. Depth is authored as apparent size, geometrically, so
 *    consecutive cards keep a constant size ratio.
 * 2. The rails open hard early and then hold (`fan` > 1).
 * 3. Cards are born across the axis (`railBirth` < 0) so the centre
 *    is always covered, and die with their inner edge past 50cqw.
 *
 * Every length is `cqw` (percent of container width).
 * Layout is plain scoped CSS: no Tailwind needed.
 * ─────────────────────────────────────────────────────────────── */
import { onBeforeUnmount, onMounted, ref } from "vue";
import ShaderCanvas from "@/components/ShaderCanvas.vue";

// ⚡ OPTIMIZED: the corridor geometry (PATH defaults, 9 cards/rail, 18s trip, axis 55%) used to be re-computed
// in JS on every mount and injected through a <component :is="'style'"> tag with per-instance ids.
// It never changed (HomeView only passes `images`), so the exact same keyframes are now plain static CSS
// below - no props/computed/useId, no runtime style injection, identical result.
// To tweak the look, edit the CSS values below (card size, speed, axis) instead of JS props.
defineProps({
  images: { type: Array, default: () => [] }, // [{ src, alt? }]
});

const CARDS = 9; // cards per rail
const SPEED = 18; // seconds per full trip

// ⚡ OPTIMIZED: pause the 18 animated 3D cards while the hero is scrolled out of view
// (CSS animations keep running offscreen otherwise and cost compositor time for nothing).
const root = ref(null);
const offscreen = ref(false);
let io;
onMounted(() => {
  io = new IntersectionObserver(([e]) => (offscreen.value = !e.isIntersecting));
  io.observe(root.value);
});
onBeforeUnmount(() => io?.disconnect());
</script>

<template>
  <div ref="root" class="ish-root" :class="{ 'is-offscreen': offscreen }">
    <ShaderCanvas preset="mesh" />
    <p class="h2text" aria-hidden="true">Defined by light. Shaped by shadow. Driven by vision.</p>
    <!-- ⚡ OPTIMIZED: PNG -> lossless WebP (-35%) + width/height so the logo can't cause a layout shift -->
    <img src="/images/logoLoader.webp" class="logo" width="864" height="710" alt="Photophactory Logo" />

    <div class="ish-layer" aria-hidden="true">
      <div class="ish-inner">
        <template v-for="rail in ['r', 'l']" :key="rail">
          <div
            v-for="i in CARDS"
            :key="rail + i"
            :class="['ish-card', `ish-card--${rail}`]"
            :style="{ animationDelay: `${-((i - 1) * SPEED) / CARDS}s` }"
          >
            <!-- ⚡ OPTIMIZED: small WebP thumbs (see data/heroImages.js); no loading="lazy" - they are tiny,
                 and lazy-loading cards that fly in from off-axis made them pop in late -->
            <img
              v-if="images.length"
              class="ish-img"
              :src="images[(i - 1) % images.length].src"
              :alt="images[(i - 1) % images.length].alt ?? ''"
              decoding="async"
              draggable="false"
            />
          </div>
        </template>
      </div>
    </div>
    <div class="ish-fade" aria-hidden="true" />

    <slot />
  </div>
</template>

<style scoped>
/* ⚡ OPTIMIZED: static keyframes baked from the original PATH formulas (24 stops per rail) */
@keyframes ish-r {
  0.00% { transform: translate3d(-11.00cqw, 0, -258.46cqw) rotateY(-6.00deg); }
  4.17% { transform: translate3d(-3.79cqw, 0, -225.92cqw) rotateY(-6.92deg); }
  8.33% { transform: translate3d(2.73cqw, 0, -197.04cqw) rotateY(-7.83deg); }
  12.50% { transform: translate3d(8.60cqw, 0, -171.43cqw) rotateY(-8.75deg); }
  16.67% { transform: translate3d(13.87cqw, 0, -148.70cqw) rotateY(-9.67deg); }
  20.83% { transform: translate3d(18.56cqw, 0, -128.54cqw) rotateY(-10.58deg); }
  25.00% { transform: translate3d(22.72cqw, 0, -110.65cqw) rotateY(-11.50deg); }
  29.17% { transform: translate3d(26.37cqw, 0, -94.78cqw) rotateY(-12.42deg); }
  33.33% { transform: translate3d(29.57cqw, 0, -80.70cqw) rotateY(-13.33deg); }
  37.50% { transform: translate3d(32.34cqw, 0, -68.21cqw) rotateY(-14.25deg); }
  41.67% { transform: translate3d(34.71cqw, 0, -57.13cqw) rotateY(-15.17deg); }
  45.83% { transform: translate3d(36.73cqw, 0, -47.30cqw) rotateY(-16.08deg); }
  50.00% { transform: translate3d(38.42cqw, 0, -38.58cqw) rotateY(-17.00deg); }
  54.17% { transform: translate3d(39.81cqw, 0, -30.84cqw) rotateY(-17.92deg); }
  58.33% { transform: translate3d(40.94cqw, 0, -23.98cqw) rotateY(-18.83deg); }
  62.50% { transform: translate3d(41.84cqw, 0, -17.89cqw) rotateY(-19.75deg); }
  66.67% { transform: translate3d(42.53cqw, 0, -12.48cqw) rotateY(-20.67deg); }
  70.83% { transform: translate3d(43.06cqw, 0, -7.69cqw) rotateY(-21.58deg); }
  75.00% { transform: translate3d(43.43cqw, 0, -3.44cqw) rotateY(-22.50deg); }
  79.17% { transform: translate3d(43.69cqw, 0, 0.33cqw) rotateY(-23.42deg); }
  83.33% { transform: translate3d(43.85cqw, 0, 3.68cqw) rotateY(-24.33deg); }
  87.50% { transform: translate3d(43.94cqw, 0, 6.65cqw) rotateY(-25.25deg); }
  91.67% { transform: translate3d(43.98cqw, 0, 9.28cqw) rotateY(-26.17deg); }
  95.83% { transform: translate3d(44.00cqw, 0, 11.62cqw) rotateY(-27.08deg); }
  100.00% { transform: translate3d(44.00cqw, 0, 13.70cqw) rotateY(-28.00deg); }
}

@keyframes ish-l {
  0.00% { transform: translate3d(11.00cqw, 0, -258.46cqw) rotateY(6.00deg); }
  4.17% { transform: translate3d(3.79cqw, 0, -225.92cqw) rotateY(6.92deg); }
  8.33% { transform: translate3d(-2.73cqw, 0, -197.04cqw) rotateY(7.83deg); }
  12.50% { transform: translate3d(-8.60cqw, 0, -171.43cqw) rotateY(8.75deg); }
  16.67% { transform: translate3d(-13.87cqw, 0, -148.70cqw) rotateY(9.67deg); }
  20.83% { transform: translate3d(-18.56cqw, 0, -128.54cqw) rotateY(10.58deg); }
  25.00% { transform: translate3d(-22.72cqw, 0, -110.65cqw) rotateY(11.50deg); }
  29.17% { transform: translate3d(-26.37cqw, 0, -94.78cqw) rotateY(12.42deg); }
  33.33% { transform: translate3d(-29.57cqw, 0, -80.70cqw) rotateY(13.33deg); }
  37.50% { transform: translate3d(-32.34cqw, 0, -68.21cqw) rotateY(14.25deg); }
  41.67% { transform: translate3d(-34.71cqw, 0, -57.13cqw) rotateY(15.17deg); }
  45.83% { transform: translate3d(-36.73cqw, 0, -47.30cqw) rotateY(16.08deg); }
  50.00% { transform: translate3d(-38.42cqw, 0, -38.58cqw) rotateY(17.00deg); }
  54.17% { transform: translate3d(-39.81cqw, 0, -30.84cqw) rotateY(17.92deg); }
  58.33% { transform: translate3d(-40.94cqw, 0, -23.98cqw) rotateY(18.83deg); }
  62.50% { transform: translate3d(-41.84cqw, 0, -17.89cqw) rotateY(19.75deg); }
  66.67% { transform: translate3d(-42.53cqw, 0, -12.48cqw) rotateY(20.67deg); }
  70.83% { transform: translate3d(-43.06cqw, 0, -7.69cqw) rotateY(21.58deg); }
  75.00% { transform: translate3d(-43.43cqw, 0, -3.44cqw) rotateY(22.50deg); }
  79.17% { transform: translate3d(-43.69cqw, 0, 0.33cqw) rotateY(23.42deg); }
  83.33% { transform: translate3d(-43.85cqw, 0, 3.68cqw) rotateY(24.33deg); }
  87.50% { transform: translate3d(-43.94cqw, 0, 6.65cqw) rotateY(25.25deg); }
  91.67% { transform: translate3d(-43.98cqw, 0, 9.28cqw) rotateY(26.17deg); }
  95.83% { transform: translate3d(-44.00cqw, 0, 11.62cqw) rotateY(27.08deg); }
  100.00% { transform: translate3d(-44.00cqw, 0, 13.70cqw) rotateY(28.00deg); }
}


@media (prefers-reduced-motion: reduce) {
  .ish-card { animation-play-state: paused; }
}
/* ⚡ OPTIMIZED: no work while the hero is off screen */
.is-offscreen .ish-card { animation-play-state: paused; }

/* :where() keeps specificity at zero so a parent's class can override height */
:where(.ish-root) {
  min-height: 100vh;
  background-color: #031c26;
}

.h2text {
  position: absolute;
  z-index: 3;
  top: 25%;
  left: 50%;
  width: min(90vw, 48rem);
  text-align: center;
  transform: translate(-50%, -50%);
  font-family: var(--sans);
  font-size: clamp(0.8rem, 1.15vw, 1.15rem);
  font-weight: 300;
  /* Thin H2 */
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: rgba(239, 233, 223, 0.78);
  text-shadow:
    2px 3px 5px rgba(0, 0, 0, 0.95),
    0 4px 8px rgba(0, 0, 0, 0.9);
}

.logo {
  position: absolute;
  top: 55%;
  left: 50%;
  width: 20cqw;
  height: auto;
  transform: translate(-50%, -50%);
  z-index: 10;
}

.ish-root {
  position: relative;
  overflow: hidden;
  container-type: inline-size;
}

.ish-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  perspective: 30cqw;
  perspective-origin: 50% 55%;
}

.ish-fade {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  background:
    linear-gradient(to right, #000 0%, transparent 12%, transparent 88%, #000 100%),
    linear-gradient(to bottom, #000 0%, transparent 22%);
}

.ish-inner {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
}

.ish-card {
  position: absolute;
  left: 50%;
  top: 55%;
  width: 18cqw;
  height: 25cqw;
  margin-left: -9cqw;
  margin-top: -12.5cqw;
  border-radius: 0.4cqw;
  overflow: hidden;
  backface-visibility: hidden;
  animation-duration: 18s;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}
.ish-card--r { animation-name: ish-r; }
.ish-card--l { animation-name: ish-l; }

.ish-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  max-width: none;
}
</style>
