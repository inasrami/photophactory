<script setup>
import { onBeforeUnmount, onMounted, ref, nextTick } from 'vue'
import { gsap, ScrollTrigger } from '@/lib/gsap'
import { about } from '@/data/about'
import TyperText from '@/components/TyperText.vue'
import MosaicPortrait from '@/components/MosaicPortrait.vue'
import sig from '@/images/podpis.png'
import me1 from '@/images/optimized/Me/me1.jpg?url'
import me3 from '@/images/Me/me3.png?url'

const root = ref(null)
let ctx
onMounted(async () => {
  await nextTick()
  ctx = gsap.context(() => {
    gsap.from('.ab-intro .label', { opacity: 0, y: 20, duration: 1, ease: 'expo.out', delay: 0.9 })
    gsap.from('.ab-portrait', { opacity: 0, y: 80, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '.ab-portrait', start: 'top 92%' } })
    gsap.from('.ab-title .ch', { yPercent: 110, duration: 1.3, stagger: 0.05, ease: 'expo.out', scrollTrigger: { trigger: '.ab-copy', start: 'top 80%' } })
    gsap.from('.ab-copy > *:not(.ab-title)', { opacity: 0, y: 30, stagger: 0.14, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.ab-copy', start: 'top 75%' } })
    gsap.from('.ab-contact > *', { opacity: 0, y: 40, stagger: 0.12, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.ab-contact', start: 'top 85%' } })
      ;['.ab-photo'].forEach((sel) => {
        const el = root.value.querySelector(sel)
        const img = el.firstChild
        gsap.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 92%' } })
        gsap.from(img, { scale: 1.4, duration: 1.9, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 92%' } })
        gsap.fromTo(img, { yPercent: -4 }, { yPercent: 4, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } })
      })
    gsap.from('.ab-quote p', { opacity: 0, y: 60, duration: 1.5, ease: 'expo.out', scrollTrigger: { trigger: '.ab-quote', start: 'top 75%' } })
    gsap.fromTo('.signature', { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 2.4, delay: 0.5, ease: 'power2.inOut', scrollTrigger: { trigger: '.signature', start: 'top 80%' } })
  }, root.value)
})
onBeforeUnmount(() => ctx?.revert())
</script>
<template>
  <main ref="root" class="about">
    <section class="ab-intro" lang="bg">
      <span class="label">About</span>
      <TyperText :text="about.intro" :delay="1" class="ab-typer" accent="#c9a86a" />
    </section>
    <section class="ab-portrait">
      <MosaicPortrait :src="me3" alt="Portrait of the photographer" :cell-size="8" />
    </section>
    <section class="ab-hero">
      <figure class="ab-photo"><img :src="me1" alt="Portrait of the photographer" fetchpriority="high" decoding="async"
          @load="ScrollTrigger.refresh()" /></figure>
      <div class="ab-copy" lang="bg">
        <span class="label">About</span>
        <h1 class="ab-title"><span v-for="(ch, i) in about.heading.toUpperCase().split('')" :key="i" class="mask"><span
              class="ch">{{ ch === ' ' ? '\u00A0' : ch }}</span></span></h1>
        <p v-for="(para, i) in about.paragraphs" :key="i">{{ para }}</p>
      </div>
    </section>
    <section class="ab-quote" lang="bg">
      <p>{{ about.quote }}</p>
    </section>
    <section class="ab-second">
      <img :src="sig" class="signature" alt="Photophactory signature" />
    </section>
    <section class="ab-contact" lang="bg">
      <span class="label">{{ about.contact.label }}</span>
      <a :href="`mailto:${about.contact.email}`" class="f-mail">{{ about.contact.email }}</a>

      <div class="ab-links">
        <a v-for="l in about.contact.links" :key="l.href" :href="l.href" target="_blank" rel="noopener">{{ l.label }}
          ↗</a>
      </div>
    </section>
    <RouterLink to="/work" class="ab-cta"><span class="label">See the stories</span>
      <h2>All work →</h2>
    </RouterLink>
  </main>
</template>

<style>
/* intro text above the full-width portrait: centered box AND centered lines */
.about .ab-intro {
  position: relative;
  padding: 24vh 4vw 12vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.about .ab-typer {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 3rem auto 0;
  width: min(100%, 20em);
  font-family: var(--serif);
  font-weight: 300;
  font-size: clamp(2rem, 5.2vw, 5.4rem);
  line-height: 1.14;
  letter-spacing: -0.02em;
  text-align: center;
}

/* each typer line is an inline-flex wrap container, so text-align alone doesn't reach the words */
.about .ab-typer [data-typer] {
  justify-content: center;
  text-align: center;
}

/* full-bleed portrait */
.ab-portrait {
  position: relative;
  width: 100%;
  margin: 0;
}

/* the editorial block is no longer the first thing on the page */
.about .ab-hero {
  padding-top: 18vh;
}

/* signature: block layout (the old grid pinned it to column 1), bigger, centered */
.about .ab-second {
  display: block;
  padding: 0 4vw 18vh;
}

.signature {
  height: clamp(2rem, 4vw, 4rem);
  margin: 0 auto;
  display: block;
  filter: brightness(0) invert(1);
  opacity: 0.9;
}

/* contact details (moved here from the nav) */
.ab-contact {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2.2rem;
  padding: 14vh 4vw 18vh;
  border-top: 1px solid #ffffff22;
}

.ab-links {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
}

.ab-links a {
  font: 400 0.78rem var(--sans);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  opacity: 0.8;
  transition: opacity 0.4s, transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.ab-links a:hover {
  opacity: 1;
  transform: translateX(8px);
}

@media (max-width: 720px) {
  .about .ab-intro {
    padding-top: 20vh;
    padding-bottom: 8vh;
  }

  .about .ab-hero {
    padding-top: 10vh;
  }
}
</style>