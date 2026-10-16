<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const open = ref(false)
const close = () => { open.value = false }

const onKey = (e) => { if (e.key === 'Escape') close() }
let mql
const onWide = (e) => { if (e.matches) close() }

// Close after navigating, and lock page scroll while the full-screen menu is open.
watch(() => route.fullPath, close)
watch(open, (isOpen) => {
  document.documentElement.style.overflow = isOpen ? 'hidden' : ''
  document.documentElement.classList.toggle('nav-open', isOpen)
})

onMounted(() => {
  window.addEventListener('keydown', onKey)
  mql = window.matchMedia('(min-width: 641px)')
  mql.addEventListener('change', onWide)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  mql?.removeEventListener('change', onWide)
  document.documentElement.style.overflow = ''
  document.documentElement.classList.remove('nav-open')
})
</script>

<template>
  <Teleport to="body">
    <header class="nav" :class="{ 'is-open': open }">
      <RouterLink to="/" class="nav-brand" aria-label="Photophactory Home" @click="close">
        PHOTOPHACTORY
      </RouterLink>

      <button class="nav-toggle" type="button" :aria-expanded="open" aria-controls="primary-nav"
        :aria-label="open ? 'Close menu' : 'Open menu'" @click="open = !open">
        <span class="bar"></span>
        <span class="bar"></span>
      </button>

      <nav id="primary-nav" aria-label="Primary Navigation" @click="close">
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/work">Work</RouterLink>
        <RouterLink to="/about">About</RouterLink>
      </nav>
    </header>
  </Teleport>
</template>

<style scoped>
.nav {
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  position: fixed;
  inset: 0 0 auto;
  z-index: 1000;
  mix-blend-mode: normal;
  /* above every page layer, including the image reel */
  display: flex;
  justify-content: space-between;
  align-items: center;
  /* safe-area insets need viewport-fit=cover in index.html; they are 0 without it */
  padding:
    calc(1.5rem + env(safe-area-inset-top, 0px)) calc(4vw + env(safe-area-inset-right, 0px)) 1.5rem calc(4vw + env(safe-area-inset-left, 0px));
  pointer-events: none;
  -webkit-tap-highlight-color: transparent;
}

.nav-brand,
.nav nav {
  pointer-events: auto;
}

.nav-brand {
  position: relative;
  z-index: 2;
  font: 600 0.72rem var(--sans);
  letter-spacing: 0.28em;
  color: var(--bone);
  text-transform: uppercase;
  opacity: 0.9;
  transition: opacity 0.3s, color 0.3s;
  touch-action: manipulation;
}

.nav nav {
  display: flex;
  gap: 2rem;
  padding: 0.65rem 1.4rem;
  border-radius: 999px;
  background: rgba(10, 10, 16, 0.45);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(239, 233, 223, 0.12);
}

.nav nav a {
  font: 500 0.68rem/1 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--bone);
  -webkit-text-stroke: 0 !important;
  text-shadow: none !important;
  opacity: 0.7;
  position: relative;
  transition: opacity 0.3s, color 0.3s;
  touch-action: manipulation;
}

.nav nav a.router-link-active {
  opacity: 1;
  color: var(--gold);
}

.nav nav a.router-link-active::after {
  transform: scaleX(1);
  transform-origin: left;
  background: var(--gold);
}

/* hover only where a real pointer exists, so taps don't leave links stuck highlighted */
@media (hover: hover) and (pointer: fine) {
  .nav-brand:hover {
    color: var(--gold);
  }

  .nav nav a:hover {
    opacity: 1;
    color: var(--gold);
  }
}

/* press feedback for touch */
.nav-brand:active,
.nav nav a:active {
  opacity: 1;
  color: var(--gold);
}

/* the menu button only exists on phones */
.nav-toggle {
  display: none;
}

/* ---------- Tablet: tighten ---------- */
@media (max-width: 900px) {
  .nav nav {
    gap: 1.4rem;
    padding: 0.6rem 1.1rem;
  }

  .nav-brand {
    letter-spacing: 0.22em;
  }
}

/* ---------- Phone: brand + menu button, links become a full-screen menu ---------- */
@media (max-width: 640px) {
  .nav {
    padding-top: calc(1rem + env(safe-area-inset-top, 0px));
    padding-bottom: 1rem;
  }

  .nav-toggle {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 6px;
    width: 3rem;
    height: 2.75rem;
    /* 44px minimum touch target */
    padding: 0;
    border-radius: 999px;
    border: 1px solid rgba(239, 233, 223, 0.12);
    background: rgba(10, 10, 16, 0.45);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    color: var(--bone);
    pointer-events: auto;
    touch-action: manipulation;
    user-select: none;
    -webkit-user-select: none;
    cursor: pointer;
  }

  .nav-toggle .bar {
    display: block;
    width: 18px;
    height: 1px;
    background: currentColor;
    transition: transform 0.35s var(--ease-out);
  }

  .nav.is-open .nav-toggle .bar:nth-child(1) {
    transform: translateY(3.5px) rotate(45deg);
  }

  .nav.is-open .nav-toggle .bar:nth-child(2) {
    transform: translateY(-3.5px) rotate(-45deg);
  }

  .nav nav {
    position: fixed;
    inset: 0;
    z-index: 1;
    flex-direction: column;
    justify-content: center;
    gap: clamp(0.6rem, 3svh, 1.4rem);
    padding: 6rem 8vw 3rem;
    overflow-y: auto;
    border: 0;
    border-radius: 0;
    /* darker, but translucent enough that the blurred page shows through */
    background: rgba(4, 4, 8, 0.4);
    backdrop-filter: blur(28px) saturate(0.8) brightness(0.6);
    -webkit-backdrop-filter: blur(28px) saturate(0.8) brightness(0.6);
    /* closed: fully out of the way and out of the tab order */
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition: opacity 0.35s var(--ease-out), visibility 0s linear 0.35s;
  }

  .nav.is-open nav {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transition: opacity 0.35s var(--ease-out), visibility 0s;
  }

  .nav nav a {
    padding: 0.9rem 0;
    /* tap area only; the type stays exactly as on desktop */
    opacity: 0;
    transform: translateY(18px);
    transition: opacity 0.5s var(--ease-out), transform 0.5s var(--ease-out), color 0.3s;
  }

  .nav.is-open nav a {
    opacity: 0.85;
    transform: none;
  }

  .nav.is-open nav a.router-link-active {
    opacity: 1;
  }

  /* links arrive one after another */
  .nav.is-open nav a:nth-child(1) {
    transition-delay: 0.05s, 0.05s, 0s;
  }

  .nav.is-open nav a:nth-child(2) {
    transition-delay: 0.11s, 0.11s, 0s;
  }

  .nav.is-open nav a:nth-child(3) {
    transition-delay: 0.17s, 0.17s, 0s;
  }
}

@media (prefers-reduced-motion: reduce) {

  .nav nav,
  .nav nav a,
  .nav-toggle .bar {
    transition-duration: 0.01ms !important;
    transition-delay: 0s !important;
    transform: none;
  }

  .nav.is-open .nav-toggle .bar:nth-child(1) {
    transform: translateY(3.5px) rotate(45deg);
  }

  .nav.is-open .nav-toggle .bar:nth-child(2) {
    transform: translateY(-3.5px) rotate(-45deg);
  }
}
</style>

<style>
/* While the phone menu is open the page itself is blurred and darkened. This works on the
   page content directly, so nothing in it (canvas, 3D image reel, fixed layers) can stay sharp. */
#app>main {
  transition: filter 0.35s cubic-bezier(0.23, 1, 0.32, 1);
}

html.nav-open #app>main {
  filter: blur(14px) brightness(0.4);
}

@media (min-width: 641px) {
  html.nav-open #app>main {
    filter: none;
  }
}
</style>