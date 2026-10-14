const files = import.meta.glob('/src/images/optimized/**/*.jpg', {
  eager: true,
  query: '?url',
  import: 'default',
})

const image = (path) => {
  const src = files[`/src/images/optimized/${path}`]
  if (!src) throw new Error(`Hero image not found: ${path}`)
  return { src, alt: path.split('/').at(-1) }
}

// Edit these paths to choose the photos shown in the hero.
const imagePaths = [
  'fightNight/Fight3.jpg',
  'concerts/Ivo Dimchev - Plovdiv, Antichen teatar/DID.jpg',
  'fightNight/Fight4.jpg',
  'concerts/Ivo Dimchev - Plovdiv, Antichen teatar/GID.jpg',
  'concerts/Kerana & Kosmonavtite/DK.jpg',
  'concerts/Torino & Pashata/tp1.jpg',
  'concerts/NOTO/n6.jpg',
]

export const heroImages = imagePaths.map(image)
