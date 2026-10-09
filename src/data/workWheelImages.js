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
  fightnight: ['fightNight/Fight1.jpg', 'fightNight/Fight2.jpg'],
  borislava: ['portraits/Borislava/GB.jpg'],
  elena: ['portraits/Elena/DE.jpg'],
  elenac: ['portraits/Elenac/GEC.jpg'],
  godej: ['portraits/Godej/GIF.jpg'],
  'ivan-i-zdravka': ['portraits/Ivan i Zdravka/GZI.jpg'],
  'cowgirl-kalina': ['portraits/cowgirl - Kalina/DK.jpg'],
  valeto: ['portraits/Valeto/DV.jpg'],
  vika: ['portraits/Vika/GVP.jpg'],
  vikaskilim: ['portraits/Vikaskilim/DVK.jpg'],
  'ivo-dimchev-plovdiv-antichen-teatar': [
    'concerts/Ivo Dimchev - Plovdiv, Antichen teatar/GID.jpg',
  ],
  'kerana-kosmonavtite': ['concerts/Kerana & Kosmonavtite/GK.jpg'],
  noto: ['concerts/NOTO/n1.jpg'],
  'torino-pashata': ['concerts/Torino & Pashata/GTP.jpg'],
}

export const workWheelImages = Object.fromEntries(
  Object.entries(imagePaths).map(([slug, paths]) => [slug, paths.map(image)]),
)
