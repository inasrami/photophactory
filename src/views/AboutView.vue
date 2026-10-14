<script setup>
import { onBeforeUnmount, onMounted, ref, nextTick } from 'vue'
import { gsap, ScrollTrigger } from '@/lib/gsap'
import { about } from '@/data/about'
import TyperText from '@/components/TyperText.vue'
import MosaicPortrait from '@/components/MosaicPortrait.vue'
import sig from '@/images/podpis.png'
import me1 from '@/images/optimized/Me/me1.jpg?url'
import me2 from '@/images/optimized/Me/me2.jpg?url'
import me3 from '@/images/Me/me3.png?url'

const root = ref(null)
const words = (t) => t.split(' ')
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
    gsap.from('.ab-contact > *', { opacity: 0, y: 40, stagger: 0.12, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.ab-contact', start: 'top 85%' } })
    gsap.fromTo('.signature', { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 2.4, delay: 0.5, ease: 'power2.inOut', scrollTrigger: { trigger: '.signature', start: 'top 80%' } })
  }, root.value)

  // "За мен" story + closing quote. Skipped entirely for reduced motion (CSS default = fully visible).
  mm = gsap.matchMedia(root.value)
  mm.add(
    { calm: '(prefers-reduced-motion: reduce)' },
    (c) => {
      if (c.conditions.calm) return

      // heading: letters rise out of their masks
      gsap.from('.ab-title .ch', { yPercent: 115, rotate: 4, duration: 1.4, stagger: 0.06, ease: 'expo.out', scrollTrigger: { trigger: '.ab-title', start: 'top 85%' } })
      gsap.from('.ab-story-head .label', { opacity: 0, x: -16, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.ab-story-head .label', start: 'top 90%' } })

      // Story copy and photographs reveal independently as they enter the viewport.
      gsap.from('.ab-lead', { opacity: 0, y: 40, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.ab-lead', start: 'top 85%' } })
      gsap.from('.ab-story-photo', {
        opacity: 0,
        y: 36,
        duration: 1.2,
        stagger: 0.16,
        ease: 'expo.out',
        scrollTrigger: { trigger: '.ab-story-flow', start: 'top 78%' },
      })
      root.value.querySelectorAll('.ab-p').forEach((paragraph) => {
        gsap.from(paragraph, {
          opacity: 0,
          y: 24,
          duration: 1,
          ease: 'expo.out',
          scrollTrigger: { trigger: paragraph, start: 'top 88%' },
        })
      })

      // closing quote: words slide up out of masks, second sentence in gold
      gsap.from('.ab-quote .qw', { yPercent: 115, duration: 1.3, stagger: 0.07, ease: 'expo.out', scrollTrigger: { trigger: '.ab-quote', start: 'top 70%' } })
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
      <div class="ab-intro-copy">
        <span class="label">About</span>
        <TyperText :text="about.intro" :delay="1" class="ab-typer" accent="#c9a86a" />
      </div>
      <figure class="ab-portrait">
        <MosaicPortrait :src="me3" alt="Portrait of the photographer" :cell-size="5" />
      </figure>
    </section>
    <section class="ab-story" lang="bg">
      <header class="ab-story-head">
        <span class="label">{{ about.label }}</span>
        <!-- <h1 class="ab-title" :aria-label="about.heading"><span v-for="(ch, i) in about.heading.toUpperCase().split('')"
            :key="i" class="mask" aria-hidden="true"><span class="ch">{{ ch === ' ' ? '\u00A0' : ch }}</span></span>
        </h1> -->
        <p class="ab-lead">{{ about.paragraphs[0] }}</p>
      </header>
      <div class="ab-story-flow">
        <figure class="ab-story-photo ab-story-photo-main">
          <img :src="me1" alt="Портрет в сянка" fetchpriority="high" decoding="async" @load="ScrollTrigger.refresh()" />
          <figcaption><span>01</span>{{ about.diptych[0] }}</figcaption>
        </figure>
        <div class="ab-copy ab-copy-first">
          <p class="ab-p">{{ about.paragraphs[1] }}</p>
        </div>
        <figure class="ab-story-photo ab-story-photo-secondary">
          <img :src="me2" alt="Портрет в топла светлина" decoding="async" @load="ScrollTrigger.refresh()" />
          <figcaption><span>02</span>{{ about.diptych[1] }}</figcaption>
        </figure>
        <div class="ab-copy ab-copy-rest">
          <p v-for="(para, i) in about.paragraphs.slice(2)" :key="i" class="ab-p">{{ para }}</p>
        </div>
      </div>
    </section>
    <section class="ab-closing">
      <section class="ab-quote" lang="bg">
        <p v-for="(line, i) in about.quote" :key="i" :class="{ 'is-accent': i === about.quote.length - 1 }">
          <template v-for="(w, j) in words(line)" :key="j">
            <span class="mask"><span class="qw">{{ w }}</span></span>
            <span v-if="j < words(line).length - 1">&nbsp;</span>
          </template>
        </p>
      </section>
      <section class="ab-second">
        <span class="label">Photophactory</span>
        <img :src="sig" class="signature" alt="Photophactory signature" />
      </section>
    </section>
    <section class="ab-contact" lang="bg">
      <span class="label">{{ about.contact.label }}</span>
      <div class="ab-contact-details">
        <a :href="`mailto:${about.contact.email}`" class="f-mail">{{ about.contact.email }}</a>
        <div class="ab-links">
          <a v-for="l in about.contact.links" :key="l.href" :href="l.href" target="_blank" rel="noopener">{{ l.label }}
            ↗</a>
        </div>
      </div>
    </section>
    <RouterLink to="/work" class="ab-cta"><span class="label">See the stories</span>
      <h2>All work →</h2>
    </RouterLink>
  </main>
</template>

<style>
/* Split intro inspired by the reference layout, using the existing animated portrait */
.about .ab-intro {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 0.88fr) minmax(0, 1.12fr);
  align-items: center;
  gap: 4vw;
  padding: 21vh 8vw 13vh;
}

.ab-intro-copy {
  min-width: 0;
}

.about .ab-typer {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin: 2.5rem 0 0;
  width: min(100%, 20em);
  font-family: var(--serif);
  font-weight: 300;
  font-size: clamp(2rem, 5.2vw, 5.4rem);
  line-height: 1.14;
  letter-spacing: -0.02em;
  text-align: left;
}

/* Keep the animated words aligned with the copy column */
.about .ab-typer [data-typer] {
  justify-content: flex-start;
  text-align: left;
}

/* Notched feature image, rendered from the same photo as the mosaic effect */
.ab-portrait {
  position: relative;
  width: 100%;
  margin: 0;
  overflow: hidden;
  clip-path: polygon(9% 0, 83% 0, 86% 10%, 100% 10%, 100% 72%, 82% 72%, 78% 76%, 78% 91%, 74% 100%, 8% 100%, 8% 56%, 5% 52%, 0 51%, 0 21%, 5% 18%);
}

.ab-portrait .mosaic {
  min-height: 0;
}

/* Closing note and signature share one compact, editorial row */
.ab-closing {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(14rem, 0.7fr);
  align-items: end;
  gap: 4vw;
  margin: 0 8vw;
  padding: 10vh 0 8vh;
  border-top: 1px solid #ffffff22;
}

.ab-closing .ab-quote {
  padding: 0;
  text-align: left;
}

.ab-closing .ab-quote p {
  max-width: 16ch;
  margin-left: 0;
  margin-right: 0;
  font-size: clamp(2.6rem, 5.8vw, 6.4rem);
  line-height: 1.02;
}

.ab-closing .ab-quote p+p {
  margin-top: 0.14em;
}

.about .ab-second {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-end;
  gap: 1.8rem;
  min-height: 10rem;
  padding: 0 0 0 2.4vw;
  border-left: 1px solid #ffffff22;
}

.signature {
  width: min(100%, 18rem);
  height: auto;
  margin: 0;
  display: block;
  filter: brightness(0) invert(1);
  opacity: 0.9;
}

/* Contact is presented as one clear, aligned invitation */
.ab-contact {
  display: grid;
  grid-template-columns: minmax(10rem, 1fr) minmax(0, 2fr);
  align-items: start;
  gap: 2rem;
  padding: 6vh 8vw 8vh;
  border-top: 1px solid #ffffff22;
}

.ab-contact-details {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1.8rem;
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

.ab-cta {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 2rem;
  padding: 7vh 8vw 9vh;
  text-align: left;
  border-top: 1px solid #ffffff22;
}

.ab-cta .label {
  padding-bottom: 0.8rem;
}

.ab-cta h2 {
  margin: 0;
  font-size: clamp(3rem, 8vw, 8rem);
  line-height: 0.95;
  transition: color 0.4s, transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.ab-cta:hover h2 {
  transform: translateX(0.2em);
}

@media (max-width: 720px) {
  .about .ab-intro {
    grid-template-columns: 1fr;
    gap: 7vh;
    padding-top: 20vh;
    padding-right: 6vw;
    padding-bottom: 10vh;
    padding-left: 6vw;
  }

  .about .ab-typer {
    margin-top: 2rem;
  }

  .ab-closing {
    grid-template-columns: 1fr;
    gap: 6vh;
    margin: 0 6vw;
    padding: 8vh 0;
  }

  .about .ab-second {
    min-height: 0;
    padding: 0;
    border-left: 0;
  }

  .ab-contact {
    grid-template-columns: 1fr;
    gap: 1.8rem;
    padding: 6vh 6vw 8vh;
  }

  .ab-cta {
    align-items: flex-start;
    flex-direction: column;
    gap: 1.2rem;
    padding: 6vh 6vw 8vh;
  }

}

/* ---- "За мен": free-flowing editorial story ---- */
.about {
  --accent: #c9a86a;
}

.ab-story {
  padding: 13vh 8vw 16vh;
}

.ab-story-head {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  align-items: end;
  column-gap: 5vw;
  max-width: 74rem;
  margin: 0 auto 10vh;
}

.ab-story-head>.label {
  grid-column: 1 / -1;
  margin-bottom: 1rem;
}

.ab-title {
  grid-column: 1;
  grid-row: 2;
  margin: 0;
  font-weight: 280;
  font-size: clamp(3rem, 10vw, 8rem);
  line-height: 0.95;
  letter-spacing: -0.03em;

}

.ab-lead {
  grid-column: 2;
  grid-row: 2;
  margin: 0;
  max-width: 14em;
  font-family: var(--serif);
  font-weight: 300;
  font-size: clamp(1.8rem, 3vw, 3.4rem);
  line-height: 1.14;
  letter-spacing: -0.02em;
  color: var(--accent);
}

.ab-story-flow {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  column-gap: 2.5vw;
  row-gap: 9vh;
  align-items: start;
  max-width: 90rem;
  margin: 0 auto;
}

.ab-story-photo {
  margin: 0;
}

.ab-story-photo img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #15151c;
}

.ab-story-photo figcaption {
  display: flex;
  align-items: baseline;
  gap: 0.9rem;
  margin-top: 1rem;
  font: 500 0.68rem/1 var(--sans);
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--bone);
}

.ab-story-photo figcaption span {
  color: var(--accent);
  opacity: 0.8;
}

.ab-story-photo-main {
  grid-column: 6 / 13;
  grid-row: 1;
  height: min(78vh, 52rem);
  min-height: 32rem;
}

.ab-copy-first {
  grid-column: 1 / 5;
  grid-row: 1;
  align-self: end;
  padding-bottom: 4vh;
}

.ab-story-photo-secondary {
  grid-column: 2 / 6;
  grid-row: 2;
  margin-top: 4vh;
}

.ab-story-photo-secondary img {
  aspect-ratio: 4 / 5;
}

.ab-copy-rest {
  grid-column: 7 / 12;
  grid-row: 2;
  margin-top: 16vh;
}

.ab-p {
  margin: 0 0 1.9em;
  max-width: 32em;
  font-size: clamp(1.05rem, 1.35vw, 1.3rem);
  line-height: 1.85;
  color: var(--bone);
}

/* closing quote */
.ab-quote p {
  max-width: 14em;
}

.ab-quote p+p {
  margin-top: 0.12em;
}

.ab-quote p.is-accent {
  color: var(--accent);
}

.ab-quote .mask {
  padding-bottom: 0.12em;
  margin-bottom: -0.12em;
}

.ab-quote .qw {
  display: inline-block;
}

@media (max-width: 720px) {
  .ab-story {
    padding: 11vh 6vw 12vh;
  }

  .ab-story-head {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1.3rem;
    margin-bottom: 6vh;
  }

  .ab-story-head>.label {
    margin-bottom: 0;
  }

  .ab-title {
    font-size: clamp(4rem, 18vw, 7rem);
  }

  .ab-lead {
    max-width: 17em;
    font-size: clamp(1.7rem, 7vw, 2.6rem);
  }

  .ab-story-flow {
    display: flex;
    flex-direction: column;
    gap: 5vh;
  }

  .ab-story-photo-main {
    width: 88%;
    height: min(72vh, 38rem);
    min-height: 24rem;
    align-self: flex-end;
  }

  .ab-copy-first {
    width: 84%;
    align-self: flex-start;
    padding: 0;
  }

  .ab-story-photo-secondary {
    width: 69%;
    align-self: flex-start;
    margin: 1vh 0 0 8%;
  }

  .ab-copy-rest {
    width: 86%;
    align-self: flex-end;
    margin: 0;
  }

}
</style>