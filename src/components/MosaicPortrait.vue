<script setup>
// "Vignette Bloom" mosaic effect (Canvas2D): the photo is split into a grid of cells,
// each cell's average colour is drawn as a tile, then vignette + bloom are layered on top.
// The tiles ripple outward from the centre ("wave" animation).
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  src: { type: String, required: true },
  alt: { type: String, default: '' },
  cellSize: { type: Number, default: 16 }, // px (CSS pixels, desktop)
  brightness: { type: Number, default: 12 }, // %
  contrast: { type: Number, default: 115 }, // %
  vignette: { type: Number, default: 38 }, // 0-100
  bloom: { type: Number, default: 25 }, // 0-100
  animSpeed: { type: Number, default: 100 }, // 0-100+
  animIntensity: { type: Number, default: 60 }, // 0-100
  background: { type: String, default: '#0a0a10' },
  maxHeightVh: { type: Number, default: 100 },
})

const wrap = ref(null)
const canvas = ref(null)

let img = null
let ctx = null
let dpr = 1
let W = 0 // css px
let H = 0
let cell = 16
let cols = 0
let rows = 0
let colors = null // Uint8ClampedArray, r,g,b per cell (already brightness/contrast adjusted)
let raf = 0
let visible = false
let reduced = false
let ro = null
let io = null
// ⚡ OPTIMIZED: per-cell values that never change are computed once per layout instead of 9,000× per frame
const LIFT_STEPS = 16 // brightness pulse is quantised to 16 levels (a <1% brightness step: invisible)
let dist14 = null // Float32Array: distance from centre * 14, per cell
let styleCache = null // lazily built 'rgb(...)' strings, cols*rows*LIFT_STEPS
let vignetteGrad = null
let lastFrameAt = 0
let frameInterval = 1000 / 30 // ⚡ OPTIMIZED: 30fps (was 60). The wave is slow, so it looks the same.
let costEma = 0
const bloomCanvas = document.createElement('canvas')
const bloomCtx = bloomCanvas.getContext('2d')
let t0 = performance.now()

function layout() {
  if (!img || !wrap.value) return
  const w = wrap.value.clientWidth
  const ratio = img.naturalHeight / img.naturalWidth
  const maxH = (window.innerHeight * props.maxHeightVh) / 100
  W = w
  H = Math.round(Math.min(w * ratio, maxH))
  wrap.value.style.height = H + 'px'
  // ⚡ OPTIMIZED: pixel ratio capped at 1.5 (was 2): ~44% fewer pixels to fill, bloom and vignette every frame
  dpr = Math.min(window.devicePixelRatio || 1, 1.5)
  const c = canvas.value
  c.width = Math.round(W * dpr)
  c.height = Math.round(H * dpr)
  c.style.width = W + 'px'
  c.style.height = H + 'px'
  ctx = c.getContext('2d', { alpha: false }) // ⚡ OPTIMIZED: opaque canvas (the background is painted every frame anyway)
  cell = W < 720 ? Math.max(8, Math.round(props.cellSize * 0.6)) : props.cellSize
  cols = Math.ceil(W / cell)
  rows = Math.ceil(H / cell)
  sample()
  dist14 = new Float32Array(cols * rows)
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const nx = x / cols - 0.5
      const ny = (y / rows - 0.5) * (H / W)
      dist14[y * cols + x] = Math.sqrt(nx * nx + ny * ny) * 14
    }
  }
  styleCache = new Array(cols * rows * LIFT_STEPS)
  vignetteGrad = null
  if (props.vignette > 0) {
    vignetteGrad = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.max(W, H) * 0.75)
    vignetteGrad.addColorStop(0, 'rgba(0,0,0,0)')
    vignetteGrad.addColorStop(1, `rgba(0,0,0,${(props.vignette / 100) * 1.4})`)
  }
  bloomCanvas.width = Math.max(1, Math.round(c.width / 8))
  bloomCanvas.height = Math.max(1, Math.round(c.height / 8))
}

// Average colour per cell: draw the cover-fitted photo into a cols×rows canvas (the browser
// box-filters when downscaling), then read the pixels once.
function sample() {
  const s = document.createElement('canvas')
  s.width = cols
  s.height = rows
  const sc = s.getContext('2d', { willReadFrequently: true })
  sc.imageSmoothingEnabled = true
  sc.imageSmoothingQuality = 'high'
  // cover-fit crop of the source image for a W×H box
  const boxRatio = W / H
  const imgRatio = img.naturalWidth / img.naturalHeight
  let sw = img.naturalWidth
  let sh = img.naturalHeight
  let sx = 0
  let sy = 0
  if (imgRatio > boxRatio) {
    sw = sh * boxRatio
    sx = (img.naturalWidth - sw) / 2
  } else {
    sh = sw / boxRatio
    sy = (img.naturalHeight - sh) * 0.25 // keep faces: bias toward the top
  }
  // two-step downscale for a cleaner average on big sources
  const mid = document.createElement('canvas')
  mid.width = Math.min(sw, cols * 4)
  mid.height = Math.min(sh, rows * 4)
  const mc = mid.getContext('2d')
  mc.imageSmoothingQuality = 'high'
  mc.drawImage(img, sx, sy, sw, sh, 0, 0, mid.width, mid.height)
  sc.drawImage(mid, 0, 0, mid.width, mid.height, 0, 0, cols, rows)
  const data = sc.getImageData(0, 0, cols, rows).data
  const out = new Uint8ClampedArray(cols * rows * 3)
  const b = 1 + props.brightness / 100
  const k = props.contrast / 100
  for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
    for (let c = 0; c < 3; c++) {
      let v = data[i + c] * b
      v = (v - 128) * k + 128
      out[j + c] = v
    }
  }
  colors = out
}

function frame(now) {
  raf = 0
  if (!ctx || !colors) return
  // ⚡ OPTIMIZED: frame-rate cap. Skip this rAF if the last drawn frame is too recent.
  if (!reduced && now - lastFrameAt < frameInterval - 2) {
    if (visible) raf = requestAnimationFrame(frame)
    return
  }
  lastFrameAt = now
  const started = performance.now()

  const t = reduced ? 0 : ((now - t0) / 1000) * (props.animSpeed / 100)
  const t22 = t * 2.2
  const amp = props.animIntensity / 100
  const c = canvas.value

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.globalCompositeOperation = 'source-over'
  ctx.fillStyle = props.background
  ctx.fillRect(0, 0, W, H)

  const gap = Math.max(1, Math.round(cell * 0.08))
  const body = cell - gap
  const kAmp = amp * 0.42
  const half = LIFT_STEPS - 1
  for (let y = 0, i = 0; y < rows; y++) {
    const py = y * cell
    for (let x = 0; x < cols; x++, i++) {
      // radial wave travelling outward from the centre (distance*14 is precomputed per cell)
      const wv = Math.sin(dist14[i] - t22)
      const size = body * (1 - kAmp * (0.5 - 0.5 * wv))
      const off = (cell - size) / 2
      // ⚡ OPTIMIZED: the tiny brightness pulse uses cached colour strings instead of building a new one per tile per frame
      const bucket = ((wv + 1) * 0.5 * half + 0.5) | 0
      const key = i * LIFT_STEPS + bucket
      let style = styleCache[key]
      if (style === undefined) {
        const lift = 1 + amp * 0.12 * ((bucket / half) * 2 - 1)
        const j = i * 3
        style = styleCache[key] = `rgb(${(colors[j] * lift) | 0}, ${(colors[j + 1] * lift) | 0}, ${(colors[j + 2] * lift) | 0})`
      }
      ctx.fillStyle = style
      ctx.fillRect(x * cell + off, py + off, size, size)
    }
  }

  // bloom: downscale → upscale (cheap blur, works in Safari too) → add back with 'lighter'
  if (props.bloom > 0) {
    bloomCtx.imageSmoothingQuality = 'high'
    bloomCtx.clearRect(0, 0, bloomCanvas.width, bloomCanvas.height)
    bloomCtx.drawImage(c, 0, 0, bloomCanvas.width, bloomCanvas.height)
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.globalCompositeOperation = 'lighter'
    ctx.globalAlpha = (props.bloom / 100) * 0.9
    ctx.imageSmoothingEnabled = true
    ctx.drawImage(bloomCanvas, 0, 0, c.width, c.height)
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
  }

  // vignette (⚡ OPTIMIZED: gradient is created once per layout, not every frame)
  if (vignetteGrad) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = vignetteGrad
    ctx.fillRect(0, 0, W, H)
  }

  // ⚡ OPTIMIZED: self-tuning frame rate. If drawing a frame is slow on this machine, drop to 20 / 15fps instead of lagging.
  costEma = costEma ? costEma * 0.9 + (performance.now() - started) * 0.1 : performance.now() - started
  frameInterval = costEma > 18 ? 1000 / 15 : costEma > 9 ? 1000 / 20 : 1000 / 30

  if (!reduced && visible) raf = requestAnimationFrame(frame)
}

function kick() {
  if (!raf) raf = requestAnimationFrame(frame)
}

onMounted(() => {
  reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  const im = new Image()
  im.crossOrigin = 'anonymous' // ⚡ OPTIMIZED: lets the canvas read pixels even if photos are served from another domain/CDN
  im.decoding = 'async'
  im.onload = () => {
    img = im
    layout()
    kick()
    ro = new ResizeObserver(() => {
      layout()
      kick()
    })
    ro.observe(wrap.value)
    io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting
        if (visible) kick()
      },
      { rootMargin: '100px' },
    )
    io.observe(wrap.value)
  }
  im.src = props.src
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  ro?.disconnect()
  io?.disconnect()
})
</script>

<template>
  <div ref="wrap" class="mosaic" role="img" :aria-label="alt">
    <canvas ref="canvas" />
  </div>
</template>

<style>
.mosaic {
  position: relative;
  width: 100%;
  min-height: 40vh;
  background: #0a0a10;
  overflow: hidden;
}
.mosaic canvas {
  display: block;
}
</style>
