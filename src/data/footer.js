// Footer content + colours. Swap `colors` to any entry of `palettes` to re-ink the whole footer.
export const palettes = {
  // brick red + ember disc (closest to the reference)
  ember: { surface: '#d9482b', deep: '#8f1a14', ink: '#1c1412', paper: '#f3eee7' },
  // warm gold, matches the site's --gold
  gold: { surface: '#e8c47f', deep: '#b98a3c', ink: '#1a140b', paper: '#f3e9cf' },
  // deep moss green with light ink
  moss: { surface: '#3d8a5a', deep: '#1f5a38', ink: '#eef0e0', paper: '#1f5a38' },
}

export const footer = {
  brand: 'Photophactory',
  wordmark: 'photophactory', // drawn letter by letter; a–z, space, "-" and "." are supported
  motto: ['Let’s make', 'something still.'],
  contactTitle: 'Book a session',
  contactLines: ['Concerts · Portraits'],
  email: 'hello@photophactory.com',
  navigationTitle: 'Navigate',
  // columns of links: { label, to } = router link, { label, href } = plain link
  navigation: [
    [
      { label: 'Home', to: '/' },
      { label: 'All work', to: '/work' },
      { label: 'About', to: '/about' },
    ],
    [
      { label: 'Selected', to: '/#rooms' },
      { label: 'Contact', href: 'mailto:hello@photophactory.com' },
    ],
  ],
  followTitle: 'Elsewhere',
  socials: [[{ label: 'Instagram ↗', href: 'https://instagram.com/', external: true }]],
  registry: 'Concert & portrait photography',
  legal: [{ label: 'Made by INRAIT ↗', href: 'https://inrait.com', external: true }],
  colors: { surface: '#8a5a3c', deep: '#2a1810', ink: '#f1e4d3', paper: '#2a1810' },
}
