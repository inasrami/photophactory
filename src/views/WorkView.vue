<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { gsap, ScrollTrigger } from '@/lib/gsap'
import { lenis, auto } from '@/lib/lenis'
import Workwheel from '@/components/workwheel.vue'
import { collections } from '@/data/gallery'
import bg from '@/images/fon.jpg'
const router = useRouter()
const items = collections.map((c) => ({ title: c.title, src: c.tall, aspect: 3 / 4 }))
const pad = (n) => String(n).padStart(2, '0')
const root = ref(null)
let idx = 0, timer, ctx
// each wheel panel = one folder. Opening a panel takes you into that folder.
const onActive = (i) => { idx = i }
const onFocus = (open) => {
    clearTimeout(timer)
    if (open) { const c = collections[idx]; timer = setTimeout(() => router.push(`/${c.type}/${c.slug}`), 800) }
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
        <section class="w-wheel" data-lenis-prevent-wheel>
            <Workwheel :items="items" :backgroundImage="bg" @activeChange="onActive" @focusChange="onFocus" />
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