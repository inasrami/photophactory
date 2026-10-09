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
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  const c = canvas.value
  c.width = Math.round(W * dpr)
  c.height = Math.round(H * dpr)
  c.style.width = W + 'px'
  c.style.height = H + 'px'
  ctx = c.getContext('2d')
  cell = W < 720 ? Math.max(8, Math.round(props.cellSize * 0.6)) : props.cellSize
  cols = Math.ceil(W / cell)
  rows = Math.ceil(H / cell)
  sample()
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
  const t = reduced ? 0 : ((now - t0) / 1000) * (props.animSpeed / 100)
  const amp = props.animIntensity / 100
  const c = canvas.value

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.globalCompositeOperation = 'source-over'
  ctx.fillStyle = props.background
  ctx.fillRect(0, 0, W, H)

  const gap = Math.max(1, Math.round(cell * 0.08))
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 3
      const nx = x / cols - 0.5
      const ny = (y / rows - 0.5) * (H / W)
      const d = Math.sqrt(nx * nx + ny * ny)
      // radial wave travelling outward from the centre
      const wv = Math.sin(d * 14 - t * 2.2)
      const k = 1 - amp * 0.42 * (0.5 - 0.5 * wv) // 1 .. (1 - 0.42*amp)
      const size = (cell - gap) * k
      const off = (cell - size) / 2
      const lift = 1 + amp * 0.12 * wv // tiny brightness pulse with the wave
      ctx.fillStyle = `rgb(${colors[i] * lift}, ${colors[i + 1] * lift}, ${colors[i + 2] * lift})`
      ctx.fillRect(x * cell + off, y * cell + off, size, size)
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

  // vignette
  if (props.vignette > 0) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.max(W, H) * 0.75)
    g.addColorStop(0, 'rgba(0,0,0,0)')
    g.addColorStop(1, `rgba(0,0,0,${(props.vignette / 100) * 1.4})`)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)
  }

  if (!reduced && visible) raf = requestAnimationFrame(frame)
}

function kick() {
  if (!raf) raf = requestAnimationFrame(frame)
}

onMounted(() => {
  reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  const im = new Image()
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
