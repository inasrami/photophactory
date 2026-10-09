<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { gsap, ScrollTrigger } from '@/lib/gsap'
import { lenis, auto } from '@/lib/lenis'
import Workwheel from '@/components/workwheel.vue'
import { collections, workWheelImages } from '@/data/workWheelImages'

const router = useRouter()
const items = collections.flatMap((collection) => {
    const images = workWheelImages[collection.slug] ?? []
    if (images.length === 0) console.warn('Work wheel images not configured:', collection.slug)
    return images.map((src) => ({
        title: collection.title,
        src,
        aspect: 3 / 4,
        collection,
    }))
})
const pad = (n) => String(n).padStart(2, '0')
const root = ref(null)
let idx = 0, timer, ctx
// each wheel panel = one folder. Opening a panel takes you into that folder.
const onActive = (i) => { idx = i }
const onFocus = (open) => {
    clearTimeout(timer)
    if (open) {
        const collection = items[idx]?.collection
        if (collection) timer = setTimeout(() => router.push(`/${collection.type}/${collection.slug}`), 800)
    }
}
onMounted(() => {
    ctx = gsap.context(() => {
        // magnet: coming back up from the list snaps the wheel fully into view
        const sec = root.value.querySelector('.w-wheel')
        let snapping = false
        ScrollTrigger.create({
            trigger: sec, start: 'top 85%', end: 'bottom 15%', onEnterBack: () => {
                if (snapping || auto.on) return
                snapping = true; lenis.stop()
                lenis.scrollTo(sec, { duration: 1.1, force: true, easing: (t) => 1 - Math.pow(1 - t, 4), onComplete: () => setTimeout(() => { lenis.start(); snapping = false }, 450) })
            }
        })
        gsap.from('.w-t .ch', { yPercent: 115, duration: 1.4, stagger: 0.05, ease: 'expo.out', scrollTrigger: { trigger: '.w-index', start: 'top 70%' } })
        gsap.utils.toArray('.w-row').forEach((r) => gsap.from(r.children, { yPercent: 110, opacity: 0, duration: 1.1, stagger: 0.06, ease: 'expo.out', scrollTrigger: { trigger: r, start: 'top 92%' } }))
    }, root.value)
})
onBeforeUnmount(() => { clearTimeout(timer); lenis.start(); ctx?.revert() })
</script>
<template>
    <main ref="root" class="work">
        <FlutedGlassBackground fixed />

        <section class="w-wheel" data-lenis-prevent-wheel>
            <Workwheel :items="items" @activeChange="onActive" @focusChange="onFocus" />
        </section>
        <section class="w-index">
            <header class="w-head">
                <h2 class="w-t" aria-label="Index"><span v-for="(c, i) in 'Index'.split('')" :key="i" class="mask"><span
                            class="ch">{{ c }}</span></span></h2>
                <p class="label w-meta">{{ pad(collections.length) }} stories</p>
            </header>
            <div class="w-list">
                <RouterLink v-for="c in collections" :key="c.slug" :to="`/${c.type}/${c.slug}`" class="row w-row">
                    <h3>{{ c.title }}</h3><span class="sub">{{ c.type }}{{ c.sub ? ' · ' + c.sub : '' }}</span><span
                        class="cnt">{{ pad(c.shots.length) }}</span>
                </RouterLink>
            </div>
        </section>
    </main>
</template>
