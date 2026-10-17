<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from '@/lib/gsap'
const root = ref(null)
let ctx
onMounted(() => {
    ctx = gsap.context(() => {
        // ⚡ OPTIMIZED: the 3 endless "orb" drift tweens (random x/y, 14-22s yoyo, repeatRefresh) were driven by
        // GSAP's JS ticker every frame. They are now plain CSS keyframe animations (see .o1/.o2/.o3 in
        // luxury.css) which run on the compositor thread, so the main thread only handles the two scroll-scrubs.
        gsap.to('.orbs', { yPercent: -22, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 1.5 } })
        gsap.to('.bk-dial', { rotation: 140, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 1 } })
    }, root.value)
})
onBeforeUnmount(() => ctx?.revert())
</script>
<template>
    <div ref="root" class="bk" aria-hidden="true">
        <div class="orbs"><i class="orb o1" /><i class="orb o2" /><i class="orb o3" /></div>
        <div class="bk-dial" />
        <div class="bk-grid" />
        <div class="bk-vig" />
    </div>
</template>
