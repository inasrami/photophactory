// ⚡ OPTIMIZED: photos are NOT part of the repo/bundle any more - they live on the VPS.
// Before, import.meta.glob made Vite copy + hash every photo into dist (and 4 data files each had their own glob).
// Now this one tiny helper turns "folder/file.webp" into a URL:
//    full   -> <BASE>/full/<path>    1920px long edge  (collection pages, lightbox, About)
//    thumbs -> <BASE>/thumbs/<path>   960px long edge  (hero cards, landing gallery, work wheel, previews)
// BASE comes from VITE_PHOTOS_URL (see .env.production). Default '/photos' = same domain as the site.
const BASE = (import.meta.env.VITE_PHOTOS_URL || '/photos').replace(/\/$/, '')

// encodeURI keeps the slashes but escapes spaces, '&' and ',' used in folder names ("Torino & Pashata")
const url = (dir, path) => `${BASE}/${dir}/${encodeURI(path)}`

export const fullUrl = (path) => url('full', path)
export const thumbUrl = (path) => url('thumbs', path)
