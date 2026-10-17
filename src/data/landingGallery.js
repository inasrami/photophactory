import { thumbUrl } from './photos'

// ⚡ OPTIMIZED: landing gallery tiles are ~1/3 of the viewport wide -> 960px WebP thumbnails are plenty.
const image = (path) => {
  const src = thumbUrl(path)
  if (!src) throw new Error(`Landing gallery image not found: ${path}`)
  return src
}

// Edit these paths and links to change the landing gallery photos.
const imagePaths = [
  [
    { path: 'portraits/Elena/e1.webp', alt: 'Elena', to: '/portraits/elena' },
    { path: 'portraits/Vikaskilim/vk6.webp', alt: 'Vikaskilim', to: '/portraits/vikaskilim' },
    { path: 'portraits/Elena/e10.webp', alt: 'Elena', to: '/portraits/elena' },
    { path: 'portraits/Vikaskilim/vk4.webp', alt: 'Vikaskilim', to: '/portraits/vikaskilim' },
    { path: 'portraits/Elena/e7.webp', alt: 'Elena', to: '/portraits/elena' },
    { path: 'portraits/Vikaskilim/vk2.webp', alt: 'Vikaskilim', to: '/portraits/vikaskilim' },
  ],
  [
    { path: 'portraits/Borislava/b3.webp', alt: 'Borislava', to: '/portraits/borislava' },
    { path: 'portraits/cowgirl - Kalina/ka4.webp', alt: 'Kalina', to: '/portraits/cowgirl-kalina' },
    { path: 'portraits/Elenac/ec3.webp', alt: 'Elenac', to: '/portraits/elenac' },
    { path: 'portraits/Godej/KD-385.webp', alt: 'Godej', to: '/portraits/godej' },
    {
      path: 'portraits/Ivan i Zdravka/zi1.webp',
      alt: 'Ivan i Zdravka',
      to: '/portraits/ivan-i-zdravka',
    },
    { path: 'portraits/Vika/vp4.webp', alt: 'Vika', to: '/portraits/vika' },
  ],
  [
    { path: 'portraits/Vikaskilim/vk1.webp', alt: 'Vikaskilim', to: '/portraits/vikaskilim' },
    { path: 'portraits/Elena/e7.webp', alt: 'Elena', to: '/portraits/elena' },
    { path: 'portraits/Vikaskilim/vk4.webp', alt: 'Vikaskilim', to: '/portraits/vikaskilim' },
    { path: 'portraits/Vikaskilim/vk1.webp', alt: 'Vikaskilim', to: '/portraits/vikaskilim' },
    { path: 'portraits/Elena/e10.webp', alt: 'Elena', to: '/portraits/elena' },
    { path: 'portraits/Elena/e4.webp', alt: 'Elena', to: '/portraits/elena' },
  ],
]

export const galleryColumns = imagePaths.map((column) =>
  column.map(({ path, ...item }) => ({ ...item, src: image(path) })),
)
