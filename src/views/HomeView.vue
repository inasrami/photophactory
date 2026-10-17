<script setup>
import { onMounted, ref } from 'vue'
import { gsap } from '@/lib/gsap'
import HeroSection from '@/components/HeroSection.vue'
import { heroImages } from '@/data/heroImages'
import { collections } from '@/data/gallery'
import KilnFooter from '@/components/KilnFooter.vue'
import { footer } from '@/data/footer'
import ScrollGallery from '@/components/ScrollGallery.vue'
import { galleryColumns } from '@/data/landingGallery'
// 🧹 CLEANUP: removed unused imports (ScrollTrigger, onBeforeUnmount) and the unused `me` portrait constant
// (it pointed at /images/about-portrait.jpg, a 496KB file that was only referenced by commented-out markup).
const pad = (n) => String(n).padStart(2, '0')
const total = collections.length

const root = ref(null)
onMounted(() => {
  gsap.context(() => {
    gsap.from('.all', { opacity: 0, y: 60, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.all', start: 'top 92%' } })
  }, root.value)
})
</script>
<template>
  <main ref="root">
    <HeroSection :images="heroImages" class="hero" />
    <!-- 🧹 CLEANUP: removed the commented-out "Behind the lens" section and rooms header -->
    <section id="rooms" class="rooms">
      <ScrollGallery :columns="galleryColumns" />

      <RouterLink to="/work" class="all">
        <span class="all-t">View all work →</span>
        <span class="label">{{ pad(total) }}</span>
      </RouterLink>
    </section>
    <div id="contact" class="foot-wrap">
      <KilnFooter v-bind="footer" />
    </div>
  </main>
</template>
<style>
.foot-wrap {
  position: relative;
  z-index: 1;
  padding: 0 1.5vw 1.5vw;
}

.rooms {
  position: relative;
  z-index: 1;
  padding: 0 0 6rem;
}

/* 🧹 CLEANUP: removed dead .ap / .ap-l / .ap img / .f-credit rules. `.ap` referenced fon2.png (a 6.4MB
   PNG that Vite still copied into the build) for a section that is commented out and never rendered. */

.hero {
  position: relative;
  z-index: 1;
  height: 100vh;
}
</style>
