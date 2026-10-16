<script setup>
import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { gsap, ScrollTrigger } from '@/lib/gsap'
import Workwheel from '@/components/workwheel.vue'
import FlutedGlassBackground from '@/components/Flutedglassbackground.vue'
import { collections, workWheelImages } from '@/data/workWheelImages'

const router = useRouter()

// Build items once outside reactive overhead
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

const root = shallowRef(null)
const preview = shallowRef(null)
const previewImage = ref(collections[0]?.cover ?? '')
const previewVisible = ref(false)

let idx = 0
let focusTimer = 0
let previewRaf = 0
let ctx = null
let isNavigating = false

// Cache preview and viewport dimensions to avoid synchronous reflows on mousemove
let previewW = 280
let previewH = 360
let vpW = typeof window !== 'undefined' ? window.innerWidth : 1920
let vpH = typeof window !== 'undefined' ? window.innerHeight : 1080
let pointerX = 0
let pointerY = 0
let canHover = false

const updateMetrics = () => {
    vpW = window.innerWidth
    vpH = window.innerHeight
    canHover = window.matchMedia('(hover: hover)').matches
    if (preview.value && preview.value.offsetWidth > 0) {
        previewW = preview.value.offsetWidth
        previewH = preview.value.offsetHeight
    }
}

const applyPreviewPosition = () => {
    previewRaf = 0
    const el = preview.value
    if (!el) return
    let x = pointerX + 24
    if (x + previewW > vpW - 12) x = pointerX - previewW - 24
    const y = Math.max(12, Math.min(pointerY + 20, vpH - previewH - 12))
    const scale = previewVisible.value ? 1 : 0.9
    el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`
}

const schedulePreviewPosition = (event) => {
    pointerX = event.clientX
    pointerY = event.clientY
    if (!previewRaf) {
        previewRaf = requestAnimationFrame(applyPreviewPosition)
    }
}

const onPreviewLoad = () => {
    if (preview.value && preview.value.offsetWidth > 0) {
        previewW = preview.value.offsetWidth
        previewH = preview.value.offsetHeight
    }
}

const showAlbumPreview = (event, image) => {
    if (!canHover || isNavigating) return
    if (previewImage.value !== image) {
        previewImage.value = image
    }
    previewVisible.value = true
    schedulePreviewPosition(event)
}

const moveAlbumPreview = (event) => {
    if (!previewVisible.value || isNavigating) return
    schedulePreviewPosition(event)
}

const hideAlbumPreview = () => {
    if (!previewVisible.value) return
    previewVisible.value = false
    if (!previewRaf) {
        previewRaf = requestAnimationFrame(applyPreviewPosition)
    }
}

const onActive = (i) => {
    idx = i
}

const onFocus = (open) => {
    clearTimeout(focusTimer)
    if (open && !isNavigating) {
        const collection = items[idx]?.collection
        if (collection) {
            const targetPath = `/${collection.type}/${collection.slug}`
            focusTimer = window.setTimeout(() => {
                isNavigating = true
                router.push(targetPath)
            }, 800)
        }
    }
}

onMounted(() => {
    updateMetrics()
    window.addEventListener('resize', updateMetrics, { passive: true })

    ctx = gsap.context(() => {
        gsap.from('.w-t .ch', {
            yPercent: 115,
            duration: 1.4,
            stagger: 0.05,
            ease: 'expo.out',
            scrollTrigger: { trigger: '.w-index', start: 'top 70%', once: true },
        })

        // Batch row triggers instead of creating heavy individual ScrollTrigger instances per row
        const rows = gsap.utils.toArray('.w-row')
        rows.forEach((r) => gsap.set(r.children, { yPercent: 110, opacity: 0 }))

        ScrollTrigger.batch(rows, {
            start: 'top 92%',
            once: true,
            onEnter: (batch) => {
                batch.forEach((r, i) => {
                    gsap.to(r.children, {
                        yPercent: 0,
                        opacity: 1,
                        duration: 1.1,
                        stagger: 0.06,
                        delay: i * 0.04,
                        ease: 'expo.out',
                        overwrite: true,
                    })
                })
            },
        })
    }, root.value)
})

onBeforeUnmount(() => {
    isNavigating = true
    clearTimeout(focusTimer)
    if (previewRaf) cancelAnimationFrame(previewRaf)
    window.removeEventListener('resize', updateMetrics)
    // CRITICAL: Use kill() instead of revert() on unmount so GSAP doesn't
    // synchronously recalculate layout and write inline styles to DOM nodes being destroyed
    ctx?.kill()
})
</script>

<template>
    <main ref="root" class="work">
        <FlutedGlassBackground fixed />

        <section class="w-wheel">
            <Workwheel :items="items" @activeChange="onActive" @focusChange="onFocus" />
        </section>

        <section class="w-index">
            <header class="w-head">
                <h2 class="w-t" aria-label="Stories">
                    <span v-for="(c, i) in 'Stories'" :key="i" class="mask">
                        <span class="ch">{{ c }}</span>
                    </span>
                </h2>
                <p class="label w-meta">{{ pad(collections.length) }} stories</p>
            </header>
            <div class="w-list">
                <RouterLink v-for="c in collections" :key="c.slug" :to="`/${c.type}/${c.slug}`" class="row w-row"
                    @mouseenter="showAlbumPreview($event, c.cover)" @mousemove="moveAlbumPreview"
                    @mouseleave="hideAlbumPreview">
                    <h3>{{ c.title }}</h3>
                    <span class="sub">{{ c.type }}{{ c.sub ? ' · ' + c.sub : '' }}</span>
                    <span class="cnt">{{ pad(c.shots.length) }}</span>
                </RouterLink>
            </div>
        </section>

        <img ref="preview" :src="previewImage" decoding="async" loading="lazy" class="preview" @load="onPreviewLoad"
            :style="{
                left: '0px',
                top: '0px',
                opacity: previewVisible ? 1 : 0,
                willChange: 'transform, opacity',
                pointerEvents: 'none',
            }" alt="" aria-hidden="true" />
    </main>
</template>