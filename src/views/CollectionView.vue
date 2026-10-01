<script setup>
import { computed, onBeforeUnmount, onMounted, ref, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { gsap, ScrollTrigger } from '@/lib/gsap'
import { collections, find } from '@/data/gallery'
const route = useRoute()
const c = find(route.params.type, route.params.slug)
const next = collections[(collections.indexOf(c) + 1) % collections.length]
const open = ref(-1), root = ref(null)
const cur = computed(() => c.shots[open.value])
const go = (d) => (open.value = (open.value + d + c.shots.length) % c.shots.length)
const key = (e) => open.value > -1 && (e.key === 'Escape' ? (open.value = -1) : e.key === 'ArrowRight' ? go(1) : e.key === 'ArrowLeft' && go(-1))
let ctx
onMounted(async () => {
  addEventListener('keydown', key)
  await nextTick()
  ctx = gsap.context(() => {
    gsap.from('.c-title .ch', { yPercent: 110, duration: 1.3, stagger: 0.03, ease: 'expo.out', delay: 1.1 })
    gsap.from('.c-info > *', { opacity: 0, y: 20, stagger: 0.12, duration: 1, delay: 1.5 })
    gsap.to('.c-img', { yPercent: 15, ease: 'none', scrollTrigger: { trigger: '.c-hero', start: 'top top', end: 'bottom top', scrub: true } })
    gsap.utils.toArray('.shot').forEach((el, i) => {
      const img = el.firstChild, k = ((i % 3) + 1) * 28
      gsap.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 92%' } })
      gsap.from(img, { scale: 1.45, duration: 1.8, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 92%' } })
      gsap.fromTo(el, { y: k }, { y: -k, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } })
    })
    gsap.to('.c-title', { yPercent: -40, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.c-hero', start: 'top top', end: 'bottom top', scrub: true } })
    gsap.fromTo('.next h2', { letterSpacing: '0.25em', opacity: 0.15 }, { letterSpacing: '-0.03em', opacity: 1, ease: 'none', scrollTrigger: { trigger: '.next', start: 'top 90%', end: 'top 30%', scrub: true } })
  }, root.value)
})
onBeforeUnmount(() => { removeEventListener('keydown', key); ctx?.revert() })
</script>
<template>
  <main ref="root">
    <section class="c-hero">
      <img :src="c.cover" alt="" class="c-img" fetchpriority="high" decoding="async" />
      <div class="hero-scrim" />
      <div class="c-info"><span class="label">{{ c.type }}</span><span class="label">{{ c.sub }}</span><span
          class="label">{{ c.shots.length }} frames</span></div>
      <h1 class="c-title"><span v-for="(ch, i) in c.title.toUpperCase().split('')" :key="i" class="mask"><span
            class="ch">{{ ch === ' ' ? '\u00A0' : ch }}</span></span></h1>
    </section>
    <section class="grid">
      <figure v-for="(s, i) in c.shots" :key="s.url" class="shot" data-cursor="Open" @click="open = i"><img :src="s.url"
          :alt="`${c.title} ${i + 1}`" loading="lazy" decoding="async" @load="ScrollTrigger.refresh()" /></figure>
    </section>
    <RouterLink :to="`/${next.type}/${next.slug}`" class="next"><span class="label">Next story</span>
      <h2>{{ next.title }}</h2>
    </RouterLink>
    <Transition name="lb">
      <div v-if="open > -1" class="lb" @click.self="open = -1">
        <img :key="cur.url" :src="cur.url" alt="" decoding="async" />
        <button class="lb-x label" @click="open = -1">Close</button>
        <button class="lb-p label" @click="go(-1)">←</button><button class="lb-n label" @click="go(1)">→</button>
        <span class="lb-c label">{{ String(open + 1).padStart(2, '0') }} / {{ String(c.shots.length).padStart(2, '0')
          }}</span>
      </div>
    </Transition>
  </main>
</template>