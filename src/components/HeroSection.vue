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
import { computed, useId } from "vue";
import ShaderBackground from "@/components/ShaderBackground.vue";

const props = defineProps({
  images: { type: Array, default: () => [] }, // [{ src, alt? }]
  cards: { type: Number, default: 9 }, // cards per rail
  speed: { type: Number, default: 18 }, // seconds per full trip
  axis: { type: Number, default: 55 }, // axis height, % of container
  path: { type: Object, default: () => ({}) }, // override PATH below
});

// Reference defaults, fitted to the original recording.
const PATH = {
  perspective: 30,
  cardWidth: 18,
  cardHeight: 25,
  cardRadius: 0.4,
  birthHeight: 2.6,
  exitHeight: 46,
  railBirth: -11,
  railExit: 44,
  fan: 3.3,
  turnBirth: 6,
  turnExit: 28,
  stops: 24,
};

const id = useId().replace(/[^a-zA-Z0-9]/g, "");
const right = `ish-r-${id}`;
const left = `ish-l-${id}`;
const card = `ish-c-${id}`;

const p = computed(() => ({ ...PATH, ...props.path }));

function keyframes(dir, name, p) {
  const steps = [];
  for (let s = 0; s <= p.stops; s++) {
    const u = s / p.stops;
    const scale =
      (p.birthHeight / p.cardHeight) *
      Math.pow(p.exitHeight / p.birthHeight, u);
    const z = p.perspective * (1 - 1 / scale);
    const rail =
      p.railExit - (p.railExit - p.railBirth) * Math.pow(1 - u, p.fan);
    const turn = p.turnBirth + (p.turnExit - p.turnBirth) * u;
    steps.push(
      `${(u * 100).toFixed(2)}%{transform:translate3d(${(dir * rail).toFixed(
        2,
      )}cqw,0,${z.toFixed(2)}cqw) rotateY(${(-dir * turn).toFixed(2)}deg)}`,
    );
  }
  return `@keyframes ${name}{${steps.join("")}}`;
}

const css = computed(
  () =>
    `${keyframes(1, right, p.value)}${keyframes(-1, left, p.value)}` +
    `@media(prefers-reduced-motion:reduce){.${card}{animation-play-state:paused}}`,
);

const perspectiveStyle = computed(() => ({
  perspective: `${p.value.perspective}cqw`,
  perspectiveOrigin: `50% ${props.axis}%`,
}));

const rails = computed(() =>
  [right, left].map((name) => ({
    name,
    items: Array.from({ length: props.cards }, (_, i) => ({
      key: `${name}-${i}`,
      img: props.images[i % Math.max(props.images.length, 1)],
      style: {
        top: `${props.axis}%`,
        width: `${p.value.cardWidth}cqw`,
        height: `${p.value.cardHeight}cqw`,
        marginLeft: `${-p.value.cardWidth / 2}cqw`,
        marginTop: `${-p.value.cardHeight / 2}cqw`,
        borderRadius: `${p.value.cardRadius}cqw`,
        animation: `${name} ${props.speed}s linear infinite`,
        animationDelay: `${-(i * props.speed) / props.cards}s`,
      },
    })),
  })),
);
</script>

<template>
  <div class="ish-root">
    <ShaderBackground />
    <p class="h1text" aria-hidden="true">PHOTOPHACTORY</p>
    <img src="/public/images/logoLoader.png" class="logo" alt="Photophactory Logo" />
    <component :is="'style'">{{ css }}</component>

    <div class="ish-layer" aria-hidden="true" :style="perspectiveStyle">
      <div class="ish-inner">
        <template v-for="rail in rails" :key="rail.name">
          <div v-for="item in rail.items" :key="item.key" :class="[card, 'ish-card']" :style="item.style">
            <img v-if="item.img" class="ish-img" :src="item.img.src" :alt="item.img.alt ?? ''" loading="lazy"
              decoding="async" draggable="false" />
          </div>
          <p class="h2text" aria-hidden="true">Defined by light. Shaped by shadow. Driven by vision.</p>
        </template>
      </div>
    </div>

    <slot />
  </div>
</template>

<style scoped>
/* :where() keeps specificity at zero so a parent's class can override height */
:where(.ish-root) {
  min-height: 100vh;
  background-color: aquamarine;
}

.h1text {
  position: absolute;
  top: 15%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: clamp(1.5rem, 5vw, 3rem);
  font-weight: bold;
  color: #bfbfbf;
  text-shadow: 0 0.5rem 2rem rgba(0, 0, 0, 0.5);
  font-family: 'Tektur';
}

.h2text {
  position: absolute;
  top: 85%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: clamp(1rem, 1.5vw, 2rem);
  font-weight: normal;
  color: #bfbfbf;
  text-shadow: 0 0.5rem 2rem rgba(0, 0, 0, 0.5);
  font-family: 'Tektur';
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
}

.ish-inner {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;

}

.ish-card {
  position: absolute;
  left: 50%;
  overflow: hidden;
  backface-visibility: hidden;
}

.ish-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  max-width: none;
}
</style>