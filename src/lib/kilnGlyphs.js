// Pure maths for the footer wordmark: a small procedural geometric alphabet (a–z, "-", "."),
// layout, the pointer "weight lens", and the footer's background "tile" compositions.
// Ported from the 21st.dev "Kiln Wordmark Footer" (React) to plain JS.

/** x-height, ascender and descender of the alphabet, in glyph units. */
export const XH = 100
export const ASC = 36
export const DESC = 36
/** Superellipse exponent of every bowl: 2 is an ellipse, higher is squarer. */
export const SQUARE = 2.4
const PI = Math.PI
const TAU = PI * 2

export const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v)

/** Shoelace area. Positive is clockwise on screen (y points down). */
export const signedArea = (p) => {
  let a = 0
  for (let i = 0; i < p.length; i++) {
    const j = (i + 1) % p.length
    a += p[i][0] * p[j][1] - p[j][0] * p[i][1]
  }
  return a / 2
}

/** Fill shapes run clockwise, holes anticlockwise, so one nonzero path can hold a whole glyph. */
export const orient = (p, sign) => (signedArea(p) * sign >= 0 ? p : p.slice().reverse())

const sePt = (cx, cy, rx, ry, t) => {
  const c = Math.cos(t)
  const s = Math.sin(t)
  return [cx + rx * Math.sign(c) * Math.pow(Math.abs(c), 2 / SQUARE), cy + ry * Math.sign(s) * Math.pow(Math.abs(s), 2 / SQUARE)]
}

/** A superellipse bowl inside the box: an outline (clockwise) and its counter (anticlockwise). */
export const ring = (x0, y0, x1, y1, V, h) => {
  const cx = (x0 + x1) / 2
  const cy = (y0 + y1) / 2
  const rx = (x1 - x0) / 2
  const ry = (y1 - y0) / 2
  const irx = Math.max(1, rx - V)
  const iry = Math.max(1, ry - h)
  const outer = []
  const inner = []
  for (let i = 0; i < 96; i++) {
    const t = (i / 96) * TAU
    outer.push(sePt(cx, cy, rx, ry, t))
    inner.push(sePt(cx, cy, irx, iry, t))
  }
  return [orient(outer, 1), orient(inner, -1)]
}

/** Sutherland–Hodgman against one half-plane [axis, at, side]. Orientation is preserved. */
export const clipHalf = (poly, [axis, at, side]) => {
  const out = []
  const inside = (p) => (p[axis] - at) * side <= 0
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]
    const b = poly[(i + 1) % poly.length]
    const ia = inside(a)
    const ib = inside(b)
    if (ia) out.push(a)
    if (ia !== ib) {
      const u = (at - a[axis]) / (b[axis] - a[axis])
      out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u])
    }
  }
  return out
}

/** The part of a shape inside every half-plane: flat, cut terminals. */
export const keep = (shape, ...halves) =>
  shape.map((poly) => halves.reduce(clipHalf, poly)).filter((poly) => poly.length >= 3 && Math.abs(signedArea(poly)) > 1e-6)

export const rect = (x0, y0, x1, y1) =>
  orient([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], 1)

/** A slanted stroke from (xa, ya) to (xb, yb), `t` wide measured horizontally. */
export const diag = (xa, ya, xb, yb, t) =>
  orient([[xa, ya], [xa + t, ya], [xb + t, yb], [xb, yb]], 1)

const B = 112 // the bowl width shared by a b d e g o p q u n h

/** The alphabet: [advance width, shapes(V, h)]. Advance widths never depend on the weight. */
export const GLYPHS = {
  a: [B, (V, h) => [...ring(0, 0, B, XH, V, h), rect(B - V, 0, B, XH)]],
  b: [B, (V, h) => [rect(0, -ASC, V, XH), ...ring(0, 0, B, XH, V, h)]],
  c: [82, (V, h) => keep(ring(0, 0, 122, XH, V, h), [0, 82, 1])],
  d: [B, (V, h) => [...ring(0, 0, B, XH, V, h), rect(B - V, -ASC, B, XH)]],
  e: [B, (V, h) => {
    const o = ring(0, 0, B, XH, V, h)
    return [...keep(o, [1, XH / 2, 1]), ...keep(o, [1, XH / 2, -1], [0, 82, 1]), rect(V * 0.5, XH / 2 - h / 2, B, XH / 2 + h / 2)]
  }],
  f: [78, (V, h) => [rect(10, 26, 10 + V, XH), ...keep(ring(10, -ASC, 110, 88, V, h), [1, 26, 1], [0, 78, 1]), rect(0, 0, 74, h)]],
  g: [B, (V, h) => [...ring(0, 0, B, XH, V, h), rect(B - V, 0, B, 92), ...keep(ring(0, 48, B, XH + DESC, V, h), [1, 92, -1], [0, 14, -1])]],
  h: [B, (V, h) => [rect(0, -ASC, V, XH), ...keep(ring(0, 0, B, XH, V, h), [1, XH / 2, 1]), rect(B - V, XH / 2, B, XH)]],
  i: [30, (V) => [rect(15 - V / 2, 0, 15 + V / 2, XH)]],
  j: [46, (V, h) => [rect(31 - V / 2, 0, 31 + V / 2, XH + DESC), rect(0, XH + DESC - h, 31, XH + DESC)]],
  k: [100, (V) => [rect(0, -ASC, V, XH), diag(V * 0.7, 66, 100 - V * 1.1, 0, V * 1.1), diag(36, 44, 100 - V, XH, V)]],
  l: [30, (V) => [rect(15 - V / 2, -ASC, 15 + V / 2, XH)]],
  m: [184, (V, h) => [
    rect(0, 0, V, XH),
    ...keep(ring(0, 0, 92 + V / 2, XH, V, h), [1, XH / 2, 1]),
    ...keep(ring(92 - V / 2, 0, 184, XH, V, h), [1, XH / 2, 1]),
    rect(92 - V / 2, XH / 2, 92 + V / 2, XH),
    rect(184 - V, XH / 2, 184, XH),
  ]],
  n: [B, (V, h) => [rect(0, 0, V, XH), ...keep(ring(0, 0, B, XH, V, h), [1, XH / 2, 1]), rect(B - V, XH / 2, B, XH)]],
  o: [B, (V, h) => ring(0, 0, B, XH, V, h)],
  p: [B, (V, h) => [rect(0, 0, V, XH + DESC), ...ring(0, 0, B, XH, V, h)]],
  q: [B, (V, h) => [...ring(0, 0, B, XH, V, h), rect(B - V, 0, B, XH + DESC)]],
  r: [84, (V, h) => [rect(0, 0, V, XH), ...keep(ring(0, 0, 108, XH + 10, V, h), [1, (XH + 10) / 2, 1], [0, 84, 1])]],
  s: [104, (V, h) => {
    const m = XH / 2
    const up = ring(0, 0, 104, m + h / 2, V, h)
    const lo = ring(0, m - h / 2, 104, XH, V, h)
    return [
      ...keep(up, [0, 52, 1]),
      ...keep(up, [0, 52, -1], [0, 90, 1], [1, (m + h / 2) / 2, 1]),
      ...keep(lo, [0, 52, -1]),
      ...keep(lo, [0, 52, 1], [0, 14, -1], [1, (m - h / 2 + XH) / 2, -1]),
    ]
  }],
  t: [80, (V, h) => [rect(12, -ASC * 0.8, 12 + V, 56), rect(0, 0, 76, h), ...keep(ring(12, 12, 112, XH, V, h), [1, 56, -1], [0, 80, 1])]],
  u: [B, (V, h) => [...keep(ring(0, 0, B, XH, V, h), [1, XH / 2, -1]), rect(0, 0, V, XH / 2), rect(B - V, 0, B, XH)]],
  v: [106, (V) => [diag(0, 0, 53 - V / 2, XH, V), diag(106 - V, 0, 53 - V / 2, XH, V)]],
  w: [176, (V) => [
    diag(0, 0, 44 - V / 2, XH, V),
    diag(88 - V / 2, 0, 44 - V / 2, XH, V),
    diag(88 - V / 2, 0, 132 - V / 2, XH, V),
    diag(176 - V, 0, 132 - V / 2, XH, V),
  ]],
  x: [106, (V) => [diag(0, 0, 106 - V, XH, V), diag(106 - V, 0, 0, XH, V)]],
  y: [106, (V) => {
    const foot = 53 - V / 2
    const slope = (foot - (106 - V)) / XH
    return [diag(0, 0, foot, XH, V), diag(106 - V, 0, 106 - V + slope * (XH + DESC), XH + DESC, V)]
  }],
  z: [98, (V, h) => [rect(0, 0, 98, h), rect(0, XH - h, 98, XH), diag(98 - V * 1.15, h * 0.5, 0, XH - h * 0.5, V * 1.15)]],
  '-': [60, (_V, h) => [rect(0, XH / 2 - h / 2, 60, XH / 2 + h / 2)]],
  '.': [30, (V) => [rect(15 - V / 2, XH - V, 15 + V / 2, XH)]],
  ' ': [46, () => []],
}

/** Stroke weights for a weight factor k: k = 1 is the reference, verticals move more than horizontals. */
export const strokes = (k) => {
  const w = clamp(Number.isFinite(k) ? k : 1, 0.4, 1.6)
  return { V: 30 * w, h: 19 * (0.55 + 0.45 * w) }
}

export const n1 = (v) => String(Math.round(v * 10) / 10)

/** One glyph as an SVG path at weight k, shifted right by dx. Unknown characters give "". */
export const glyphPath = (ch, k, dx = 0) => {
  const g = GLYPHS[ch]
  if (!g) return ''
  const { V, h } = strokes(k)
  return g[1](V, h)
    .map((poly) => 'M' + poly.map((p) => n1(p[0] + dx) + ' ' + n1(p[1])).join('L') + 'Z')
    .join('')
}

/** True when every character of `word` can be drawn by the alphabet. */
export const supported = (word) => word.length > 0 && [...word].every((c) => c in GLYPHS)

/** Lay a word out on one line: where each letter starts, total width, and vertical extent. */
export const layoutWord = (word, tracking = 10) => {
  const letters = []
  let x = 0
  for (const ch of word) {
    const g = GLYPHS[ch]
    if (!g) continue
    letters.push({ ch, x, w: g[0] })
    x += g[0] + tracking
  }
  const width = letters.length ? x - tracking : 0
  const top = /[bdfhklt]/.test(word) ? -ASC : 0
  const bottom = /[gjpqy]/.test(word) ? XH + DESC : XH
  return { letters, width, top, bottom }
}

/** The weight lens: each letter's target weight for a pointer at `px` (null = away). */
export const lensWeights = (centres, px, base, boost, radius) =>
  centres.map((c) => {
    if (px === null || !Number.isFinite(px) || !(radius > 0)) return base
    const d = (c - px) / radius
    return base + boost * Math.exp(-d * d)
  })

/** Frame-rate independent ease toward a target: `k` is the fraction closed per 1/60 s. */
export const approach = (from, to, k, dt) =>
  to + (from - to) * Math.pow(1 - clamp(k, 0, 1), clamp(dt, 0, 0.1) * 60)

/** The tile's compositions, in fractions of the panel: a disc (cx, cy, r of the width) and a slab (x, width). */
export const TILES = [
  { cx: 0.385, cy: 0.5, r: 0.415, sx: 0.755, sw: 0.245 },
  { cx: 0.615, cy: 0.5, r: 0.415, sx: 0, sw: 0.245 },
  { cx: 0.5, cy: 1.04, r: 0.5, sx: 0.5, sw: 0 },
  { cx: 1, cy: 0, r: 0.6, sx: 0, sw: 0.3 },
]

/** Index of the tile after `i`, wrapping. */
export const nextTile = (i, n = TILES.length) => {
  if (!(n > 0)) return 0
  const v = Number.isFinite(i) ? Math.trunc(i) : 0
  return (((v + 1) % n) + n) % n
}

/** The tile with the disc nudged toward the pointer (px, py in -1 → 1). */
export const leanTile = (t, px, py, amount = 0.035) => ({
  ...t,
  cx: t.cx + amount * clamp(Number.isFinite(px) ? px : 0, -1, 1),
  cy: t.cy + amount * 1.6 * clamp(Number.isFinite(py) ? py : 0, -1, 1),
})
