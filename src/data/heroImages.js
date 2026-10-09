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
  'fightNight/Fight4.jpg',
  'fightNight/Fight5.jpg',
  'fightNight/Fight6.jpg',
  'fightNight/Fight7.jpg',
  'fightNight/Fight8.jpg',
]

export const heroImages = imagePaths.map(image)
