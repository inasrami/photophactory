// Serve resized, compressed copies; keep the originals in place for archival quality.
const files = import.meta.glob('/src/images/optimized/{portraits, concerts}/**/*.jpg', {
  eager: true,
  query: '?url',
  import: 'default',
})
const nat = (a, b) => a.file.localeCompare(b.file, undefined, { numeric: true })
const map = {}
for (const [p, url] of Object.entries(files)) {
  const [, , , , type, folder, file] = p.split('/')
  const key = type + '/' + folder
  const [title, sub = ''] = folder.split(' - ')
  ;(map[key] ??= {
    type,
    folder,
    title: title.trim(),
    sub: sub.trim(),
    slug: folder
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, ''),
    all: [],
  }).all.push({ file, url })
}
export const collections = Object.values(map).map((c) => {
  const isCover = (f) => /^[GD][A-Z]+\.\w+$/.test(f.file) // GXX = wide cover, DXX = tall cover
  const all = c.all.sort(nat)
  const shots = all.filter((f) => !isCover(f))
  const wide = all.find((f) => f.file.startsWith('G') && isCover(f))
  const tall = all.find((f) => f.file.startsWith('D') && isCover(f))
  return { ...c, shots, cover: (wide || shots[0])?.url, tall: (tall || wide || shots[0])?.url }
})
export const byType = (t) => collections.filter((c) => c.type === t)
export const find = (type, slug) => collections.find((c) => c.type === type && c.slug === slug)
