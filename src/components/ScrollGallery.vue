<!-- src/components/ScrollGallery.vue -->
<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { gsap } from '@/lib/gsap'

// columns: [[{ src, alt, to }, ...], ...]
defineProps({ columns: { type: Array, required: true } })

const root = ref(null)
const translateEl = ref(null)
const insetEl = ref(null)
const scaleEl = ref(null)
const colEls = ref([])
const colSpeeds = [-10, 20, -10]
let ctx

onMounted(() => {
    ctx = gsap.context(() => {
        // ⚡ OPTIMIZED: was 3 + one-per-column separate ScrollTriggers (each with its own scrub + listener) all sharing the
        // same trigger/range. One timeline = ONE ScrollTrigger driving every tween at position 0 -> identical motion.
        const tl = gsap.timeline({
            defaults: { ease: 'none', duration: 1 },
            scrollTrigger: { trigger: root.value, start: 'top bottom', end: 'bottom top', scrub: true },
        })
        tl.fromTo(translateEl.value, { y: 0 }, { y: 384 }, 0)
            .fromTo(insetEl.value, { clipPath: 'inset(0px 48px)' }, { clipPath: 'inset(0px 0px)' }, 0)
            .fromTo(scaleEl.value, { scale: 1.2 }, { scale: 1 }, 0)
        colEls.value.forEach((el, i) => {
            if (el) tl.fromTo(el, { yPercent: 0 }, { yPercent: colSpeeds[i] ?? 0 }, 0)
        })
    }, root.value)
})
onBeforeUnmount(() => ctx?.revert())
</script>

<template>
    <div ref="root" class="sg">
        <div ref="translateEl" class="sg__translate">
            <div ref="insetEl" class="sg__inset">
                <div ref="scaleEl" class="sg__scale">
                    <div v-for="(col, i) in columns" :key="i" :ref="(el) => (colEls[i] = el)" class="sg__col"
                        :class="{ 'sg__col--offset': i === 1, 'sg__col--desktop': i === 2 }">
                        <RouterLink v-for="(img, j) in col" :key="j" :to="img.to" class="sg__item" data-cursor="Enter">
                            <img :src="img.src" :alt="img.alt" loading="lazy" decoding="async" />
                        </RouterLink>
                    </div>
                </div>
            </div>
        </div>
        <div class="sg__fade" aria-hidden="true" />
        <div class="sg__spacer" />
    </div>
</template>

<style scoped>
.sg {
    position: relative;
    overflow: hidden;
    background: #000;
}

.sg__fade {
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    background:
        linear-gradient(to right, #000 0%, transparent 12%, transparent 88%, #000 100%),
        linear-gradient(to bottom, #000 0%, transparent 22%);
}

.sg__translate {
    position: relative;
    height: 100%;
}

.sg__inset {
    position: relative;
    height: 100%;
}

.sg__scale {
    will-change: transform; /* ⚡ OPTIMIZED: scaled every scroll frame -> promote to its own layer */
    display: flex;
    gap: 0.5rem;
    padding: 0 1.5rem;
    overflow: hidden;
}

.sg__col {
    will-change: transform; /* ⚡ OPTIMIZED: parallax columns move every scroll frame */
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex: 1;
}

.sg__col--offset {
    margin-top: -20%;
}

.sg__col--desktop {
    display: none;
}

.sg__item {
    display: block;
}

.sg__item img {
    width: 100%;
    aspect-ratio: 4 / 2.5;
    object-fit: cover;
    display: block;
}

.sg__spacer {
    height: 24rem;
}

@media (min-width: 768px) {
    .sg__col--desktop {
        display: flex;
    }
}
</style>