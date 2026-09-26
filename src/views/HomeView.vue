<script setup>
import HeroSection from '@/components/HeroSection.vue'
import Workwheel from '@/components/workwheel.vue'

import deImg from '@/images/portraits/Borislava/b3.jpg'
import e1 from '@/images/portraits/Elena/e3.jpg'
import e2 from '@/images/portraits/Elena/e5.jpg'
import e3 from '@/images/portraits/Elenac/ec2.jpg'
import e4 from '@/images/portraits/Valeto/v2.jpg'
import e5 from '@/images/portraits/Vika/vp7.jpg'
import e8 from '@/images/portraits/Vika/vp8.jpg'
import e9 from '@/images/portraits/Vikaskilim/vk1.jpg'
import e10 from '@/images/portraits/Vikaskilim/vk4.jpg'

// Changed "image:" to "src:"
const WORKS = [
  { title: 'Denim Editorial', src: deImg },
  { title: 'Study I', src: e1 },
  { title: 'Study II', src: e2 },
  { title: 'Study III', src: e3 },
  { title: 'Study IV', src: e4 },
  { title: 'Study V', src: e5 },
  { title: 'Study VI', src: e8 },
  { title: 'Study VII', src: e9 },
  { title: 'Study VIII', src: e10 },
]
</script>

<template>
  <main>
    <HeroSection />
    <div id="works" class="h-screen w-full">
      <Workwheel :items="WORKS" />
    </div>
  </main>
</template>