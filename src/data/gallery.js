const files = import.meta.glob('/src/images/optimized/**/*.jpg', {
  eager: true,
  query: '?url',
  import: 'default',
})

// Finds one photo by folder + file name. Warns in the console if it doesn't exist.
const photo = (folder, file) => {
  const url = files[`/src/images/optimized/${folder}/${file}`]
  if (!url) console.warn('Photo not found:', `${folder}/${file}`)
  return url ? { file, url } : null
}

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

// ✏️ EDIT HERE: one block per project. cover = wide (G…), tall = tall (D…)
const projects = [
  {
    folder: 'fightNight',
    title: 'Fight Night',
    cover: 'Fight1.jpg',
    tall: 'Fight2.jpg',
    shots: ['Fight3.jpg', 'Fight4.jpg', 'Fight5.jpg', 'Fight6.jpg', 'Fight7.jpg', 'Fight8.jpg'],
  },
  {
    folder: 'portraits/Borislava',
    title: 'Borislava',
    cover: 'GB.jpg',
    shots: ['b1.jpg', 'b2.jpg', 'b3.jpg'],
  },
  {
    folder: 'portraits/Elena',
    title: 'Elena',
    cover: 'e1.jpg',
    tall: 'DE.jpg',
    shots: [
      'e2.jpg',
      'e3.jpg',
      'e4.jpg',
      'e5.jpg',
      'e6.jpg',
      'e7.jpg',
      'e8.jpg',
      'e9.jpg',
      'e10.jpg',
    ],
  },
  {
    folder: 'portraits/Elenac',
    title: 'Elenac',
    cover: 'GEC.jpg',
    shots: [
      'ec1.jpg',
      'ec2.jpg',
      'ec3.jpg',
      'ec4.jpg',
      'ec5.jpg',
      'ec6.jpg',
      'ec7.jpg',
      'ec8.jpg',
      'ec9.jpg',
    ],
  },
  {
    folder: 'portraits/Godej',
    title: 'Godej',
    cover: 'GIF.jpg',
    shots: [
      'KD-366.jpg',
      'KD-370.jpg',
      'KD-371.jpg',
      'KD-379.jpg',
      'KD-381.jpg',
      'KD-385.jpg',
      'KD-388.jpg',
      'KD-395.jpg',
    ],
  },
  {
    folder: 'portraits/Ivan i Zdravka',
    title: 'Ivan i Zdravka',
    cover: 'GZI.jpg',
    tall: 'DZI.jpg',
    shots: [
      'zi1.jpg',
      'zi2.jpg',
      'zi3.jpg',
      'zi4.jpg',
      'zi5.jpg',
      'zi6.jpg',
      'zi7.jpg',
      'zi8.jpg',
      'zi9.jpg',
      'zi10.jpg',
      'zi11.jpg',
      'zi12.jpg',
    ],
  },
  {
    folder: 'portraits/cowgirl - Kalina',
    title: 'Kalina',
    cover: 'GK.jpg',
    tall: 'DK.jpg',
    shots: ['ka1.jpg', 'ka2.jpg', 'ka3.jpg', 'ka4.jpg', 'ka5.jpg', 'ka6.jpg'],
  },
  {
    folder: 'portraits/Valeto',
    title: 'Valeto',
    cover: 'GV.jpg',
    tall: 'DV.jpg',
    shots: ['v1.jpg', 'v2.jpg', 'v3.jpg', 'v4.jpg', 'v5.jpg'],
  },
  {
    folder: 'portraits/Vika',
    title: 'Vika',
    cover: 'GVP.jpg',
    tall: 'DVP.jpg',
    shots: [
      'vp1.jpg',
      'vp2.jpg',
      'vp3.jpg',
      'vp4.jpg',
      'vp5.jpg',
      'vp6.jpg',
      'vp7.jpg',
      'vp8.jpg',
      'vp9.jpg',
    ],
  },
  {
    folder: 'portraits/Vikaskilim',
    title: 'Vikaskilim',
    cover: 'GVK.jpg',
    tall: 'DVK.jpg',
    shots: ['vk1.jpg', 'vk2.jpg', 'vk3.jpg', 'vk4.jpg', 'vk5.jpg', 'vk6.jpg'],
  },
  {
    folder: 'concerts/Ivo Dimchev - Plovdiv, Antichen teatar',
    cover: 'GID.jpg',
    tall: 'DID.jpg',
    shots: ['id1.jpg', 'id2.jpg', 'id3.jpg', 'id4.jpg'],
  },
  {
    folder: 'concerts/Kerana & Kosmonavtite',
    cover: 'GK.jpg',
    tall: 'DK.jpg',
    shots: [
      'k1.jpg',
      'k2.jpg',
      'k3.jpg',
      'k4.jpg',
      'k5.jpg',
      'k6.jpg',
      'k7.jpg',
      'k8.jpg',
      'k9.jpg',
      'k10.jpg',
      'k11.jpg',
    ],
  },
  {
    folder: 'concerts/NOTO',
    cover: 'n1.jpg',
    tall: 'n2.jpg',
    shots: [
      'n2O.jpg',
      'n3.jpg',
      'n4.jpg',
      'n5.jpg',
      'n6.jpg',
      'n7.jpg',
      'n8.jpg',
      'n9.jpg',
      'n10.jpg',
      'n11.jpg',
      'n12.jpg',
      'n13.jpg',
      'n14.jpg',
      'n15.jpg',
      'n16.jpg',
      'n17.jpg',
      'n18.jpg',
      'n19.jpg',
      'n20.jpg',
      'n21.jpg',
      'n22.jpg',
      'n23.jpg',
      'n24.jpg',
      'n25.jpg',
      'n26.jpg',
    ],
  },
  {
    folder: 'concerts/Torino & Pashata',
    cover: 'GTP.jpg',
    tall: 'DTP.jpg',
    shots: [
      'tp1.jpg',
      'tp2.jpg',
      'tp3.jpg',
      'tp4.jpg',
      'tp5.jpg',
      'tp6.jpg',
      'tp7.jpg',
      'tp8.jpg',
      'tp9.jpg',
      'tp10.jpg',
      'tp11.jpg',
      'tp12.jpg',
      'tp13.jpg',
      'tp14.jpg',
      'tp15.jpg',
      'tp16.jpg',
      'tp17.jpg',
    ],
  },
]

// ⚙️ Nothing to edit below
export const collections = projects.map((p) => {
  const parts = p.folder.split('/')
  const type = parts.length > 1 ? parts[0] : 'concerts'
  const name = parts.at(-1)
  const [title, sub = ''] = name.split(' - ')

  const shots = p.shots.map((f) => photo(p.folder, f)).filter(Boolean)
  const cover = p.cover ? photo(p.folder, p.cover) : null
  const tall = p.tall ? photo(p.folder, p.tall) : null

  return {
    type,
    folder: name,
    title: (p.title || title).trim(),
    sub: sub.trim(),
    slug: slugify(name),
    all: [cover, tall, ...shots].filter(Boolean),
    shots,
    cover: (cover || shots[0])?.url,
    tall: (tall || cover || shots[0])?.url,
  }
})

export const byType = (t) => collections.filter((c) => c.type === t)
export const find = (type, slug) => collections.find((c) => c.type === type && c.slug === slug)
