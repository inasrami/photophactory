<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from '@/lib/gsap'
import { lenis } from '@/lib/lenis'

const root = ref(null)
const viewWork = () => lenis.scrollTo('#rooms', { duration: 1.2 })
const contact = () => lenis.scrollTo('#contact', { duration: 1.2 })

let mm
onMounted(() => {
  const q = gsap.utils.selector(root.value)
  mm = gsap.matchMedia()
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    gsap.timeline({ defaults: { ease: 'expo.out' } })
      .from(q('.hero-image'), { scale: 1.04, duration: 1.8 }, 0)
      .from(q('.hero-eyebrow, .hero-copy, .hero-bottom'), {
        opacity: 0,
        y: 24,
        duration: 0.9,
        stagger: 0.12,
      }, 0.2)

    gsap.to(q('.hero-image'), {
      yPercent: 7,
      ease: 'none',
      scrollTrigger: { trigger: root.value, start: 'top top', end: 'bottom top', scrub: 0.6 },
    })
  })
})
onBeforeUnmount(() => mm?.revert())
</script>

<template>
  <section ref="root" class="hero" aria-labelledby="hero-title">
    <div class="hero-media" aria-hidden="true">
      <img src="/images/hero-portrait.jpg" alt="" class="hero-image" fetchpriority="high" decoding="async" />
    </div>
    <div class="hero-shade" aria-hidden="true" />

    <div class="hero-inner">
      <!-- <div class="hero-eyebrow">
        <span class="hero-mark" aria-hidden="true">P.</span>
        <span class="label">Photophactory · Independent photography</span>
      </div> -->

      <div class="hero-copy">
        <!-- <p class="hero-overline label">Concerts / Portraits / People</p> -->
        <h1 id="hero-title" class="hero-title">
          The feeling<br />
          of being <em>there.</em>
        </h1>
        <p class="hero-description">
          Portraits and live music, held just as they felt.
        </p>
        <!-- <div class="hero-actions">
          <a class="hero-button" href="#rooms" @click.prevent="viewWork">
            Explore the stories <span aria-hidden="true">↘</span>
          </a>
          <a class="hero-link" href="#contact" @click.prevent="contact">
            Book a session <span aria-hidden="true">↗</span>
          </a>
        </div> -->
      </div>

      <div class="hero-bottom">
        <span class="hero-caption label">Honest frames, made to last</span>
        <a class="hero-scroll label" href="#rooms" @click.prevent="viewWork">
          Scroll to explore <span aria-hidden="true">↓</span>
        </a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  --hero-accent: #c9a86a;
  position: relative;
  isolation: isolate;
  display: flex;
  min-height: 42rem;
  height: 100svh;
  overflow: hidden;
  background: var(--ink);
  color: var(--bone);
}

.hero-media,
.hero-shade {
  position: absolute;
  inset: 0;
}

.hero-media {
  overflow: hidden;
}

.hero-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 68% 48%;
  will-change: transform;
}

.hero-shade {
  z-index: 1;
  background:
    linear-gradient(90deg, rgb(10 10 16 / 0.88) 0%, rgb(10 10 16 / 0.72) 30%, rgb(10 10 16 / 0.38) 55%, transparent 82%),
    linear-gradient(0deg, rgb(10 10 16 / 0.55), transparent 45%);
}

.hero-inner {
  position: relative;
  z-index: 2;
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: space-between;
  padding: clamp(7.5rem, 16vh, 10.5rem) 7vw clamp(2rem, 5vh, 3.5rem);
}

.hero-eyebrow {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.hero-mark {
  display: grid;
  width: 2.5rem;
  aspect-ratio: 1;
  place-items: center;
  border: 1px solid rgb(239 233 223 / 0.35);
  border-radius: 50%;
  color: var(--hero-accent);
  font: 1.35rem/1 var(--serif);
}

.hero-eyebrow .label {
  letter-spacing: 0.17em;
}

.hero-copy {
  width: min(100%, 52rem);
  padding: 3rem 0;
}

.hero-overline {
  margin-bottom: 1.5rem;
  color: var(--hero-accent);
}

.hero-title {
  position: relative;
  right: auto;
  bottom: auto;
  left: auto;
  z-index: auto;
  margin: 0;
  text-align: left;
  font: 400 clamp(4.25rem, 8vw, 8.8rem) / 0.88 var(--serif);
  letter-spacing: -0.065em;
  white-space: normal;
}

.hero-title em {
  color: var(--hero-accent);
  font-weight: 400;
}

.hero-description {
  max-width: 25rem;
  margin-top: 1.6rem;
  color: rgb(239 233 223 / 0.76);
  font-size: clamp(0.95rem, 1.2vw, 1.08rem);
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.8rem;
  margin-top: 2rem;
}

.hero-button,
.hero-link {
  display: inline-flex;
  align-items: center;
  gap: 1rem;
  min-height: 3.25rem;
  font: 500 0.68rem/1 var(--sans);
  letter-spacing: 0.13em;
  text-transform: uppercase;
  transition: color 180ms ease, background-color 180ms ease, border-color 180ms ease;
}

.hero-button {
  padding: 0 1.35rem;
  border: 1px solid var(--bone);
  background: var(--bone);
  color: var(--ink);
}

.hero-button:hover {
  border-color: var(--hero-accent);
  background: var(--hero-accent);
}

.hero-link {
  min-height: 2rem;
  border-bottom: 1px solid rgb(239 233 223 / 0.48);
}

.hero-link:hover,
.hero-scroll:hover {
  color: var(--hero-accent);
}

.hero-button:focus-visible,
.hero-link:focus-visible,
.hero-scroll:focus-visible {
  outline: 2px solid var(--hero-accent);
  outline-offset: 5px;
}

.hero-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.hero-caption {
  color: rgb(239 233 223 / 0.68);
}

.hero-scroll {
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
  transition: color 180ms ease;
}

.hero-scroll span {
  color: var(--hero-accent);
  font-size: 1rem;
}

@media (max-width: 700px) {
  .hero {
    min-height: 44rem;
    height: 100svh;
  }

  .hero-image {
    object-position: 70% 45%;
  }

  .hero-shade {
    background:
      linear-gradient(0deg, rgb(10 10 16 / 0.92) 0%, rgb(10 10 16 / 0.78) 30%, rgb(10 10 16 / 0.2) 68%, transparent 92%),
      linear-gradient(90deg, rgb(10 10 16 / 0.2), transparent 80%);
  }

  .hero-inner {
    padding: 7.5rem 1.35rem 1.5rem;
  }

  .hero-copy {
    width: 100%;
    padding: 1rem 0;
  }

  .hero-title {
    font-size: clamp(3.6rem, 14vw, 6.2rem);
  }

  .hero-description {
    max-width: 21rem;
    margin-top: 1.2rem;
  }

  .hero-actions {
    gap: 1rem;
    margin-top: 1.5rem;
  }

  .hero-bottom {
    align-items: flex-end;
  }

  .hero-caption {
    max-width: 10rem;
    line-height: 1.5;
  }
}

@media (max-width: 380px) {
  .hero-eyebrow .label {
    font-size: 0.58rem;
  }

  .hero-actions {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
