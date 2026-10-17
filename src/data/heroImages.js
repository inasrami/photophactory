import { thumbUrl } from './photos'

// ⚡ OPTIMIZED: hero cards are ~350px wide on screen, so they use the 960px thumbnails (≈40KB each)
// instead of the old 2200px JPGs (≈0.5–1.8MB each).
const image = (path) => {
  const src = thumbUrl(path)
  if (!src) throw new Error(`Hero image not found: ${path}`)
  return { src, alt: path.split('/').at(-1) }
}

// Edit these paths to choose the photos shown in the hero.
const imagePaths = [
  'fightNight/Fight3.webp',
  'concerts/Ivo Dimchev - Plovdiv, Antichen teatar/DID.webp',
  'fightNight/Fight4.webp',
  'concerts/Ivo Dimchev - Plovdiv, Antichen teatar/GID.webp',
  'concerts/Kerana & Kosmonavtite/DK.webp',
  'concerts/Torino & Pashata/tp1.webp',
  'concerts/NOTO/n6.webp',
]

export const heroImages = imagePaths.map(image)
