<script setup>
import { onMounted, ref } from 'vue'
import { gsap } from '@/lib/gsap'
const ring = ref(null), label = ref('')
// Custom cursor: only exists while hovering an element marked data-cursor (the photographs).
onMounted(() => {
  if (!matchMedia('(hover:hover)').matches) return
  const x = gsap.quickTo(ring.value, 'x', { duration: 0.45, ease: 'power3' })
  const y = gsap.quickTo(ring.value, 'y', { duration: 0.45, ease: 'power3' })
  gsap.set(ring.value, { scale: 0, opacity: 0 })
  let shown = false
  addEventListener('mousemove', (e) => { x(e.clientX); y(e.clientY) })
  document.addEventListener('mouseover', (e) => {
    const t = e.target.closest?.('[data-cursor]')
    if (t) label.value = t.dataset.cursor
    if (!!t === shown) return
    shown = !!t
    if (t) gsap.set(ring.value, { x: e.clientX, y: e.clientY })
    gsap.to(ring.value, { scale: t ? 1 : 0, opacity: t ? 1 : 0, duration: 0.5, ease: 'expo.out', overwrite: 'auto' })
  })
})
</script>
<template>
  <div ref="ring" class="cur-ring"><span>{{ label }}</span></div>
</template>