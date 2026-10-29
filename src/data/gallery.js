import { stories } from './stories'
import { fullUrl, thumbUrl } from './photos'

// ⚡ OPTIMIZED: URLs are built by ./photos.js (photos are served from the VPS, not bundled).
const photo = (folder, file) => ({ file, url: fullUrl(`${folder}/${file}`) })

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

// ✏️ EDIT HERE: one block per project. cover = wide (G…), tall = tall (D…)
const projects = [
  {
    folder: 'fightNight',
    slug: 'fight-night-6',
    title: 'Fight Night',
    sub: 'NOTO',
    cover: 'Fight1.webp',
    tall: 'Fight2.webp',
    shots: ['Fight3.webp', 'Fight4.webp', 'Fight5.webp', 'Fight6.webp', 'Fight7.webp', 'Fight8.webp'],
  },
  {
    folder: 'portraits/Elena',
    slug: 'deep-red',
    title: 'Elena',
    cover: 'e1.webp',
    tall: 'DE.webp',
    shots: [
      'e2.webp',
      'e3.webp',
      'e4.webp',
      'e5.webp',
      'e6.webp',
      'e7.webp',
      'e8.webp',
      'e9.webp',
      'e10.webp',
    ],
  },
  {
    folder: 'portraits/Elenac',
    slug: 'without-permission',
    title: 'Elenac',
    cover: 'GEC.webp',
    shots: [
      'ec1.webp',
      'ec2.webp',
      'ec3.webp',
      'ec4.webp',
      'ec5.webp',
      'ec6.webp',
      'ec7.webp',
      'ec8.webp',
      'ec9.webp',
    ],
  },
  {
    folder: 'portraits/Godej',
    slug: 'light-between-us',
    title: 'Godej',
    cover: 'GIF.webp',
    shots: [
      'KD-366.webp',
      'KD-370.webp',
      'KD-371.webp',
      'KD-379.webp',
      'KD-381.webp',
      'KD-385.webp',
      'KD-388.webp',
      'KD-395.webp',
    ],
  },
  {
    folder: 'portraits/Ivan i Zdravka',
    slug: 'tide-of-light',
    title: 'Ivan i Zdravka',
    cover: 'GZI.webp',
    tall: 'DZI.webp',
    shots: [
      'zi1.webp',
      'zi2.webp',
      'zi3.webp',
      'zi4.webp',
      'zi5.webp',
      'zi6.webp',
      'zi7.webp',
      'zi8.webp',
      'zi9.webp',
      'zi10.webp',
      'zi11.webp',
      'zi12.webp',
    ],
  },
  {
    folder: 'portraits/cowgirl - Kalina',
    slug: 'golden-west',
    title: 'Kalina',
    cover: 'GK.webp',
    tall: 'DK.webp',
    shots: ['ka1.webp', 'ka2.webp', 'ka3.webp', 'ka4.webp', 'ka5.webp', 'ka6.webp'],
  },
  {
    folder: 'portraits/Valeto',
    slug: 'floor-zero',
    title: 'Valeto',
    cover: 'GV.webp',
    tall: 'DV.webp',
    shots: ['v1.webp', 'v2.webp', 'v3.webp', 'v4.webp', 'v5.webp'],
  },
  {
    folder: 'portraits/Vika',
    slug: 'breath-of-wind',
    title: 'Vika',
    cover: 'GVP.webp',
    tall: 'DVP.webp',
    shots: [
      'vp1.webp',
      'vp2.webp',
      'vp3.webp',
      'vp4.webp',
      'vp5.webp',
      'vp6.webp',
      'vp7.webp',
      'vp8.webp',
      'vp9.webp',
    ],
  },
  {
    folder: 'portraits/Vikaskilim',
    slug: 'inside',
    title: 'Vikaskilim',
    cover: 'GVK.webp',
    tall: 'DVK.webp',
    shots: ['vk1.webp', 'vk2.webp', 'vk3.webp', 'vk4.webp', 'vk5.webp', 'vk6.webp'],
  },
  {
    folder: 'concerts/Ivo Dimchev - Plovdiv, Antichen teatar',
    slug: 'ivo-dimchev-plovdiv',
    cover: 'GID.webp',
    tall: 'DID.webp',
    shots: ['id1.webp', 'id2.webp', 'id3.webp', 'id4.webp'],
  },
  {
    folder: 'concerts/Kerana & Kosmonavtite',
    slug: 'kerana-kosmonavtite',
    cover: 'GK.webp',
    tall: 'DK.webp',
    shots: [
      'k1.webp',
      'k2.webp',
      'k3.webp',
      'k4.webp',
      'k5.webp',
      'k6.webp',
      'k7.webp',
      'k8.webp',
      'k9.webp',
      'k10.webp',
      'k11.webp',
    ],
  },
  {
    folder: 'concerts/NOTO',
    slug: 'noto',
    cover: 'n1.webp',
    tall: 'n2.webp',
    shots: [
      'n2O.webp',
      'n3.webp',
      'n4.webp',
      'n5.webp',
      'n6.webp',
      'n7.webp',
      'n8.webp',
      'n9.webp',
      'n10.webp',
      'n11.webp',
      'n12.webp',
      'n13.webp',
      'n14.webp',
      'n15.webp',
      'n16.webp',
      'n17.webp',
      'n18.webp',
      'n19.webp',
      'n20.webp',
      'n21.webp',
      'n22.webp',
      'n23.webp',
      'n24.webp',
      'n25.webp',
      'n26.webp',
    ],
  },
  {
    folder: 'concerts/Torino & Pashata',
    slug: 'torino-pashata',
    cover: 'GTP.webp',
    tall: 'DTP.webp',
    shots: [
      'tp1.webp',
      'tp2.webp',
      'tp3.webp',
      'tp4.webp',
      'tp5.webp',
      'tp6.webp',
      'tp7.webp',
      'tp8.webp',
      'tp9.webp',
      'tp10.webp',
      'tp11.webp',
      'tp12.webp',
      'tp13.webp',
      'tp14.webp',
      'tp15.webp',
      'tp16.webp',
      'tp17.webp',
    ],
  },
]

// ⚙️ Nothing to edit below
// Tip: to change an album's URL without renaming its folder, add `slug: 'my-custom-name'` to its entry above.
export const collections = projects.map((p) => {
  const parts = p.folder.split('/')
  const type = parts.length > 1 ? parts[0] : 'concerts'
  const name = parts.at(-1)
  const [title, sub = ''] = name.split(' - ')

  const shots = p.shots.map((f) => photo(p.folder, f)).filter(Boolean)
  const cover = p.cover ? photo(p.folder, p.cover) : null
  const tall = p.tall ? photo(p.folder, p.tall) : null

  const story = stories[p.folder]

  return {
    type,
    folder: name,
    title: (story?.title || p.title || title).trim(),
    titleBg: story && story.titleBg !== story.title ? story.titleBg : '',
    text: story?.text ?? [],
    sub: (p.sub ?? sub).trim(),
    // `key` = slug derived from the folder name (stable, used to match work-wheel images).
    // `slug` = what shows in the URL: the optional `slug` field of the project, else the folder-based one.
    key: slugify(name),
    slug: p.slug ? slugify(p.slug) : slugify(name),
    all: [cover, tall, ...shots].filter(Boolean),
    shots,
    cover: (cover || shots[0])?.url,
    // ⚡ OPTIMIZED: the 280×360 hover preview on /work only needs the small WebP, not the 1920px one
    coverThumb: thumbUrl(`${p.folder}/${(cover || shots[0])?.file}`),
    tall: (tall || cover || shots[0])?.url,
  }
})

export const byType = (t) => collections.filter((c) => c.type === t)
export const find = (type, slug) => collections.find((c) => c.type === type && c.slug === slug)
