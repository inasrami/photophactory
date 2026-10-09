<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap, ScrollTrigger } from '@/lib/gsap'
import HeroSection from '@/components/HeroSection.vue'
import { heroImages } from '@/data/heroImages'
import { collections } from '@/data/gallery'
import KilnFooter from '@/components/KilnFooter.vue'
import { footer } from '@/data/footer'
import ScrollGallery from '@/components/ScrollGallery.vue'
import { galleryColumns } from '@/data/landingGallery'
const me = '/images/about-portrait.jpg'
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
    <!-- <section class="ap">
      <img :src="me" alt="The photographer behind the lens" loading="lazy" decoding="async" />
      <h2 class="ap-t">Light is<br /><i>never still.</i></h2>
      <span class="label ap-l">Behind the lens</span>
    </section> -->
    <section id="rooms" class="rooms">
      <!-- <header class="rooms-head">
        <span class="label">Step inside</span>
        <span class="label">{{ pad(total) }} stories</span>
      </header> -->

      <ScrollGallery :columns="galleryColumns" />

      <RouterLink to="/work" class="all">
        <!-- <span class="label">Every story</span> -->
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

.ap {
  background-image: url('@/images/fon2.png');
  width: 100vw;
}

.ap-l {
  position: absolute;
  bottom: 0;
  left: 50%;
  padding: 0.5rem 1rem;
  font-size: clamp(0.7rem, 1.2vw, 1rem);
}

.ap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 50% 20%;

}

.f-credit a {
  color: #A4E04B;
  border-bottom: 1px solid currentColor;
}

.f-credit a:hover {
  opacity: 0.7;
}

.hero {
  position: relative;
  z-index: 1;
  height: 100vh;
}
</style>