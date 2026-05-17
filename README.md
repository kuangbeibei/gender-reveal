# Gender Reveal · Next.js

A standalone Next.js project that builds the gender reveal experience into pure static
HTML / JS / CSS.

## Run locally

```bash
cd nextjs
npm install
npm run dev
```

Then open <http://localhost:3000>.

## Build static files (HTML + JS + CSS)

```bash
npm run build
```

This produces an `out/` folder with the fully exported site. You can:

- Open `out/index.html` directly in a browser (file:// works thanks to `trailingSlash`)
- Upload the `out/` folder to GitHub Pages / Vercel / Netlify / Cloudflare Pages / S3
- Zip and share

## Choosing girl vs. boy

The result is controlled by a URL query parameter:

- Default: `/` → **girl**
- Boy: `/?result=boy`

You can also flip it permanently by editing `DEFAULT_RESULT` near the top of
`components/GenderReveal.jsx`.

## File map

```
app/
  layout.jsx       # HTML shell + Google Fonts
  page.jsx         # imports the main component
  globals.css      # all styles
components/
  GenderReveal.jsx # entire experience in one client component
public/
  stickers/        # 8 sticker PNGs (good-morning, wow, etc.)
```

All assets live under `public/` and are served from the site root (`/stickers/…`).
