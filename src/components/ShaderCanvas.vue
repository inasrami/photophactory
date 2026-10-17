<script setup>
// ⚡ OPTIMIZED: replaces ShaderBackground.vue + Flutedglassbackground.vue (two ~500-line duplicates).
// One component, one WebGL setup, `preset` picks the look. GLSL + constants live in @/lib/shaders.js.
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { PRESETS, VERT } from '@/lib/shaders'

const props = defineProps({
  preset: { type: String, default: 'mesh' }, // 'mesh' (hero) | 'fluted' (/work)
  // true = pinned to the viewport, false = fills the nearest positioned parent
  fixed: { type: Boolean, default: false },
})

const canvas = ref(null)
const P = PRESETS[props.preset]

let gl = null
let program = null
let buffer = null
let raf = 0
let resizeObserver = null
let intersectionObserver = null
let loc = {}

let onScreen = true // ⚡ OPTIMIZED: toggled by IntersectionObserver
let last = 0
let time = 0
let presence = 0
let presenceTarget = 0
let mouseX = 0
let mouseY = 0
let mouseTX = 0
let mouseTY = 0

function compile(type, src) {
  const sh = gl.createShader(type)
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(sh))
    gl.deleteShader(sh)
    return null
  }
  return sh
}

function resize() {
  const el = canvas.value
  if (!el || !gl) return
  // ⚡ OPTIMIZED: render at 1× instead of up to 2×. These are soft gradient backgrounds, so the browser's
  // upscale is not noticeable, but retina screens now shade 4× fewer pixels every frame.
  const w = Math.max(1, el.clientWidth)
  const h = Math.max(1, el.clientHeight)
  if (el.width !== w || el.height !== h) {
    el.width = w
    el.height = h
  }
  gl.viewport(0, 0, w, h)
}

function frame(now) {
  raf = requestAnimationFrame(frame)
  const dt = Math.min((now - last) / 1000, 0.1)
  last = now
  time += dt

  // Ease cursor presence and position so the push never snaps.
  const k = Math.min(1, dt * 8)
  presence += (presenceTarget - presence) * k
  mouseX += (mouseTX - mouseX) * k
  mouseY += (mouseTY - mouseY) * k

  const el = canvas.value
  // ⚡ OPTIMIZED: only the uniforms that really change per frame are uploaded here
  // (colors / shape / surface / finish / transform are uploaded once in onMounted).
  gl.uniform4f(loc.scene, el.width, el.height, time * P.timeScale, 4.0)
  gl.uniform4f(loc.space, P.offset[0], P.offset[1], mouseX, mouseY)
  gl.uniform4f(loc.cursor, presence, P.cursor.effect, P.cursor.strength, P.cursor.radius)
  gl.drawArrays(gl.TRIANGLES, 0, 3)
}

// ⚡ OPTIMIZED: the loop only runs while the canvas is on screen AND the tab is visible.
// Before, the hero shader kept rendering full-screen underneath the whole page after you scrolled away.
function sync() {
  const shouldRun = onScreen && !document.hidden && !!gl
  if (shouldRun && !raf) {
    last = performance.now()
    raf = requestAnimationFrame(frame)
  } else if (!shouldRun && raf) {
    cancelAnimationFrame(raf)
    raf = 0
  }
}

function onPointerMove(e) {
  const el = canvas.value
  if (!el) return
  const r = el.getBoundingClientRect()
  const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
  presenceTarget = inside ? 1 : 0
  if (!inside) return
  mouseTX = ((e.clientX - r.left) / r.width) * 2 - 1
  mouseTY = -(((e.clientY - r.top) / r.height) * 2 - 1) // GL y points up
  // First entry: start under the cursor instead of sweeping in from the centre.
  if (presence < 0.01) {
    mouseX = mouseTX
    mouseY = mouseTY
  }
}

const onPointerLeave = () => (presenceTarget = 0)

function onContextLost(e) {
  e.preventDefault()
  cancelAnimationFrame(raf)
  raf = 0
}

onMounted(() => {
  const el = canvas.value
  gl = el.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' })
  if (!gl) return // no WebGL: the CSS fallback colour stays visible

  const vs = compile(gl.VERTEX_SHADER, VERT)
  const fs = compile(gl.FRAGMENT_SHADER, P.frag)
  if (!vs || !fs) return

  program = gl.createProgram()
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program))
    return
  }
  gl.useProgram(program)

  // Fullscreen triangle
  buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const aPos = gl.getAttribLocation(program, 'a_pos')
  gl.enableVertexAttribArray(aPos)
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

  const u = (name) => gl.getUniformLocation(program, name)
  loc = { scene: u('u_scene'), space: u('u_space'), cursor: u('u_cursor') }

  // ⚡ OPTIMIZED: constant uniforms are set once (the shader has 8 colour slots, unused ones stay 0).
  const colors = new Float32Array(24)
  colors.set(P.colors)
  gl.uniform3fv(u('u_colors'), colors)
  gl.uniform4fv(u('u_shape'), P.shape)
  gl.uniform4fv(u('u_surface'), P.surface)
  gl.uniform4fv(u('u_finish'), P.finish)
  gl.uniform4fv(u('u_transform'), P.transform)

  resize()
  resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(el)

  // The canvas sits behind the page and ignores pointer events, so track the pointer on the window instead.
  window.addEventListener('pointermove', onPointerMove, { passive: true })
  document.documentElement.addEventListener('pointerleave', onPointerLeave)
  document.addEventListener('visibilitychange', sync)
  el.addEventListener('webglcontextlost', onContextLost)

  intersectionObserver = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting
    sync()
  })
  intersectionObserver.observe(el)

  sync()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  raf = 0
  resizeObserver?.disconnect()
  intersectionObserver?.disconnect()
  window.removeEventListener('pointermove', onPointerMove)
  document.documentElement.removeEventListener('pointerleave', onPointerLeave)
  document.removeEventListener('visibilitychange', sync)
  canvas.value?.removeEventListener('webglcontextlost', onContextLost)
  if (gl) {
    if (buffer) gl.deleteBuffer(buffer)
    if (program) gl.deleteProgram(program)
    gl.getExtension('WEBGL_lose_context')?.loseContext()
  }
  gl = program = buffer = null
})
</script>

<template>
  <canvas
    ref="canvas"
    :class="['shader-bg', { 'shader-bg--fixed': fixed }]"
    :style="{ background: P.bg }"
    aria-hidden="true"
  />
</template>

<style scoped>
.shader-bg {
  position: absolute;
  inset: 0;
  z-index: -1;
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
  /* background colour (set inline per preset) shows until WebGL kicks in, or if it's unavailable */
}

.shader-bg--fixed {
  position: fixed;
}
</style>
