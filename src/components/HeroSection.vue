<script setup>
import heroImage from '@/images/portraits/Vikaskilim/GVK.jpg'

defineProps({
  title: { type: String, default: 'Photophactory' },
  tagline: { type: String, default: 'A studio for images that hold still.' },
})
</script>

<template>
  <section class="hero">
    <img :src="heroImage" alt="" class="hero-img" />
    <div class="hero-scrim" />
    <!-- 
    <div class="hero-copy">
      <h1 class="hero-title">{{ title }}</h1>
      <p class="hero-tagline">{{ tagline }}</p>
    </div> -->

    <a href="#works" class="hero-scroll" aria-label="Scroll to work">
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
  overflow: hidden;
  display: flex;
  align-items: flex-end;
  color: #fff;
}

.hero-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.7;
}

.hero-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.9), transparent 60%);
}

.hero-copy {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0 6% 8%;
}

.hero-title {
  margin: 0;
  font-size: clamp(2.5rem, 8vw, 6rem);
  line-height: 1;
  font-weight: 500;
  letter-spacing: -0.02em;
}

.hero-tagline {
  margin: 0;
  max-width: 28rem;
  font-size: clamp(0.95rem, 1.6vw, 1.25rem);
  opacity: 0.8;
}

.hero-scroll {
  position: absolute;
  right: 6%;
  bottom: 8%;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 9999px;
  color: #fff;
  transition: border-color 0.2s;
}

.hero-scroll:hover {
  border-color: #fff;
}
</style>
