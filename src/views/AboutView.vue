<script setup>
import { onBeforeUnmount, onMounted, ref, nextTick } from 'vue'
import { gsap, ScrollTrigger } from '@/lib/gsap'
import { about } from '@/data/about'
// The small signature stays bundled; photos are WebP served from the VPS (see data/photos.js).
import sig from '@/assets/podpis.webp'
import { fullUrl } from '@/data/photos'
const me1 = fullUrl('Me/me1.webp') // 1. hero portrait
const live = fullUrl('Me/live.webp') // 2. live shows
const profile = fullUrl('Me/profile.webp') // 3. black & white profile
const smile = fullUrl('Me/smile.webp') // 4. colour portrait
const glow = fullUrl('Me/glow.webp') // 4. teal / red gradient

const root = ref(null)

// Same copy as before. Block 3 = first paragraph, block 2 = second paragraph, block 4 = the quote.
const [first, second] = about.paragraphs

let ctx
let mm
let ro
let refreshTimer
onMounted(async () => {
  await nextTick()
  ro = new ResizeObserver(() => {
    clearTimeout(refreshTimer)
    refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 150)
  })
  ro.observe(root.value)

  ctx = gsap.context(() => {
    // Signature: same left -> right reveal as before.
    gsap.fromTo('.signature', { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 2.4, delay: 1.3, ease: 'power2.inOut', scrollTrigger: { trigger: '.signature', start: 'top 85%' } })
  }, root.value)

  mm = gsap.matchMedia(root.value)
  mm.add(
    { motion: '(prefers-reduced-motion: no-preference)', calm: '(prefers-reduced-motion: reduce)' },
    (c) => {
      if (!c.conditions.motion) return

      // Block 1: script K + name rise out of their masks, the vertical label fades in, the portrait settles.
      gsap
        .timeline({ defaults: { ease: 'expo.out' } })
        .from('.ab-name-in', { yPercent: 115, duration: 1.6, stagger: 0.12, delay: 0.9 })
        .from('.ab-vertical', { opacity: 0, x: 20, duration: 1.4 }, '<0.3')
      gsap.from('.ab-me', { opacity: 0, scale: 1.1, duration: 2.2, ease: 'expo.out', delay: 0.8 })

      // Blocks 2 - 4: each block opens with a clip, the photo inside drifts slowly.
      gsap.utils.toArray('.ab-photo').forEach((frame) => {
        const img = frame.querySelector('img')
        gsap.from(frame, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: frame, start: 'top 85%' } })
        gsap.set(img, { scale: 1.12 })
        gsap.fromTo(img, { yPercent: -4 }, { yPercent: 4, ease: 'none', scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true } })
      })
      gsap.utils.toArray('.ab-rise').forEach((el) => {
        gsap.from(el, { opacity: 0, y: 40, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%' } })
      })

      // Block 4: gradient drifts, the quote lines slide past each other, the wordmark rises.
      gsap.fromTo('.ab-glow', { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: '.ab-b4', start: 'top bottom', end: 'bottom top', scrub: true } })
      root.value.querySelectorAll('.ab-statement p').forEach((p, i) => {
        gsap.fromTo(p, { xPercent: i % 2 ? 4 : -4 }, { xPercent: i % 2 ? -4 : 4, ease: 'none', scrollTrigger: { trigger: p, start: 'top bottom', end: 'bottom top', scrub: true } })
      })
      gsap.from('.ab-wordmark', { yPercent: 40, opacity: 0, duration: 1.8, ease: 'expo.out', scrollTrigger: { trigger: '.ab-b4', start: 'top 60%' } })
    },
  )
})
onBeforeUnmount(() => {
  ro?.disconnect()
  clearTimeout(refreshTimer)
  mm?.revert()
  ctx?.revert()
})
</script>
<template>
  <main ref="root" class="about">
    <!-- 1. Black block: script K + name on the left, portrait on the right, vertical label, signature -->
    <section class="ab-b ab-b1" lang="bg">
      <figure class="ab-b1-photo">
        <img :src="me1" class="ab-me" alt="Krasimir Djalev" fetchpriority="high" decoding="async" />
        <!-- <img :src="sig" class="signature ab-hero-signature" alt="Photophactory signature" /> -->
      </figure>
      <h1 class="ab-name" :aria-label="about.name.join(' ')">
        <span class="ab-name-line" aria-hidden="true">
          <span class="ab-name-in"><span class="ab-k">{{ about.name[0][0] }}</span>{{
            about.name[0].slice(1).toUpperCase() }}</span>
        </span>
        <span class="ab-name-line" aria-hidden="true">
          <span class="ab-name-in">{{ about.name[1].slice(0, -1).toUpperCase() }}<span class="ab-k ab-v">{{
            about.name[1].slice(-1).toUpperCase() }}</span></span>
        </span>
      </h1>
      <span class="ab-vertical" aria-hidden="true">{{ about.role.toUpperCase() }}</span>
    </section>

    <!-- 2. Live shows: photo left, brown panel right -->
    <section class="ab-b ab-b2" lang="bg">
      <div class="ab-photo ab-b2-photo">
        <img :src="live" alt="Фотограф на концерт" loading="lazy" decoding="async" @load="ScrollTrigger.refresh()" />
      </div>
      <div class="ab-b2-panel">
        <div class="ab-b2-title ab-rise">
          <svg class="ab-star" viewBox="0 0 48 48" aria-hidden="true">
            <g fill="currentColor">
              <circle v-for="n in 12" :key="n" cx="24" cy="6.5" r="4.2" :transform="`rotate(${(n - 1) * 30} 24 24)`" />
            </g>
          </svg>
          <span>{{ about.liveLabel.toUpperCase() }}</span>
        </div>
        <p class="ab-b2-text ab-rise">{{ second }}</p>
      </div>
    </section>

    <!-- 3. Black block: first paragraph on the left, black & white profile on the right -->
    <section class="ab-b ab-b3" lang="bg">
      <p class="ab-b3-text ab-rise">{{ first }}</p>
      <div class="ab-photo ab-b3-photo">
        <img :src="profile" alt="Портрет в сянка" loading="lazy" decoding="async" @load="ScrollTrigger.refresh()" />
      </div>
    </section>

    <!-- 4. Gradient block: colour portrait on the left, quote on the right, wordmark across the bottom -->
    <section class="ab-b ab-b4" lang="bg">
      <img :src="glow" class="ab-glow" alt="" aria-hidden="true" loading="lazy" decoding="async" />
      <div class="ab-photo ab-b4-photo">
        <img :src="smile" alt="Портрет в топла светлина" loading="lazy" decoding="async"
          @load="ScrollTrigger.refresh()" />
      </div>
      <blockquote class="ab-statement">
        <p v-for="(line, i) in about.quote" :key="i">{{ line }}</p>
      </blockquote>
      <img :src="sig" class="signature ab-hero-signature" alt="Photophactory signature" />
      <p class="ab-wordmark" aria-hidden="true">photophactory</p>
    </section>

    <footer class="ab-foot" lang="bg">
      <div class="ab-contact">
        <h2 class="ab-contact-title">{{ about.contact.label }}</h2>
        <div class="ab-contact-body">
          <a :href="`mailto:${about.contact.email}`" class="ab-mail">
            <svg class="ab-contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
              aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m4 7 8 6 8-6" />
            </svg>
            <span>{{ about.contact.email }}</span>
          </a>
          <a :href="`tel:${about.contact.phone}`" class="ab-phone">
            <svg class="ab-contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
              aria-hidden="true">
              <path
                d="M7 3h3l1.5 4-2 1.5a15 15 0 0 0 6 6l1.5-2 4 1.5v3c0 1.1-.9 2-2 2C10.2 19 5 13.8 5 7c0-2.2.9-4 2-4Z" />
            </svg>
            <span>{{ about.contact.phone }}</span>
          </a>
          <div class="ab-links">
            <a v-for="l in about.contact.links" :key="l.href" :href="l.href" target="_blank" rel="noopener">
              <svg class="ab-contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
                aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
              </svg>
              {{ l.label }}
            </a>
          </div>
        </div>
      </div>
      <RouterLink to="/work" class="ab-cta">
        <span> View all work</span>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"
          aria-hidden="true">
          <path d="M3 12h17M14 6l6 6-6 6" />
        </svg>
      </RouterLink>
    </footer>
  </main>
</template>

<style>
/* Pinyon Script (SIL OFL) - the calligraphic swash letters of the name; bundled so it never depends on Google Fonts */
@font-face {
  font-family: 'Pinyon Script';
  src: url('../assets/fonts/PinyonScript-400.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

.about {
  --accent: #c9a86a;
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --pad: clamp(1.25rem, 5vw, 6rem);
  /* every block is the same height, like the design */
  --block: clamp(26rem, 56vw, 54rem);
}

.ab-b {
  position: relative;
  display: grid;
  height: var(--block);
  overflow: hidden;
}

/* ---------- 1. Black block ---------- */
.ab-b1 {
  height: 100svh;
  min-height: 32rem;
  background: #000;
}

.ab-b1-photo {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 58%;
  margin: 0;
  overflow: hidden;
  -webkit-mask-image: linear-gradient(to right, transparent 0, #000 30%);
  mask-image: linear-gradient(to right, transparent 0, #000 30%);
}

.ab-me {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 50% 15%;
  will-change: transform;
}

/* darkens the light shirt so the white signature reads clearly */
.ab-b1-photo::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(to top, rgb(0 0 0 / 0.9) 0%, rgb(0 0 0 / 0.5) 22%, transparent 46%);
}

.about .ab-hero-signature {
  position: absolute;
  right: 15%;
  bottom: 28%;
  z-index: 1;
  width: clamp(10rem, 30vw, 25rem);
}

.ab-name {
  position: absolute;
  z-index: 2;
  left: var(--pad);
  top: 50%;
  transform: translateY(-50%);
  margin: 0;
  font-family: var(--serif);
  font-weight: 300;
  font-size: clamp(3rem, min(8vw, 15svh), 9.5rem);
  line-height: 1.02;
  letter-spacing: 0.02em;
  color: var(--bone);
}

.ab-name-line {
  display: block;
  overflow: hidden;
  padding: 0.6em 0.1em 0.25em 0;
  /* room for the tall swash of the script K and V inside the reveal mask */
  margin: -0.6em 0 -0.25em;
}

.ab-name-in {
  display: block;
  white-space: nowrap;
  will-change: transform;
}

/* swash K and V from the design, in a calligraphic script */
.ab-k {
  font-family: 'Pinyon Script', 'Marck Script', cursive;
  font-weight: 400;
  font-size: 2.1em;
  line-height: 0;
  margin-right: -0.1em;
  letter-spacing: 0;
  text-transform: none;
  color: var(--accent);
}

.ab-v {
  margin: 0 0 0 -0.16em;
}

.ab-name-line:last-child .ab-name-in {
  padding-left: 0.62em;
}

.ab-vertical {
  position: absolute;
  z-index: 2;
  right: clamp(0.9rem, 2.2vw, 2.4rem);
  top: 50%;
  writing-mode: vertical-rl;
  transform: translateY(-50%);
  font: 500 clamp(0.62rem, 0.85vw, 0.8rem) var(--sans);
  letter-spacing: 0.5em;
  color: var(--accent);
}

/* ---------- 2. Live shows ---------- */
.ab-b2 {
  grid-template-columns: 60fr 47fr;
}

.ab-photo {
  position: relative;
  overflow: hidden;
  background: #111;
}

.ab-photo img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  will-change: transform;
}

.ab-b2-photo img {
  object-position: 130% 50%;
}

.ab-b2-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: clamp(1.4rem, 3.2vw, 3.2rem);
  padding: clamp(1.2rem, 3.6vw, 4.5rem);
  background:
    radial-gradient(120% 90% at 100% 0%, rgb(196 128 60 / 0.3), transparent 60%),
    linear-gradient(165deg, #75451d 0%, #4a2a12 100%);
}

.ab-b2-title {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  font: 500 clamp(0.8rem, 1.15vw, 1.1rem) / 1.15 var(--sans);
  letter-spacing: 0.22em;
  color: #efe4d4;
}

.ab-star {
  flex: none;
  width: clamp(1.8rem, 2.8vw, 2.8rem);
  height: auto;
  color: #e2c28d;
  animation: ab-spin 40s linear infinite;
}

@keyframes ab-spin {
  to {
    transform: rotate(360deg);
  }
}

.ab-b2-text {
  margin: 0;
  font: 500 clamp(0.68rem, 1.02vw, 1rem) / 1.85 var(--sans);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  text-align: center;
  color: #f1e6d6;
}

/* ---------- 3. Black block ---------- */
.ab-b3 {
  grid-template-columns: 62fr 38fr;
  align-items: center;
  background: #000;
}

.ab-b3-text {
  margin: 0;
  padding: 0 clamp(1.2rem, 4vw, 5rem) 0 var(--pad);
  font-family: var(--serif);
  font-weight: 300;
  font-size: clamp(0.85rem, 1.5vw, 1.55rem);
  line-height: 1.75;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  text-align: center;
  color: var(--bone);
}

.ab-b3-photo {
  height: 110%;
  background: #000;
}

.ab-b3-photo img {
  object-position: 55% 50%;
}

.ab-b3-photo {
  -webkit-mask-image: linear-gradient(to right, transparent 0, #000 22%);
  mask-image: linear-gradient(to right, transparent 0, #000 22%);
}

/* ---------- 4. Gradient block ---------- */
.ab-b4 {
  grid-template-columns: 44fr 56fr;
  align-items: center;
  background: #000;
}

.ab-glow {
  position: absolute;
  inset: -8% 0;
  width: 100%;
  height: 116%;
  object-fit: cover;
  will-change: transform;
}

.ab-b4-photo {
  position: relative;
  align-self: start;
  z-index: 1;
  height: 180%;
  /* the big curve from the design: flat on top, then sweeping down to the right edge */
  border-top-right-radius: 40% 48%;
  background: #3a2410;
}

.ab-b4-photo img {
  object-position: 50% 0%;
}

.ab-statement {
  position: relative;
  bottom: 20%;
  z-index: 2;
  margin: 0;
  padding: 0 clamp(1rem, 4vw, 5rem);
  text-align: center;
}

.about .ab-statement p {
  margin: 0;
  font-family: var(--serif);
  font-weight: 400;
  font-size: clamp(1.5rem, 3.6vw, 4.2rem);
  line-height: 1.2;
  color: #fff;
  text-shadow: 0 2px 30px rgb(0 0 0 / 0.5);
  will-change: transform;
}

/* wordmark across the bottom of the block, overlapping the portrait */
.about .ab-wordmark {
  position: absolute;
  z-index: 3;
  left: 0;
  right: 0;
  bottom: 0.08em;
  margin: 0;
  text-align: center;
  font-family: var(--serif);
  font-weight: 700;
  font-size: 15.2vw;
  line-height: 0.9;
  letter-spacing: -0.04em;
  color: #fff;
  pointer-events: none;
  user-select: none;
}

/* ---------- Footer ---------- */
.ab-foot {
  max-width: 82rem;
  margin: 0 auto;
  padding: 0 8vw 10vh;
}

.ab-contact {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  column-gap: 3vw;
  align-items: baseline;
  padding: 6vh 0;
  border-top: 1px solid #ffffff22;
}

.ab-contact-title {
  grid-column: 1 / 4;
  margin: 0;
  font: 400 0.95rem/1.2 var(--sans);
  letter-spacing: 0.04em;
  color: var(--bone);
  opacity: 0.7;
}

.ab-contact-body {
  grid-column: 4 / 13;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1.4rem;
}

.about .ab-mail {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  font-family: var(--serif);
  font-weight: 300;
  font-size: clamp(1.6rem, 3.6vw, 3.4rem);
  line-height: 1.1;
  letter-spacing: -0.015em;
  overflow-wrap: anywhere;
  color: var(--bone);
  background: linear-gradient(var(--accent), var(--accent)) 0 100% / 0% 1px no-repeat;
  transition: background-size 0.45s var(--ease-out), color 0.2s ease;
}

.about .ab-phone {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  font: 400 1rem/1.3 var(--sans);
  letter-spacing: 0.06em;
  color: var(--bone);
  opacity: 0.8;
  transition: color 0.2s ease, opacity 0.2s ease;
}

.ab-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 2rem;
}

.ab-links a {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  font: 400 0.95rem/1.2 var(--sans);
  letter-spacing: 0.03em;
  color: var(--bone);
  opacity: 0.75;
  transition: opacity 0.2s ease, color 0.2s ease;
}

.ab-contact-icon {
  display: block;
  flex: 0 0 1.1rem;
  width: 1.1rem;
  height: 1.1rem;
}

.ab-cta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
  padding: 2.2rem 0 0;
  border-top: 1px solid #ffffff22;
  font-family: var(--serif);
  font-weight: 300;
  font-size: clamp(1.5rem, 2.6vw, 2.4rem);
  letter-spacing: -0.01em;
  transition: color 0.2s ease;
}

.ab-cta svg {
  flex: none;
  transition: transform 0.35s var(--ease-out);
}

@media (hover: hover) and (pointer: fine) {
  .about .ab-mail:hover {
    background-size: 100% 1px;
    color: var(--accent);
  }

  .ab-links a:hover {
    opacity: 1;
    color: var(--accent);
  }

  .ab-cta:hover {
    color: var(--accent);
  }

  .ab-cta:hover svg {
    transform: translateX(6px);
  }
}

.about a:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 5px;
}

@media (prefers-reduced-motion: reduce) {
  .ab-star {
    animation: none;
  }

  .ab-cta svg,
  .about .ab-mail {
    transition-duration: 0.01ms;
  }
}

/* ---------- Mobile: blocks stack, photos get full width, text keeps a readable size ---------- */
@media (max-width: 900px) {
  .about {
    --pad: clamp(1.4rem, 5vw, 3rem);
  }

  .ab-b {
    height: auto;
    display: block;
  }

  /* 1. Hero: full-width portrait fading into black at the bottom, name sits in the lower part */
  .ab-b1 {
    height: 100svh;
    min-height: 34rem;
  }

  .ab-b1-photo {
    width: 100%;
    -webkit-mask-image: linear-gradient(to bottom, #000 45%, transparent 92%);
    mask-image: linear-gradient(to bottom, #000 45%, transparent 92%);
  }

  .ab-b1-photo::after {
    background: linear-gradient(to top, rgb(0 0 0 / 0.75) 0%, transparent 55%);
  }

  .ab-name {
    top: auto;
    bottom: clamp(3.5rem, 11svh, 6rem);
    transform: none;
    font-size: clamp(2rem, 11.5vw, 3.4rem);
    text-shadow: 0 0 22px rgb(0 0 0 / 0.85);
  }

  .ab-name-line:last-child .ab-name-in {
    padding-left: 0.9em;
  }

  .ab-vertical {
    top: auto;
    bottom: clamp(3.5rem, 11svh, 6rem);
    transform: none;
    right: 1rem;
    font-size: 0.65rem;
  }

  /* 2. Live shows: photo on top, text panel under it */
  .ab-b2-photo {
    height: min(78vw, 36rem);
  }

  .ab-b2-photo img {
    object-position: 60% 50%;
  }

  .ab-b2-panel {
    gap: 1.4rem;
    padding: 2.2rem var(--pad) 2.6rem;
  }

  .ab-b2-title {
    font-size: 0.85rem;
  }

  .ab-star {
    width: 2rem;
  }

  .ab-b2-text {
    font-size: 0.8rem;
    line-height: 1.9;
    letter-spacing: 0.07em;
  }

  /* 3. Text first, portrait under it */
  .ab-b3-text {
    padding: 3.2rem var(--pad) 2.2rem;
    font-size: 0.95rem;
    line-height: 1.8;
    letter-spacing: 0.05em;
  }

  .ab-b3-photo {
    height: min(105vw, 44rem);
    -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 22%);
    mask-image: linear-gradient(to bottom, transparent 0, #000 22%);
  }

  /* 4. Gradient block: curved portrait on top, quote, signature, wordmark - all in normal flow */
  .ab-b4 {
    padding-bottom: 1.5rem;
  }

  .ab-b4-photo {
    height: min(112vw, 46rem);
    width: min(84%, 30rem);
    margin: 0 auto;
    /* centered arch */
    border-radius: 50% 50% 0 0 / 28% 28% 0 0;
  }

  .ab-statement {
    bottom: auto;
    margin-top: 1.8rem;
    padding: 0 var(--pad);
    text-align: center;
  }

  .about .ab-statement p {
    font-size: clamp(1.3rem, 6.4vw, 2rem);
    line-height: 1.25;
  }

  .about .ab-hero-signature {
    position: relative;
    right: auto;
    bottom: auto;
    display: block;
    width: clamp(12rem, 62vw, 20rem);
    margin: 1.4rem auto 0;
  }

  .about .ab-wordmark {
    position: relative;
    bottom: auto;
    margin-top: 0.4rem;
    font-size: 15.2vw;
  }

  /* footer */
  .ab-foot {
    padding: 0 var(--pad) 8vh;
  }

  .ab-contact {
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
    padding: 3rem 0;
  }

  .about .ab-mail {
    font-size: clamp(1.25rem, 6.2vw, 1.8rem);
  }

  .ab-links {
    flex-direction: column;
    gap: 0.9rem;
  }

  .ab-cta {
    padding-top: 1.6rem;
    font-size: 1.4rem;
  }
}
</style>