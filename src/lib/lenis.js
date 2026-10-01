import Lenis from 'lenis'
import { gsap, ScrollTrigger } from './gsap'
export const lenis = new Lenis({
  duration: 1.25,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
})
lenis.on('scroll', ScrollTrigger.update)
gsap.ticker.add((t) => lenis.raf(t * 1000))
gsap.ticker.lagSmoothing(0)

// Programmatic scrolls (nav links, back-to-top, route changes) set this so the wheel-section magnet doesn't hijack them.
export const auto = { on: false }
const orig = lenis.scrollTo.bind(lenis)
let tm
lenis.scrollTo = (t, o = {}) => {
  auto.on = true
  clearTimeout(tm)
  tm = setTimeout(() => (auto.on = false), (o.duration ?? 1.2) * 1000 + 300)
  return orig(t, o)
}
