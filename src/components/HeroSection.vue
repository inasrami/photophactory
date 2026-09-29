<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import gsap from 'gsap'
// import heroImage from '@/images/portraits/Vikaskilim/GVK.jpg'
import heroImage from '@/images/fon1.png'

const props = defineProps({
  title: { type: String, default: 'Photophactory' },
  tagline: { type: String, default: 'A studio for images that hold still.' },
  image: { type: String, default: heroImage },
})

const titleChars = computed(() => props.title.split(''))

const irisRef = ref(null)
const apertureRef = ref(null)
const taglineRef = ref(null)
const scrollRef = ref(null)
const letterEls = []
const setLetterRef = (el, i) => {
  if (el) letterEls[i] = el
}

let tl = null

const reducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// A critically-damped settle (no overshoot) — this reveal is on-load, not
// gesture-driven, so per Apple's own rule bounce has no business here.
// Bounce is reserved for the one moment below that a person actually touches.
const SETTLE = 'power3.out'

onMounted(() => {
  if (reducedMotion()) {
    // Reduced motion isn't "no feedback" — it's a gentler, non-vestibular
    // equivalent: a short opacity cross-fade, no movement, no bounce.
    if (irisRef.value) irisRef.value.style.display = 'none'
    if (apertureRef.value) apertureRef.value.style.display = 'none'
    gsap.set(letterEls, { y: 0, rotateX: 0 })
    gsap.set([taglineRef.value, scrollRef.value], { y: 0 })
    gsap.to([...letterEls, taglineRef.value, scrollRef.value], {
      opacity: 1,
      duration: 0.3,
      ease: 'power1.out',
    })
    return
  }

  const iris = { r: 0 }
  tl = gsap.timeline({ defaults: { ease: 'power3.inOut' } })

  tl.to(iris, {
    r: 145,
    duration: 1.3,
    ease: 'power3.inOut',
    onUpdate: () => {
      if (irisRef.value) irisRef.value.style.clipPath = `circle(${iris.r}% at 50% 50%)`
    },
    onComplete: () => {
      if (irisRef.value) irisRef.value.style.display = 'none'
    },
  })
    .to(
      apertureRef.value,
      { scale: 1.6, rotate: 35, opacity: 0, duration: 1.1, ease: 'power2.in' },
      '<0.05',
    )
    .fromTo(
      letterEls,
      { yPercent: 120, rotateX: -45, opacity: 0 },
      { yPercent: 0, rotateX: 0, opacity: 1, duration: 0.85, ease: SETTLE, stagger: 0.032 },
      '-=0.65',
    )
    .fromTo(
      taglineRef.value,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.7, ease: SETTLE },
      '-=0.45',
    )
    .fromTo(scrollRef.value, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: SETTLE }, '-=0.5')
})

onBeforeUnmount(() => {
  tl?.kill()
})
</script>

<template>
  <section class="hero">
    <img :src="image" alt="" class="hero-photo" />
    <div class="hero-scrim" />

    <div ref="irisRef" class="hero-iris" aria-hidden="true" />
    <svg ref="apertureRef" class="hero-aperture" viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="34" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="1.6"
        stroke-dasharray="9 6" />
      <circle cx="50" cy="50" r="19" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="1" />
    </svg>

    <div class="hero-copy">
      <h1 class="hero-title" aria-label="Photophactory">
        <span v-for="(char, i) in titleChars" :key="i" class="hero-letter" :ref="(el) => setLetterRef(el, i)">{{ char
          === ' ' ? '\u00A0' : char }}</span>
      </h1>
      <p ref="taglineRef" class="hero-tagline">{{ tagline }}</p>
    </div>

    <a ref="scrollRef" href="#works" class="hero-scroll" aria-label="Scroll to work">
      <svg viewBox="0 0 12 12" width="14" height="14" aria-hidden="true">
        <path d="M6 1v10M2 7l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"
          stroke-linejoin="round" />
      </svg>
    </a>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  width: 100%;
  height: 100vh;
  min-height: 560px;
  overflow: hidden;
  background: #0a0a0a;
  color: #fff;
}

/* Static and untouched — the reveal happens in front of it, never to it */
.hero-photo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.hero-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top,
      rgba(0, 0, 0, 0.8) 0%,
      rgba(0, 0, 0, 0.35) 30%,
      rgba(0, 0, 0, 0.06) 55%,
      transparent 72%);
}

/* Starts as a closed aperture, opens once on load, then removed from flow */
.hero-iris {
  position: absolute;
  inset: 0;
  z-index: 2;
  background: #0a0a0a;
  clip-path: circle(0% at 50% 50%);
  pointer-events: none;
}

.hero-aperture {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 3;
  width: 4.5rem;
  height: 4.5rem;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.hero-copy {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  padding: 0 5% 6%;
}

.hero-title {
  margin: 0;
  display: block;
  font-family: 'Fraunces', 'Montserrat', serif;
  font-style: italic;
  font-weight: 560;
  font-size: clamp(3rem, 11.5vw, 9.5rem);
  line-height: 0.88;
  /* tight leading — large display type wants less air */
  letter-spacing: -0.015em;
  /* negative tracking as size grows */
  font-optical-sizing: auto;
  /* Fraunces is a variable font — let its opsz axis do the work */
  perspective: 800px;
}

.hero-letter {
  display: inline-block;
  transform-origin: 50% 100%;
}

.hero-tagline {
  margin: 1.1rem 0 0;
  max-width: 26rem;
  font-size: clamp(0.95rem, 1.4vw, 1.05rem);
  font-weight: 400;
  opacity: 0;
}

.hero-scroll {
  position: absolute;
  right: 5%;
  bottom: 6%;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 9999px;
  color: #fff;
  opacity: 0;
  transform: scale(1);
  transition:
    border-color 0.2s,
    /* release settles with a hair of bounce — this is the one moment
       someone actually touches, so a little momentum feels right */
    transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.hero-scroll:hover {
  border-color: #fff;
}

.hero-scroll:active {
  /* respond the instant the finger/cursor lands — never wait for release */
  transform: scale(0.92);
  transition: transform 0.08s linear;
}

@media (max-width: 640px) {
  .hero-title {
    font-size: clamp(2.5rem, 13vw, 4.5rem);
  }
}
</style>