<script setup>
// Vue port of the 21st.dev "Kiln Wordmark Footer": a coloured closing panel with a motto, back-to-top key,
// link columns, a giant wordmark drawn from a procedural alphabet (letters swell under the pointer, press
// flat on click, rise in when first seen) and a "tile" behind it all (a disc that leans toward the pointer;
// click any empty part of the panel to turn to the next composition).
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { lenis } from '@/lib/lenis'
import { TILES, approach, clamp, glyphPath, layoutWord, leanTile, lensWeights, n1, nextTile, supported } from '@/lib/kilnGlyphs'

const props = defineProps({
  brand: { type: String, default: 'Brand' },
  wordmark: { type: String, default: '' },
  motto: { type: Array, default: () => [] },
  contactTitle: { type: String, default: 'Contact' },
  contactLines: { type: Array, default: () => [] },
  email: { type: String, default: '' },
  navigationTitle: { type: String, default: 'Navigation' },
  navigation: { type: Array, default: () => [] }, // columns of { label, to | href, external }
  followTitle: { type: String, default: 'Follow' },
  socials: { type: Array, default: () => [] },
  year: { type: Number, default: () => new Date().getFullYear() },
  registry: { type: String, default: '' },
  legal: { type: Array, default: () => [] },
  colors: { type: Object, default: () => ({ surface: '#8a5a3c', deep: '#2a1810', ink: '#f1e4d3', paper: '#2a1810' }) },
  fontSans: { type: String, default: 'var(--sans, "Helvetica Neue", Helvetica, Arial, system-ui, sans-serif)' },
  weight: { type: Number, default: 1 }, // wordmark weight, 1 = reference
  lens: { type: Boolean, default: true }, // letters swell under the pointer
  defaultTile: { type: Number, default: 0 },
})
const emit = defineEmits(['tile-change'])

const BOOST = 0.42
const word = computed(() => (props.wordmark || props.brand).toLowerCase())
const drawn = computed(() => supported(word.value))
const lay = computed(() => layoutWord(drawn.value ? word.value : ''))
const centres = computed(() => lay.value.letters.map((l) => l.x + l.w / 2))
const base = computed(() => clamp(Number.isFinite(props.weight) ? props.weight : 1, 0.5, 1.4))
const vbH = computed(() => lay.value.bottom - lay.value.top)
const wordViewBox = computed(() => `0 ${lay.value.top} ${lay.value.width} ${vbH.value}`)
const vars = computed(() => ({
  '--kwf-surface': props.colors.surface,
  '--kwf-deep': props.colors.deep,
  '--kwf-ink': props.colors.ink,
  '--kwf-paper': props.colors.paper,
  '--kwf-sans': props.fontSans,
}))

const rootRef = ref(null)
const tileRef = ref(null)
const discRef = ref(null)
const slabRef = ref(null)
const shown = ref(false)
let pathEls = []
const setPath = (el, i) => {
  pathEls[i] = el
}

let tileIndex = ((Math.trunc(props.defaultTile) % TILES.length) + TILES.length) % TILES.length || 0

// Everything the animation loop owns. Written straight to the DOM, so a pointer sweep never re-renders Vue.
const a = {
  k: [],
  kT: [],
  cur: { ...TILES[tileIndex] },
  target: { ...TILES[tileIndex] },
  lean: [0, 0],
  size: { w: 960, h: 540 },
  reduced: false,
  raf: 0,
  last: 0,
}

function resetWeights() {
  a.k = lay.value.letters.map(() => base.value)
  a.kT = lay.value.letters.map(() => base.value)
}
resetWeights()

function paint() {
  const { w, h } = a.size
  tileRef.value?.setAttribute('viewBox', `0 0 ${w} ${h}`)
  const d = discRef.value
  if (d) {
    d.setAttribute('cx', n1(a.cur.cx * w))
    d.setAttribute('cy', n1(a.cur.cy * h))
    d.setAttribute('rx', n1(a.cur.r * w))
    d.setAttribute('ry', n1(a.cur.r * w))
  }
  const s = slabRef.value
  if (s) {
    s.setAttribute('x', n1(a.cur.sx * w))
    s.setAttribute('width', n1(Math.max(0, a.cur.sw * w)))
    s.setAttribute('height', h)
  }
  lay.value.letters.forEach((l, i) => {
    const p = pathEls[i]
    if (p) p.setAttribute('d', glyphPath(l.ch, a.k[i], l.x))
  })
}

function kick() {
  if (a.raf) return
  a.last = 0
  const step = (now) => {
    const dt = a.last ? (now - a.last) / 1000 : 1 / 60
    a.last = now
    const snap = a.reduced
    let busy = false
    const goal = leanTile(a.target, a.lean[0], a.lean[1])
    for (const key of ['cx', 'cy', 'r', 'sx', 'sw']) {
      const next = snap ? goal[key] : approach(a.cur[key], goal[key], 0.075, dt)
      a.cur[key] = Math.abs(next - goal[key]) < 1e-4 ? goal[key] : next
      if (a.cur[key] !== goal[key]) busy = true
    }
    for (let i = 0; i < a.k.length; i++) {
      const next = snap ? a.kT[i] : approach(a.k[i], a.kT[i], 0.16, dt)
      a.k[i] = Math.abs(next - a.kT[i]) < 1e-3 ? a.kT[i] : next
      if (a.k[i] !== a.kT[i]) busy = true
    }
    paint()
    a.raf = busy ? requestAnimationFrame(step) : 0
  }
  a.raf = requestAnimationFrame(step)
}

let ro = null
let io = null
let mq = null
const onMq = () => {
  a.reduced = !!mq?.matches
}

onMounted(() => {
  const el = rootRef.value
  mq = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null
  a.reduced = !!mq?.matches
  mq?.addEventListener('change', onMq)

  ro = new ResizeObserver(([entry]) => {
    a.size = { w: Math.max(1, Math.round(entry.contentRect.width)), h: Math.max(1, Math.round(entry.contentRect.height)) }
    paint()
  })
  ro.observe(el)

  if (typeof IntersectionObserver === 'function') {
    io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          shown.value = true
          io?.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    io.observe(el)
  } else shown.value = true

  a.size = { w: Math.max(1, el.clientWidth), h: Math.max(1, el.clientHeight) }
  paint()
})

onBeforeUnmount(() => {
  ro?.disconnect()
  io?.disconnect()
  mq?.removeEventListener('change', onMq)
  cancelAnimationFrame(a.raf)
  a.raf = 0
})

// New word: every letter starts at the base weight.
watch(lay, async () => {
  resetWeights()
  await nextTick()
  paint()
})
// The weight prop moves every resting letter.
watch(base, () => {
  a.kT = a.kT.map(() => base.value)
  kick()
})

function turnTile() {
  tileIndex = nextTile(tileIndex)
  a.target = { ...TILES[tileIndex] }
  kick()
  emit('tile-change', tileIndex)
}
function onRootMove(e) {
  if (e.pointerType === 'touch') return
  const r = e.currentTarget.getBoundingClientRect()
  a.lean = [((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1]
  kick()
}
function onRootLeave() {
  a.lean = [0, 0]
  kick()
}
function onRootClick(e) {
  // Links, the key and the wordmark have their own clicks; text selection isn't a turn.
  if (e.target.closest('a,button,.kwf-word')) return
  if (window.getSelection?.()?.toString()) return
  turnTile()
}
function onWordMove(e) {
  if (!props.lens || !lay.value.width) return
  const r = e.currentTarget.getBoundingClientRect()
  const x = ((e.clientX - r.left) / r.width) * lay.value.width
  a.kT = lensWeights(centres.value, x, base.value, BOOST, 150)
  kick()
}
function onWordLeave() {
  a.kT = lensWeights(centres.value, null, base.value, BOOST, 150)
  kick()
}
function stamp(i) {
  a.k[i] = Math.min(1.6, a.k[i] + 0.55)
  kick()
  const p = pathEls[i]
  if (p && !a.reduced && typeof p.animate === 'function') {
    p.animate(
      [
        { transform: 'none' },
        { transform: 'scale(1.05, 0.8)', offset: 0.25 },
        { transform: 'scale(0.98, 1.05)', offset: 0.6 },
        { transform: 'none' },
      ],
      { duration: 620, easing: 'cubic-bezier(.3,.7,.3,1)' },
    )
  }
}
const backToTop = () => lenis.scrollTo(0, a.reduced ? { immediate: true } : { duration: 2.2 })
</script>

<template>
  <footer ref="rootRef" class="kwf" :class="{ 'kwf-shown': shown }" :style="vars" @pointermove="onRootMove"
    @pointerleave="onRootLeave" @click="onRootClick">
    <svg ref="tileRef" class="kwf-tile" viewBox="0 0 960 540" preserveAspectRatio="none" aria-hidden="true">
      <ellipse ref="discRef" fill="var(--kwf-surface)" />
      <rect ref="slabRef" y="0" fill="var(--kwf-surface)" />
    </svg>

    <div class="kwf-in-wrap">
      <div class="kwf-top">
        <h2 class="kwf-motto kwf-fade" style="--kwf-d: 45ms">
          <span v-for="(line, i) in motto" :key="i">{{ line }}</span>
        </h2>
        <button type="button" class="kwf-key kwf-fade" style="--kwf-d: 90ms" aria-label="Back to top"
          @click="backToTop">
          <svg viewBox="0 0 24 34" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path d="M12 33V2M2 12 12 2l10 10" />
          </svg>
        </button>
      </div>

      <div class="kwf-row">
        <div class="kwf-col kwf-addr kwf-fade" style="--kwf-d: 135ms">
          <h3>{{ contactTitle }}</h3>
          <p v-for="(line, i) in contactLines" :key="i">{{ line }}</p>
          <p v-if="email"><a class="kwf-link" :href="`mailto:${email}`">{{ email }}</a></p>
        </div>

        <nav class="kwf-col kwf-nav kwf-fade" style="--kwf-d: 180ms" :aria-label="navigationTitle">
          <h3>{{ navigationTitle }}</h3>
          <div class="kwf-cols">
            <ul v-for="(col, i) in navigation" :key="i">
              <li v-for="link in col" :key="link.label">
                <RouterLink v-if="link.to" :to="link.to" class="kwf-link">{{ link.label }}</RouterLink>
                <a v-else class="kwf-link" :href="link.href" :target="link.external ? '_blank' : null"
                  :rel="link.external ? 'noopener' : null">{{ link.label }}</a>
              </li>
            </ul>
          </div>
        </nav>

        <div class="kwf-col kwf-fade" style="--kwf-d: 225ms">
          <h3>{{ followTitle }}</h3>
          <div class="kwf-cols">
            <ul v-for="(col, i) in socials" :key="i">
              <li v-for="link in col" :key="link.label">
                <a class="kwf-link" :href="link.href" :target="link.external ? '_blank' : null"
                  :rel="link.external ? 'noopener' : null">{{ link.label }}</a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <p class="sr-only">{{ word }}</p>
      <svg v-if="drawn" class="kwf-word" :viewBox="wordViewBox" aria-hidden="true" @pointermove="onWordMove"
        @pointerleave="onWordLeave">
        <g v-for="(l, i) in lay.letters" :key="i + l.ch" class="kwf-l" :style="{ '--kwf-d': 140 + i * 70 + 'ms' }">
          <path :ref="(el) => setPath(el, i)" :d="glyphPath(l.ch, base, l.x)" fill="var(--kwf-ink)" @click="stamp(i)" />
        </g>
      </svg>
      <svg v-else class="kwf-word" viewBox="0 0 1000 200" aria-hidden="true">
        <text x="0" y="168" textLength="1000" lengthAdjust="spacingAndGlyphs" font-size="200" font-weight="900"
          fill="var(--kwf-ink)" :style="{ fontFamily: fontSans }">{{ word }}</text>
      </svg>

      <div class="kwf-bar kwf-fade" style="--kwf-d: 270ms">
        <p class="kwf-copy">©{{ year }} {{ brand }}</p>
        <p class="kwf-reg">{{ registry }}</p>
        <p class="kwf-legal">
          <template v-for="(link, i) in legal" :key="link.label">
            <span v-if="i > 0" aria-hidden="true">—</span>
            <RouterLink v-if="link.to" :to="link.to" class="kwf-link">{{ link.label }}</RouterLink>
            <a v-else class="kwf-link" :href="link.href" :target="link.external ? '_blank' : null"
              :rel="link.external ? 'noopener' : null">{{ link.label }}</a>
          </template>
        </p>
      </div>
    </div>
  </footer>
</template>

<style>
.kwf {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  container-type: inline-size;
  color: var(--kwf-ink);
  background: var(--kwf-deep);
  font-family: var(--kwf-sans);
  -webkit-font-smoothing: antialiased;
  text-transform: uppercase
}

:where(.kwf) a {
  color: inherit;
  text-decoration: none
}

:where(.kwf) button {
  font: inherit;
  color: inherit;
  background: none;
  border: 0;
  padding: 0;
  margin: 0;
  cursor: pointer
}

:where(.kwf) p,
:where(.kwf) ul,
:where(.kwf) h2,
:where(.kwf) h3 {
  margin: 0;
  padding: 0
}

:where(.kwf) ul {
  list-style: none
}

.kwf .sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap
}

.kwf-tile {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  max-width: none;
  z-index: -1;
  display: block;
  pointer-events: none
}

.kwf-in-wrap {
  position: relative;
  padding: 1.5cqw 1.5cqw 1.5cqw
}

.kwf-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2cqw;
  min-height: 26cqw
}

.kwf-motto {
  font-size: clamp(20px, 3.15cqw, 52px);
  line-height: .94;
  font-weight: 500;
  letter-spacing: -.012em
}

.kwf-motto span {
  display: block
}

.kwf-key {
  position: relative;
  flex: none;
  width: clamp(28px, 3.15cqw, 46px);
  height: clamp(54px, 6.3cqw, 92px);
  border-radius: clamp(6px, .8cqw, 12px);
  background: var(--kwf-ink);
  color: var(--kwf-paper);
  overflow: hidden;
  display: grid;
  place-items: center;
  transition: transform .35s cubic-bezier(.2, .8, .2, 1), border-radius .35s
}

.kwf-key:hover {
  transform: translateY(-3px);
  border-radius: 999px
}

.kwf-key:active {
  transform: translateY(1px) scale(.96)
}

.kwf-key svg {
  width: 62%;
  height: auto;
  max-width: none;
  display: block;
  overflow: visible
}

.kwf-key:hover svg,
.kwf-key:focus-visible svg {
  animation: kwf-shoot .7s cubic-bezier(.6, 0, .2, 1)
}

.kwf-key:focus-visible,
.kwf-link:focus-visible {
  outline: 2px solid var(--kwf-ink);
  outline-offset: 3px
}

@keyframes kwf-shoot {
  0% {
    transform: none
  }

  45% {
    transform: translateY(-160%)
  }

  46% {
    transform: translateY(160%)
  }

  100% {
    transform: none
  }
}

.kwf-row {
  display: grid;
  grid-template-columns: 29.8fr 50.2fr 18fr;
  gap: 1.2cqw;
  font-size: clamp(10px, 1.32cqw, 16px);
  line-height: 1.17;
  letter-spacing: -.005em
}

.kwf-col h3 {
  font-size: inherit;
  font-weight: 700;
  margin-bottom: 1.55em
}

.kwf-cols {
  display: flex;
  gap: .55em 1.1em;
  flex-wrap: wrap
}

.kwf-cols ul {
  display: flex;
  flex-direction: column
}

.kwf-addr p {
  white-space: pre-wrap;
  overflow-wrap: anywhere
}

.kwf-link {
  position: relative;
  display: inline-block;
  padding: 0 .14em;
  margin: 0 -.14em;
  transition: color .25s
}

.kwf-link::before {
  content: '';
  position: absolute;
  inset: -.06em 0;
  background: var(--kwf-ink);
  transform: scaleX(0);
  transform-origin: right;
  transition: transform .35s cubic-bezier(.7, 0, .2, 1);
  z-index: -1
}

.kwf-link:hover,
.kwf-link:focus-visible {
  color: var(--kwf-surface)
}

.kwf-link:hover::before,
.kwf-link:focus-visible::before {
  transform: scaleX(1);
  transform-origin: left
}

.kwf-word {
  display: block;
  width: 100%;
  height: auto;
  max-width: none;
  margin-top: 2.3cqw;
  overflow: hidden;
  touch-action: pan-y;
  cursor: default
}

.kwf-word text {
  text-transform: none
}

.kwf-l {
  transform: translateY(118%);
  transform-box: fill-box;
  transition: transform 1s cubic-bezier(.16, .9, .18, 1);
  transition-delay: var(--kwf-d, 0ms)
}

.kwf-l path {
  transform-box: fill-box;
  transform-origin: 50% 100%;
  cursor: pointer
}

.kwf-shown .kwf-l {
  transform: none
}

.kwf-fade {
  opacity: 0;
  transform: translateY(10px);
  transition: opacity .8s ease, transform .8s cubic-bezier(.2, .8, .2, 1);
  transition-delay: var(--kwf-d, 0ms)
}

.kwf-shown .kwf-fade {
  opacity: 1;
  transform: none
}

.kwf-bar {
  margin-top: 1.45cqw;
  border: 1px solid var(--kwf-ink);
  border-radius: clamp(8px, 1.05cqw, 16px);
  padding: .35cqw 1.15cqw;
  display: flex;
  align-items: center;
  gap: 1.5cqw;
  font-size: clamp(9px, 1.02cqw, 13px)
}

.kwf-copy {
  font-size: clamp(14px, 1.95cqw, 28px);
  letter-spacing: -.01em;
  white-space: nowrap
}

.kwf-reg {
  flex: 1;
  min-width: 0
}

.kwf-legal {
  display: flex;
  gap: .35em;
  white-space: nowrap
}

@container (max-width: 720px) {
  .kwf-in-wrap {
    padding: 16px
  }

  .kwf-top {
    min-height: 44cqw
  }

  .kwf-motto {
    font-size: clamp(22px, 7cqw, 40px)
  }

  .kwf-row {
    grid-template-columns: 1fr 1fr;
    gap: 28px 16px;
    font-size: 12px
  }

  .kwf-addr {
    grid-column: 1 / -1
  }

  .kwf-nav {
    grid-column: 1 / -1;
    grid-row: 2
  }

  .kwf-col h3 {
    margin-bottom: .9em
  }

  .kwf-cols {
    gap: .4em 1.4em
  }

  .kwf-word {
    margin-top: 28px
  }

  .kwf-bar {
    flex-wrap: wrap;
    gap: 4px 14px;
    padding: 10px 14px;
    margin-top: 12px;
    font-size: 10px
  }

  .kwf-reg {
    flex-basis: 100%;
    order: 3
  }
}

@media (prefers-reduced-motion: reduce) {

  .kwf-l,
  .kwf-fade {
    transform: none;
    opacity: 1;
    transition: none
  }

  .kwf-key,
  .kwf-link,
  .kwf-link::before {
    transition: none
  }

  .kwf-key:hover svg,
  .kwf-key:focus-visible svg {
    animation: none
  }
}
</style>
