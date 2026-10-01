<script setup>
import { onMounted, ref } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { gsap, ScrollTrigger } from '@/lib/gsap'
import SiteNav from '@/components/SiteNav.vue'
import { lenis } from '@/lib/lenis'
import Backdrop from '@/components/Backdrop.vue'
import Cursor from '@/components/Cursor.vue'
const route = useRoute()
const curtain = ref(null)
let first = true
onMounted(() => {
  gsap.set(curtain.value, { yPercent: 100 })
  gsap.to('.prog', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } })
})
const leave = (el, done) => gsap.fromTo(curtain.value, { yPercent: 100 }, { yPercent: 0, duration: 0.7, ease: 'expo.inOut', onComplete: done })
const enter = (el, done) => {
  if (first) { first = false; return done() } // initial page load: no curtain
  lenis.scrollTo(0, { immediate: true })
  if (route.hash) requestAnimationFrame(() => lenis.scrollTo(route.hash, { immediate: true }))
  ScrollTrigger.refresh()
  gsap.to(curtain.value, { yPercent: -100, duration: 0.8, ease: 'expo.inOut', delay: 0.15, onComplete: () => { gsap.set(curtain.value, { yPercent: 100 }); done() } })
}
</script>
<template>
  <Backdrop />
  <Cursor />
  <SiteNav />
  <div class="prog" />
  <div ref="curtain" class="curtain" />
  <RouterView v-slot="{ Component }">
    <Transition :css="false" mode="out-in" @leave="leave" @enter="enter">
      <component :is="Component" :key="route.path" />
    </Transition>
  </RouterView>
</template>