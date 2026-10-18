<script setup>
import { onBeforeUnmount, onMounted, ref, nextTick } from 'vue'
import { gsap, ScrollTrigger } from '@/lib/gsap'
import { about } from '@/data/about'
import TyperText from '@/components/TyperText.vue'
import MosaicPortrait from '@/components/MosaicPortrait.vue'
// ⚡ OPTIMIZED: portraits are WebP served from the VPS (me3: 1.9MB PNG -> 56KB). The small signature stays bundled.
import sig from '@/assets/podpis.webp'
import { fullUrl } from '@/data/photos'
const me1 = fullUrl('Me/me1.webp')
const me2 = fullUrl('Me/me2.webp')
const me3 = fullUrl('Me/me3.webp')

const root = ref(null)

// Paragraphs after the lead are split between the two photographs.
const body = about.paragraphs.slice(1)
const half = Math.ceil(body.length / 2)
const firstSpread = body.slice(0, half)
const secondSpread = body.slice(half)

// Lens-barrel engraving: the label repeated around the ring (SVG textLength spreads it to fit exactly).
// Repeat count is derived from the label length so letters stay readable instead of being stretched.
const ringUnit = about.label.toUpperCase() + '   •   '
const ringText = ringUnit.repeat(Math.max(1, Math.round(1458 / (ringUnit.length * 15))))

let ctx
let mm
let ro
let refreshTimer
onMounted(async () => {
  await nextTick()
  // the mosaic portrait and web fonts change the page height after mount; re-measure every trigger when that happens
  ro = new ResizeObserver(() => {
    clearTimeout(refreshTimer)
    refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 150)
  })
  ro.observe(root.value)

  ctx = gsap.context(() => {
    gsap.from('.ab-intro .label', { opacity: 0, y: 20, duration: 1, ease: 'expo.out', delay: 0.9 })
    gsap.from('.ab-portrait', { opacity: 0, y: 80, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '.ab-portrait', start: 'top 92%' } })
    gsap.fromTo('.signature', { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 2.4, delay: 0.5, ease: 'power2.inOut', scrollTrigger: { trigger: '.signature', start: 'top 80%' } })
  }, root.value)

  // Everything below is scroll-scrubbed and skipped for reduced motion (CSS default = finished, fully visible page).
  // matchMedia only runs its callback when at least one listed condition matches, so BOTH cases are listed.
  mm = gsap.matchMedia(root.value)
  mm.add(
    { motion: '(prefers-reduced-motion: no-preference)', calm: '(prefers-reduced-motion: reduce)' },
    (c) => {
      if (!c.conditions.motion) return

      // 1. The lens: the photo opens like an iris and settles, while the engraved ring spins one way
      //    and the focus ticks spin the other. All of it is driven by scroll position.
      // The lens is held in place by moving it down at exactly the speed of the page (no CSS sticky and
      // no JS pin), so it works whatever overflow or transforms the surrounding layout has.
      const holdEl = root.value.querySelector('.ab-lens-hold')
      const lensEl = root.value.querySelector('.ab-lens')
      holdEl.classList.add('is-held')
      const lensTop = () => Math.max(16, (window.innerHeight - lensEl.offsetWidth) / 2)
      const holdRange = { trigger: holdEl, start: () => `top ${lensTop()}px`, end: () => `bottom ${lensTop() + lensEl.offsetWidth}px`, invalidateOnRefresh: true }

      // Entry: the iris opens as the lens travels up to the centre of the screen.
      gsap
        .timeline({ scrollTrigger: { trigger: '.ab-lens-hold', start: 'top 90%', end: () => `top ${lensTop()}px`, scrub: 0.8, invalidateOnRefresh: true } })
        .fromTo('.ab-lens-photo', { clipPath: 'circle(3% at 50% 50%)' }, { clipPath: 'circle(50% at 50% 50%)', ease: 'power2.out' }, 0)
        .fromTo('.ab-lens-photo img', { scale: 1.8, rotate: -16 }, { scale: 1, rotate: 0, ease: 'power2.out' }, 0)
        .fromTo('.ab-ring', { rotate: -60, scale: 0.6 }, { rotate: 0, scale: 1, ease: 'none' }, 0)

      // Hold: the lens stays centred while the ring makes one full turn, so every word passes
      // through reading position before the page moves on.
      gsap.to(lensEl, { y: () => holdEl.offsetHeight - lensEl.offsetWidth, ease: 'none', scrollTrigger: { ...holdRange, scrub: true } })
      gsap
        .timeline({ defaults: { ease: 'none' }, scrollTrigger: { ...holdRange, scrub: 0.6 } })
        .fromTo('.ab-ring', { rotate: 0 }, { rotate: 180, immediateRender: false }, 0)
        .fromTo('.ab-ticks', { rotate: 0 }, { rotate: -180, immediateRender: false }, 0)
        .fromTo('.ab-lens-photo img', { scale: 1 }, { scale: 1.08, immediateRender: false }, 0)

      // 2. The arch: the second portrait swings in tilted and small, then rights itself and grows
      //    past its natural size as it leaves; the photo inside counter-rotates.
      gsap
        .timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '.ab-arch', start: 'top 95%', end: 'bottom 5%', scrub: 0.8 } })
        .fromTo('.ab-arch-shape', { rotate: -10, scale: 0.7 }, { rotate: 4, scale: 1.06 }, 0)
        .fromTo('.ab-arch-shape img', { rotate: 10, scale: 1.4 }, { rotate: -4, scale: 1.14 }, 0)

      // 3. The quote: lines drift sideways in opposite directions as they cross the screen.
      root.value.querySelectorAll('.ab-quote p').forEach((p, i) => {
        gsap.fromTo(p, { xPercent: i % 2 ? 6 : -6 }, { xPercent: i % 2 ? -6 : 6, ease: 'none', scrollTrigger: { trigger: p, start: 'top bottom', end: 'bottom top', scrub: true } })
      })

      return () => holdEl.classList.remove('is-held')
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
    <section class="ab-intro" lang="bg">
      <div class="ab-portrait-wrap">
        <figure class="ab-portrait">
          <MosaicPortrait :src="me3" alt="Portrait of the photographer" :cell-size="8" />
        </figure>
        <img :src="sig" class="signature ab-portrait-signature" alt="Photophactory signature" />
      </div>
      <div class="ab-intro-copy">
        <TyperText :text="about.intro" :delay="1" class="ab-typer" accent="#c9a86a" />
      </div>
    </section>

    <article class="ab-story" lang="bg">
      <header class="ab-story-head">
        <h2 class="ab-section-title">{{ about.label }}</h2>
        <p class="ab-lead">{{ about.paragraphs[0] }}</p>
      </header>

      <div class="ab-lens-wrap">
        <div class="ab-lens-hold">
          <figure class="ab-lens">
            <svg class="ab-ticks" viewBox="0 0 520 520" aria-hidden="true">
              <circle cx="260" cy="260" r="254" fill="none" stroke="currentColor" stroke-width="1"
                stroke-dasharray="1 11" />
            </svg>
            <svg class="ab-ring" viewBox="0 0 520 520" aria-hidden="true">
              <defs>
                <path id="ab-ring-path" d="M260,260 m-232,0 a232,232 0 1,1 464,0 a232,232 0 1,1 -464,0" />
              </defs>
              <text>
                <textPath href="#ab-ring-path" :textLength="1458" lengthAdjust="spacing">{{ ringText }}</textPath>
              </text>
            </svg>
            <div class="ab-lens-photo">
              <img :src="me1" alt="Портрет в сянка" fetchpriority="high" decoding="async"
                @load="ScrollTrigger.refresh()" />
            </div>
            <figcaption>{{ about.diptych[0] }}</figcaption>
          </figure>
        </div>
        <div class="ab-text ab-text-a">
          <p v-for="(para, i) in firstSpread" :key="i">{{ para }}</p>
        </div>
      </div>

      <div class="ab-arch">
        <figure class="ab-arch-fig">
          <div class="ab-arch-shape">
            <img :src="me2" alt="Портрет в топла светлина" decoding="async" @load="ScrollTrigger.refresh()" />
          </div>
          <figcaption>{{ about.diptych[1] }}</figcaption>
        </figure>
        <div class="ab-text ab-text-b">
          <p v-for="(para, i) in secondSpread" :key="i">{{ para }}</p>
        </div>
      </div>

      <blockquote class="ab-quote">
        <p v-for="(line, i) in about.quote" :key="i" :class="{ 'is-accent': i === about.quote.length - 1 }">{{ line }}
        </p>
      </blockquote>
    </article>

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
.about {
  --accent: #c9a86a;
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
}

/* ---------- Intro (unchanged) ---------- */
.about .ab-intro {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: auto;
  min-height: 0;
  padding: 0;
  overflow: visible;
}

.about .ab-intro-copy {
  position: relative;
  width: 100%;
  padding: clamp(3rem, 7vw, 7rem) 8vw;
  min-width: 0;
  text-align: center;
}

.about .ab-typer {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 auto;
  width: min(100%, 24em);
  font-family: var(--serif);
  font-weight: 300;
  font-size: clamp(2rem, 5.2vw, 5.4rem);
  line-height: 1.14;
  letter-spacing: -0.02em;
  text-align: center;
}

.about .ab-typer [data-typer] {
  justify-content: center;
  text-align: center;
}

.ab-portrait {
  position: absolute;
  inset: 0;
  z-index: 0;
  margin: 0;
  overflow: hidden;
  clip-path: polygon(9% 0, 83% 0, 86% 10%, 100% 10%, 100% 72%, 82% 72%, 78% 76%, 78% 91%, 74% 100%, 8% 100%, 8% 56%, 5% 52%, 0 51%, 0 21%, 5% 18%);
}

.ab-portrait-wrap {
  position: relative;
  width: min(100vw, 177.68svh);
  aspect-ratio: 1672 / 941;
}

.ab-portrait .mosaic {
  width: 100%;
  height: 100%;
  min-height: 0;
}

.signature {
  width: min(100%, 18rem);
  height: auto;
  margin: 0;
  display: block;
  /* 🛠 FIXED (Safari): removed `filter: brightness(0) invert(1)`. Safari drops that filter chain on an image whose
     clip-path is animated, so the signature rendered BLACK there. podpis.webp is now white already (with its soft
     shadow baked in), so no CSS filter is needed and Chrome / Safari / Firefox look the same. */
  opacity: 0.9;
}

.ab-portrait-signature {
  position: absolute;
  right: 4%;
  bottom: 3%;
  z-index: 1;
  width: clamp(9rem, 17vw, 16rem);
  /* drop-shadow is baked into podpis.webp (was `filter: ... drop-shadow(0 2px 8px rgba(0,0,0,.7))`) */
}

/* ---------- Story ---------- */
.ab-story {
  max-width: 82rem;
  margin: 0 auto;
  padding: 12vh 8vw 10vh;
  overflow-x: clip;
  /* rotating shapes may swing past the edge */
}

.ab-story-head {
  max-width: 40rem;
  margin: 0 0 6vh;
}

.ab-section-title {
  margin: 0 0 1.2rem;
  font: 400 0.95rem/1.2 var(--sans);
  letter-spacing: 0.04em;
  color: var(--bone);
  opacity: 0.7;
}

.ab-lead {
  margin: 0;
  font-family: var(--serif);
  font-weight: 300;
  font-size: clamp(1.7rem, 2.6vw, 2.5rem);
  line-height: 1.25;
  letter-spacing: -0.01em;
  color: var(--accent);
}

.ab-text {
  font-family: var(--serif);
  font-size: clamp(1.1rem, 1.35vw, 1.28rem);
  line-height: 1.75;
  color: var(--bone);
}

.ab-text p {
  margin: 0 0 1.5em;
  max-width: 34em;
}

.ab-text p:last-child {
  margin-bottom: 0;
}

/* --- Lens --- */
.ab-lens-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 18vh;
}

.ab-lens-hold {
  --lens: min(60vw, 68svh);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  width: 100%;
  margin: clamp(3rem, 12vw, 11rem) 0 clamp(4rem, 14vw, 12rem);
}

/* only when scroll animation is active: extra 160svh = how long the ring keeps turning */
.ab-lens-hold.is-held {
  height: calc(var(--lens) + 160svh);
}

.ab-lens {
  position: relative;
  flex: none;
  width: var(--lens);
  aspect-ratio: 1;
  margin: 0;
}

.ab-lens-photo {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: 50%;
  background: #15151c;
}

.ab-lens-photo img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* rings sit outside the photo; 520 viewBox / photo diameter 406 = 128% */
/* ⚡ OPTIMIZED: everything GSAP moves on scroll gets its own GPU layer, so rotating the SVG text ring, scaling the
   photos and sliding the lens no longer repaints text/images on the CPU every frame */
.ab-ring,
.ab-ticks,
.ab-lens,
.ab-lens-photo img,
.ab-arch-shape,
.ab-arch-shape img {
  will-change: transform;
}

.ab-ring,
.ab-ticks {
  position: absolute;
  top: -14%;
  left: -14%;
  width: 128%;
  height: 128%;
  pointer-events: none;
}

.ab-ring text {
  font: 400 22px var(--sans);
  fill: var(--accent);
}

.ab-ticks {
  color: var(--bone);
  opacity: 0.45;
}

.ab-lens figcaption,
.ab-arch-fig figcaption {
  font: 400 0.82rem/1.45 var(--sans);
  letter-spacing: 0.02em;
  color: var(--bone);
  opacity: 0.7;
}

.ab-lens figcaption {
  position: absolute;
  top: calc(100% + 14%);
  left: 50%;
  transform: translateX(-50%);
  width: max-content;
  max-width: 90vw;
  text-align: center;
}

.ab-text-a {
  align-self: flex-end;
  width: min(100%, 34em);
  margin-right: 8%;
}

/* --- Arch --- */
.ab-arch {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  column-gap: 3vw;
  align-items: end;
  margin-bottom: 22vh;
}

.ab-arch-fig {
  grid-column: 1 / 7;
  margin: 0;
}

.ab-arch-shape {
  aspect-ratio: 4 / 5;
  overflow: hidden;
  border-radius: 999px 999px 0 0;
  background: #15151c;
}

.ab-arch-shape img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ab-arch-fig figcaption {
  margin-top: 1.4rem;
}

.ab-text-b {
  grid-column: 8 / 13;
  padding-bottom: 6vh;
}

/* --- Quote --- */
.ab-quote {
  margin: 0;
  padding: 0;
}

.ab-quote p {
  margin: 0;
  font-family: var(--serif);
  font-weight: 300;
  font-size: clamp(2.4rem, 7vw, 7.4rem);
  line-height: 1;
  letter-spacing: -0.03em;
  will-change: transform;
}

.ab-quote p+p {
  margin-top: 0.08em;
}

.ab-quote p.is-accent {
  color: var(--accent);
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

  .ab-cta svg,
  .about .ab-mail {
    transition-duration: 0.01ms;
  }
}

/* ---------- Mobile ---------- */
@media (max-width: 720px) {
  /* 🛠 FIXED (mobile): the signature sits in the notch cut out of the portrait's bottom-right corner. That notch is
     ~22% of the portrait's width, but the desktop size has a 9rem minimum, which on a phone is ~37% of the width and
     spilled over the photo. On phones it is now sized relative to the portrait so it stays inside the notch. */
  .ab-portrait-signature {
    width: 21%;
    right: 3%;
    bottom: 2%;
  }

  .about .ab-intro {
    grid-template-columns: 1fr;
    gap: 7vh;
    padding: 20vh 6vw 10vh;
  }

  .about .ab-typer {
    margin-top: 2rem;
  }

  .ab-story {
    padding: 9vh 6vw 8vh;
  }

  .ab-lens-hold {
    --lens: 66vw;
    margin: 18vw 0 24vw;
  }

  .ab-text-a {
    margin-right: 0;
  }

  .ab-arch {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 6vh;
    margin-bottom: 14vh;
  }

  .ab-arch-fig {
    width: 82%;
    align-self: center;
  }

  .ab-text-b {
    padding-bottom: 0;
  }

  .ab-quote p {
    font-size: clamp(2.2rem, 11vw, 4rem);
  }

  .ab-foot {
    padding: 0 6vw 8vh;
  }

  .ab-contact {
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
  }
}
</style>