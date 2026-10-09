<script setup>
// Vue port of the "Typer" text-reveal (21st.dev). Each glyph rolls through a few
// random visual states (fill / inverse / accent / border) before settling.
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  text: { type: [String, Array], required: true },
  fps: { type: Number, default: 20 },
  cycles: { type: Number, default: 3 },
  cycleLength: { type: Number, default: 0.5 },
  stagger: { type: Number, default: 0.15 },
  startOnView: { type: Boolean, default: true },
  delay: { type: Number, default: 0 }, // seconds to wait before the reveal starts (e.g. while a page curtain is still up)
  accent: { type: String, default: '#c9a86a' },
  accentInk: { type: String, default: '#0a0a10' },
  fg: { type: String, default: '' },
  bg: { type: String, default: '#0a0a10' },
  radius: { type: String, default: '5px' },
})
const emit = defineEmits(['complete'])

const root = ref(null)
let group = null
let observer = null
let startTimer = 0

// ---------- math helpers ----------
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi)
const roundToStep = (v, step) => Math.round(v / step) * step
const remap = (v, inLo, inHi, outLo, outHi) => ((v - inLo) * (outHi - outLo)) / (inHi - inLo) + outLo

function bezierEase(x, x1, y1, x2, y2, eps = 1e-6) {
  const bx = (t) => 3 * (1 - t) ** 2 * t * x1 + 3 * (1 - t) * t ** 2 * x2 + t ** 3
  const by = (t) => 3 * (1 - t) ** 2 * t * y1 + 3 * (1 - t) * t ** 2 * y2 + t ** 3
  const bxDeriv = (t) => 3 * (1 - t) ** 2 * x1 + 6 * (1 - t) * t * (x2 - x1) + 3 * t ** 2 * (1 - x2)
  let t = x
  for (let i = 0; i < 8; i++) {
    const dx = bx(t) - x
    if (Math.abs(dx) < eps) return by(t)
    const d = bxDeriv(t)
    if (Math.abs(d) < 1e-6) break
    t -= dx / d
  }
  let lo = 0
  let hi = 1
  t = x
  let guard = 0
  while (lo < hi && guard++ < 60) {
    const cx = bx(t)
    if (Math.abs(cx - x) < eps) return by(t)
    if (cx < x) lo = t
    else hi = t
    t = (lo + hi) / 2
  }
  return by(t)
}

const ALL_VARIATIONS = ['charFill', 'charInverse', 'charAccent', 'charAccentInverse', 'charAccentFill', 'charBorder']
const WHITESPACE_SPLIT_RE = /(\s+)/
const WHITESPACE_RE = /\s/g
const SPACE_REPLACE_RE = / /g

// ---------- engine (one per line) ----------
class TyperEngine {
  constructor(element, opts = {}) {
    this.element = element
    this.source = element.textContent || ''
    this.length = this.source.replace(WHITESPACE_RE, '').length
    this.fps = opts.fps ?? 20
    this.cycles = opts.cycles ?? 3
    this.cycleLength = opts.cycleLength ?? 0.5
    this.frames = this.length ? this.fps * (1 + this.length * 0.01) : 0
    this.delay = opts.delay ?? 0
    this.divisor = this.length > 1 ? this.length - 1 : 1
    this.denominator = this.frames - this.frames * this.cycleLength || 1
    this.onComplete = opts.onComplete
    this.initVisible = opts.initVisible ?? false
    this.variations = ALL_VARIATIONS.slice()
    this.frame = 0
    this.loop = null
    this.delayTimer = null
    this.charNodes = []
    this.type = 'initial'
    this.shuffle()

    if (this.length) {
      this.build()
      if (this.initVisible) {
        for (const n of this.charNodes) this.setClass(n, 'char')
        this.type = 'done'
        this.element.dataset.typerType = 'done'
      } else {
        this.applyFrame()
        this.element.dataset.typerType = 'initial'
      }
    }
  }

  build() {
    this.element.replaceChildren()
    this.charNodes = []
    const parts = this.source.split(WHITESPACE_SPLIT_RE)
    let i = 0
    for (const part of parts) {
      if (part.trim() === '') {
        const space = document.createElement('span')
        space.className = 'space'
        space.textContent = part.replace(SPACE_REPLACE_RE, '\u00A0')
        this.element.appendChild(space)
        continue
      }
      const word = document.createElement('span')
      word.className = 'word'
      for (const ch of Array.from(part)) {
        const pos = i / this.divisor
        const cp = roundToStep(bezierEase(pos, 0, 0.75, 0.75, 0), 0.05)
        const span = document.createElement('span')
        span.className = 'char charInit'
        span.textContent = ch
        this.charNodes.push({ el: span, cp, currentClass: 'char charInit' })
        i += 1
        word.appendChild(span)
      }
      this.element.appendChild(word)
    }
  }

  in() {
    this.setType('in')
  }

  setType(t) {
    if (t === this.type) return
    this.type = t
    this.element.dataset.typerType = t
    this.stopLoop()
    this.frame = 0
    this.applyFrame()
    if (t !== 'initial' && this.charNodes.length) this.startLoop()
  }

  startLoop() {
    if (this.loop || this.delayTimer || !this.charNodes.length || this.type === 'initial') return
    this.shuffle()
    const begin = () => {
      this.delayTimer = null
      if (this.loop || this.type === 'initial') return
      this.applyFrame()
      this.loop = window.setInterval(() => this.tick(), 1000 / this.fps)
    }
    if (this.delay > 0) this.delayTimer = window.setTimeout(begin, this.delay * 1000)
    else begin()
  }

  stopLoop() {
    if (this.delayTimer) {
      window.clearTimeout(this.delayTimer)
      this.delayTimer = null
    }
    if (this.loop) {
      window.clearInterval(this.loop)
      this.loop = null
    }
  }

  tick() {
    this.frame = clamp(this.frame + 1, 0, this.frames)
    this.applyFrame()
    if (this.frame >= this.frames) {
      this.stopLoop()
      this.type = 'done'
      this.element.dataset.typerType = 'done'
      this.onComplete?.()
    }
  }

  resolveClass(p) {
    if (p <= 0) return 'char charInit'
    if (p >= 1) return 'char'
    const idx = Math.round(remap(p, 0, 1, 0, this.cycles))
    const variation = this.variations[idx % this.variations.length]
    return variation ? `char ${variation}` : 'char'
  }

  applyFrame() {
    if (!(this.length && this.charNodes.length)) return
    if (this.type === 'initial') {
      for (const n of this.charNodes) this.setClass(n, 'char charInit')
      return
    }
    const progress = this.frame / this.denominator
    for (const node of this.charNodes) {
      let p = progress - node.cp
      p = clamp(roundToStep(p, 0.1), 0, 1)
      this.setClass(node, this.resolveClass(p))
    }
  }

  setClass(node, cls) {
    if (cls === node.currentClass) return
    node.currentClass = cls
    node.el.className = cls
  }

  shuffle() {
    this.variations.sort(() => 0.5 - Math.random())
  }

  destroy() {
    this.stopLoop()
    this.element.textContent = this.source
    this.element.removeAttribute('data-typer-type')
  }
}

class TyperGroup {
  constructor(elements, opts, stagger) {
    this.typers = elements.map((el, i) => new TyperEngine(el, { ...opts, delay: i * stagger }))
  }
  in() {
    this.typers.forEach((t) => t.in())
  }
  destroy() {
    this.typers.forEach((t) => t.destroy())
  }
}

// ---------- mount ----------
onMounted(() => {
  const el = root.value
  if (!el) return
  const lines = Array.isArray(props.text) ? props.text : [props.text]
  // Engine owns each line's children, so build the line elements imperatively (not via v-for).
  const lineEls = lines.map((line) => {
    const span = document.createElement('span')
    span.setAttribute('data-typer', '')
    span.setAttribute('aria-hidden', 'true')
    span.textContent = line
    el.appendChild(span)
    return span
  })
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  group = new TyperGroup(
    lineEls,
    {
      fps: props.fps,
      cycles: props.cycles,
      cycleLength: props.cycleLength,
      initVisible: reduced,
      onComplete: () => emit('complete'),
    },
    props.stagger,
  )
  if (reduced) return
  const start = () => {
    startTimer = window.setTimeout(() => group?.in(), props.delay * 1000)
  }
  if (!props.startOnView) return start()
  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        start()
        observer?.disconnect()
        observer = null
      }
    },
    { threshold: 0.2 },
  )
  observer.observe(el)
})

onBeforeUnmount(() => {
  clearTimeout(startTimer)
  observer?.disconnect()
  group?.destroy()
  group = null
})
</script>

<template>
  <div
    ref="root"
    class="typer"
    :style="{
      '--typer-accent': accent,
      '--typer-accent-ink': accentInk,
      '--typer-bg': bg,
      '--typer-radius': radius,
      ...(fg ? { '--typer-fg': fg } : {}),
    }"
  >
    <span class="typer-sr">{{ Array.isArray(text) ? text.join(' ') : text }}</span>
  </div>
</template>

<style>
.typer-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
.typer {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
[data-typer] {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
}
[data-typer][data-typer-type='initial'] {
  opacity: 0;
}
[data-typer] .word {
  white-space: pre;
  display: inline-block;
}
[data-typer] .space {
  white-space: pre;
  display: inline-block;
  flex-shrink: 0;
  width: var(--typer-space-width, 0.28em);
}
[data-typer] .word .char {
  box-sizing: content-box;
  display: inline-block;
  color: var(--typer-fg, var(--bone, currentColor));
  background: transparent;
  transition: none;
}
[data-typer] .word .char.charInit {
  color: transparent !important;
}
/* ink pill */
[data-typer] .word .char.charFill {
  color: var(--typer-bg, #0a0a10);
  background: var(--typer-fg, var(--bone, currentColor));
  border-radius: var(--typer-radius, 5px);
}
[data-typer] .word .char.charInverse {
  color: var(--typer-bg, #0a0a10);
  background: var(--typer-fg, var(--bone, currentColor));
}
/* accent pill */
[data-typer] .word .char.charAccent {
  color: var(--typer-accent-fg, var(--typer-fg, var(--bone, currentColor)));
  background: var(--typer-accent, #c9a86a);
  border-radius: var(--typer-radius, 5px);
}
[data-typer] .word .char.charAccentInverse {
  color: var(--typer-accent-ink, var(--typer-bg, #0a0a10));
  background: var(--typer-accent, #c9a86a);
  border-radius: var(--typer-radius, 5px);
}
[data-typer] .word .char.charAccentFill {
  color: var(--typer-accent, #c9a86a);
  background: var(--typer-accent, #c9a86a);
  border-radius: var(--typer-radius, 5px);
}
/* merge neighbouring pills of the same kind into one continuous bar */
[data-typer] .word .char.charFill:has(+ .charFill),
[data-typer] .word .char.charAccent:has(+ .charAccent),
[data-typer] .word .char.charAccentInverse:has(+ .charAccentInverse) {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}
[data-typer] .word .char.charFill + .charFill,
[data-typer] .word .char.charAccent + .charAccent,
[data-typer] .word .char.charAccentInverse + .charAccentInverse {
  border-radius: 0;
}
[data-typer] .word .char.charFill + .charFill:has(+ :not(.charFill)),
[data-typer] .word .char.charAccent + .charAccent:has(+ :not(.charAccent)),
[data-typer] .word .char.charAccentInverse + .charAccentInverse:has(+ :not(.charAccentInverse)) {
  border-radius: 0 var(--typer-radius, 5px) var(--typer-radius, 5px) 0;
}
/* outlined */
[data-typer] .word .char.charBorder {
  position: relative;
  color: var(--typer-fg, var(--bone, currentColor));
}
[data-typer] .word .char.charBorder::after {
  content: '';
  display: inline-block;
  position: absolute;
  inset: 0;
  border: 1px solid var(--typer-border, var(--typer-fg, var(--bone, currentColor)));
  border-radius: var(--typer-radius, 5px);
  box-sizing: border-box;
}
[data-typer] .word .char.charBorder:has(+ .charBorder)::after {
  border-right-color: transparent;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}
[data-typer] .word .char.charBorder + .charBorder::after {
  border-left-color: transparent;
  border-right-color: transparent;
  border-radius: 0;
}
[data-typer] .word .char.charBorder + .charBorder:has(+ :not(.charBorder))::after {
  border-left-color: transparent;
  border-right-color: var(--typer-border, var(--typer-fg, var(--bone, currentColor)));
  border-radius: 0 var(--typer-radius, 5px) var(--typer-radius, 5px) 0;
}
@media (prefers-reduced-motion: reduce) {
  [data-typer][data-typer-type='initial'] {
    opacity: 1;
  }
  [data-typer] .word .char.charInit {
    color: var(--typer-fg, var(--bone, currentColor));
  }
}
</style>
