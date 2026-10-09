<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap, ScrollTrigger } from '@/lib/gsap'
import { lenis } from '@/lib/lenis'
import HeroSection from '@/components/HeroSection.vue'
import { heroImages } from '@/data/heroImages'
import { collections } from '@/data/gallery'
import sig from '@/images/podpis.png'
import ScrollGallery from '@/components/ScrollGallery.vue'
import { galleryColumns } from '@/data/landingGallery'
const me = '/images/about-portrait.jpg'
const pad = (n) => String(n).padStart(2, '0')
const total = collections.length

const root = ref(null)
const toTop = () => lenis.scrollTo(0, { duration: 2.2 })
onMounted(() => {
  gsap.context(() => {
    const ft = { trigger: '.foot' }
    gsap.fromTo('.f-in', { yPercent: -18 }, { yPercent: 0, ease: 'none', scrollTrigger: { ...ft, start: 'top bottom', end: 'top top', scrub: true } })
    gsap.from('.all', { opacity: 0, y: 60, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.all', start: 'top 92%' } })
    gsap.from('.f-t .t', { yPercent: 115, duration: 1.5, stagger: 0.12, ease: 'expo.out', scrollTrigger: { ...ft, start: 'top 60%' } })
    gsap.fromTo('.f-sig', { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 2.4, delay: 0.5, ease: 'power2.inOut', scrollTrigger: { ...ft, start: 'top 45%' } })
    gsap.from('.f-cols > *', { opacity: 0, y: 30, stagger: 0.1, duration: 1, scrollTrigger: { trigger: '.f-cols', start: 'top 92%' } })
    gsap.from('.f-word', { yPercent: 45, ease: 'none', scrollTrigger: { ...ft, start: 'top 40%', end: 'bottom bottom', scrub: true } })
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
    <footer id="contact" class="foot">
      <div class="f-in">
        <div class="f-top"><span class="label">(Book a session)</span><span class="label">Concerts · Portraits</span>
        </div>
        <h2 class="f-t"><span class="mask"><span class="t">Let’s make</span></span><span class="mask"><span
              class="t">something still.</span></span></h2>
        <div class="f-mid">
          <a href="mailto:hello@photophactory.com" class="f-mail">hello@photophactory.com</a>
          <img :src="sig" alt="Photophactory — signature" class="f-sig" />
        </div>
        <div class="f-cols">
          <div class="f-col"><span class="label">Elsewhere</span><a href="https://instagram.com/" target="_blank"
              rel="noopener">Instagram ↗</a></div>
          <div class="f-col"><span class="label">Navigate</span>
            <RouterLink to="/work">All work</RouterLink>
            <RouterLink to="/#rooms">Selected</RouterLink>
          </div>
          <div class="f-col"><span class="label">© {{ new Date().getFullYear() }}</span><button @click="toTop">Back to
              top ↑</button>
            <p class="f-credit label">
              Made by <a href="https://inrait.com" target="_blank" rel="noopener">INRAIT ↗</a>
            </p>
          </div>

        </div>

        <div class="f-wm" aria-hidden="true">
          <p class="f-word">Photophactory</p>
        </div>

      </div>
    </footer>
  </main>
</template>
<style>
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