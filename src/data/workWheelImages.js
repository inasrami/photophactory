export { collections } from '@/data/gallery'

const files = import.meta.glob('/src/images/optimized/**/*.jpg', {
  eager: true,
  query: '?url',
  import: 'default',
})

const image = (path) => {
  const src = files[`/src/images/optimized/${path}`]
  if (!src) throw new Error(`Work wheel image not found: ${path}`)
  return src
}

// Edit these paths to choose the photos shown for each Work page project.
const imagePaths = {
  'cowgirl-kalina': ['portraits/cowgirl - Kalina/GK.jpg'],
  borislava: ['portraits/Borislava/b3.jpg', 'portraits/Borislava/b2.jpg'],
  elena: ['portraits/Elena/e1.jpg', 'portraits/Elena/e2.jpg'],
  elenac: ['portraits/Elenac/ec3.jpg', 'portraits/Elenac/ec4.jpg'],
  valeto: ['portraits/Valeto/v2.jpg', 'portraits/Valeto/v3.jpg'],
  vika: ['portraits/Vika/vp2.jpg', 'portraits/Vika/vp6.jpg'],
  vikaskilim: ['portraits/Vikaskilim/vk1.jpg', 'portraits/Vikaskilim/vk3.jpg'],
}

export const workWheelImages = Object.fromEntries(
  Object.entries(imagePaths).map(([slug, paths]) => [slug, paths.map(image)]),
)
