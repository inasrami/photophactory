export { collections } from '@/data/gallery'

import { thumbUrl } from './photos'

// ⚡ OPTIMIZED: the wheel downsizes every texture to ~800px tall anyway (see targetH in workwheel.vue),
// so it fetches the 960px thumbnails instead of the full-size photos.
const image = (path) => {
  const src = thumbUrl(path)
  if (!src) throw new Error(`Work wheel image not found: ${path}`)
  return src
}

// Edit these paths to choose the photos shown for each Work page project.
const imagePaths = {
  'cowgirl-kalina': ['portraits/cowgirl - Kalina/GK.webp'],
  borislava: ['portraits/Borislava/b3.webp', 'portraits/Borislava/b2.webp'],
  elena: ['portraits/Elena/e1.webp', 'portraits/Elena/e2.webp'],
  elenac: ['portraits/Elenac/ec3.webp', 'portraits/Elenac/ec4.webp'],
  valeto: ['portraits/Valeto/v2.webp', 'portraits/Valeto/v3.webp'],
  vika: ['portraits/Vika/vp2.webp', 'portraits/Vika/vp6.webp'],
  vikaskilim: ['portraits/Vikaskilim/vk1.webp', 'portraits/Vikaskilim/vk3.webp'],
}

export const workWheelImages = Object.fromEntries(
  Object.entries(imagePaths).map(([slug, paths]) => [slug, paths.map(image)]),
)
