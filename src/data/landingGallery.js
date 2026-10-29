import { thumbUrl } from './photos'
import { collections } from './gallery'

// ⚡ OPTIMIZED: landing gallery tiles are ~1/3 of the viewport wide -> 960px WebP thumbnails are plenty.
const image = (path) => {
  const src = thumbUrl(path)
  if (!src) throw new Error(`Landing gallery image not found: ${path}`)
  return src
}

// Edit these paths and links to change the landing gallery photos.
const imagePaths = [
  [
    { path: 'portraits/Elena/e1.webp', alt: 'Elena' },
    { path: 'portraits/Vikaskilim/vk6.webp', alt: 'Vikaskilim' },
    { path: 'portraits/Elena/e10.webp', alt: 'Elena' },
    { path: 'portraits/Vikaskilim/vk4.webp', alt: 'Vikaskilim' },
    { path: 'portraits/Elena/e7.webp', alt: 'Elena' },
    { path: 'portraits/Vikaskilim/vk2.webp', alt: 'Vikaskilim' },
  ],
  [
    { path: 'portraits/cowgirl - Kalina/ka4.webp', alt: 'Kalina' },
    { path: 'portraits/Elenac/ec3.webp', alt: 'Elenac' },
    { path: 'portraits/Godej/KD-385.webp', alt: 'Godej' },
    {
      path: 'portraits/Ivan i Zdravka/zi1.webp',
      alt: 'Ivan i Zdravka',
    },
    { path: 'portraits/Vika/vp4.webp', alt: 'Vika' },
  ],
  [
    { path: 'portraits/Vikaskilim/vk1.webp', alt: 'Vikaskilim' },
    { path: 'portraits/Elena/e7.webp', alt: 'Elena' },
    { path: 'portraits/Vikaskilim/vk4.webp', alt: 'Vikaskilim' },
    { path: 'portraits/Vikaskilim/vk1.webp', alt: 'Vikaskilim' },
    { path: 'portraits/Elena/e10.webp', alt: 'Elena' },
    { path: 'portraits/Elena/e4.webp', alt: 'Elena' },
  ],
]

// The link is resolved from the photo's folder, so it always follows the album's current slug.
const linkFor = (path) => {
  const parts = path.split('/').slice(0, -1)
  const type = parts.length > 1 ? parts[0] : 'concerts'
  const folder = parts.at(-1)
  const c = collections.find((x) => x.type === type && x.folder === folder)
  return c ? `/${c.type}/${c.slug}` : '/work'
}

export const galleryColumns = imagePaths.map((column) =>
  column.map(({ path, ...item }) => ({ ...item, src: image(path), to: item.to ?? linkFor(path) })),
)
