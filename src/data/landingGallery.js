const files = import.meta.glob('/src/images/optimized/**/*.jpg', {
  eager: true,
  query: '?url',
  import: 'default',
})

const image = (path) => {
  const src = files[`/src/images/optimized/${path}`]
  if (!src) throw new Error(`Landing gallery image not found: ${path}`)
  return src
}

// Edit these paths and links to change the landing gallery photos.
const imagePaths = [
  [
    { path: 'portraits/Elena/e1.jpg', alt: 'Elena', to: '/portraits/elena' },
    { path: 'portraits/Vikaskilim/vk6.jpg', alt: 'Vikaskilim', to: '/portraits/vikaskilim' },
    { path: 'portraits/Elena/e10.jpg', alt: 'Elena', to: '/portraits/elena' },
    { path: 'portraits/Vikaskilim/vk4.jpg', alt: 'Vikaskilim', to: '/portraits/vikaskilim' },
    { path: 'portraits/Elena/e7.jpg', alt: 'Elena', to: '/portraits/elena' },
    { path: 'portraits/Vikaskilim/vk2.jpg', alt: 'Vikaskilim', to: '/portraits/vikaskilim' },
  ],
  [
    { path: 'portraits/Borislava/b3.jpg', alt: 'Borislava' },
    { path: 'portraits/cowgirl - Kalina/ka4.jpg', alt: 'Kalina' },
    { path: 'portraits/Elenac/ec3.jpg', alt: 'Eleneac' },
    { path: 'portraits/Godej/KD-385.jpg', alt: 'Godej' },
    { path: 'portraits/Ivan i Zdravka/zi1.jpg', alt: 'Ivan i Zdravka' },
    { path: 'portraits/Vika/vp4.jpg', alt: 'Vika' },
  ],
  [
    { path: 'portraits/Vikaskilim/vk1.jpg', alt: 'Vikaskilim', to: '/portraits/vikaskilim' },
    { path: 'portraits/Elena/e7.jpg', alt: 'Elena', to: '/portraits/elena' },
    { path: 'portraits/Vikaskilim/vk4.jpg', alt: 'Vikaskilim', to: '/portraits/vikaskilim' },
    { path: 'portraits/Vikaskilim/vk1.jpg', alt: 'Vikaskilim', to: '/portraits/vikaskilim' },
    { path: 'portraits/Elena/e10.jpg', alt: 'Elena', to: '/portraits/elena' },
    { path: 'portraits/Elena/e4.jpg', alt: 'Elena', to: '/portraits/elena' },
  ],
]

export const galleryColumns = imagePaths.map((column) =>
  column.map(({ path, ...item }) => ({ ...item, src: image(path) })),
)
