<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from '@/lib/gsap'
const root = ref(null)
let ctx
onMounted(() => {
    ctx = gsap.context(() => {
        gsap.utils.toArray('.orb').forEach((o) =>
            gsap.to(o, { x: () => gsap.utils.random(-15, 15) + 'vw', y: () => gsap.utils.random(-12, 12) + 'vh', duration: gsap.utils.random(14, 22), ease: 'sine.inOut', repeat: -1, yoyo: true, repeatRefresh: true }))
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