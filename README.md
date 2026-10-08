# AEVON Music

A minimalist music streaming web app built on the JioSaavn catalog. Search, stream
and download songs, with synced lyrics, a persistent queue and a local library.

> The catalogue is intentionally **English-only**. `LANGUAGES` in
> `src/lib/constants.ts` is retained for the API surface, but the home page and
> its sections filter to `language === "english"`.

## Requirements

- Node.js 20+
- npm

## Getting started

```bash
npm install
npm run dev
```

Open <http://localhost:3001> — the port is **3001** (not the Next.js default 3000).

### Windows quick start

Double-click **`starthere.bat`**. It builds on first run, starts the server in a
minimised window, waits for port 3001 to respond, then opens your browser.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server with hot reload on port 3001 |
| `npm run build` | Production build |
| `npm start` | Serve the production build on port 3001 |
| `npm run lint` | ESLint (includes React Compiler rules) |

## Environment variables

All optional — the app runs with the built-in defaults.

| Variable | Purpose | Default |
| --- | --- | --- |
| `SAAVN_API_BASE` | Primary JioSaavn API instance | `shnwazdev-jiosaavn-apii.vercel.app` |
| `SAAVN_API_BASE_2` | Fallback instance, used when the primary fails | `saavn.dev` |
| `NEXT_PUBLIC_SITE_URL` | Absolute base URL for metadata / sitemap | `http://localhost:3001` |

Create a `.env.local` (gitignored) to override these.

## Architecture

```
src/
  app/            App Router routes (home, search, album, artist, playlist,
                  song, library, downloads, disclaimer) + 5 API routes
  components/     UI grouped by concern (player, cards, library, search,
                  detail, dialogs, menus, home, ui primitives)
  lib/            api.ts is the single data gateway; audio.ts owns the
                  singleton <audio>; deezer/lrclib are secondary sources
  stores/         zustand: player, library (persisted), progress
  providers/      PlayerProvider wires DOM audio events + keyboard shortcuts
```

### Data flow

`lib/api.ts` is the only place that talks to the upstream API. It:

1. tries `SAAVN_BASE`, then `SAAVN_FALLBACK_BASE` on failure or bad payload;
2. unwraps the `{ success, data }` envelope;
3. normalises the raw JSON into the types in `lib/types.ts`.

Page-level callers wrap requests in `safe(promise, fallback)` so a provider
outage degrades to an empty section instead of a 500. Home and listing pages use
`revalidate = 3600`.

### Audio

`lib/audio.ts` holds one module-level `HTMLAudioElement`. The player store drives
it; `PlayerProvider` translates DOM events (`playing`, `ended`, `error`,
`timeupdate`) back into store updates.

When a direct CDN link fails, `PlayerProvider`'s `error` handler marks the track
and retries through `/api/stream`, which proxies the media and forwards `Range`
headers for seeking.

### Library

Favourites, playlists, downloads and recently-played are **client-side only**,
persisted to `localStorage` under `hayasaka-library-v1` via the zustand
`persist` middleware. There is no account system or server-side storage.

## API routes

| Route | Purpose |
| --- | --- |
| `GET /api/search?q=&type=&page=` | Search songs / albums / playlists / artists, or all |
| `GET /api/stream?url=` | Proxies allowlisted media, forwards `Range` |
| `GET /api/download?url=&name=` | Proxies media as an attachment |
| `GET /api/lyrics?id=&title=&artist=` | LRC Lib (synced) first, then JioSaavn |
| `GET /api/suggestions?id=` | Similar tracks for queue auto-fill |

### Media proxy security

`/api/stream` and `/api/download` accept an arbitrary `url`, so they are
restricted to the hosts in `ALLOWED_MEDIA_HOSTS` (`src/lib/constants.ts`).
`fetchAllowedMedia` in `lib/api.ts` walks redirects manually and re-validates
the host on every hop, so an allowlisted CDN cannot bounce the proxy at an
internal address. Add hosts there rather than loosening the check.

## Keyboard shortcuts

Active when the player bar has focus and no overlay is open.

| Key | Action |
| --- | --- |
| `Space` | Play / pause |
| `←` / `→` | Previous / next track |
| `↑` / `↓` | Volume |
| `M` | Mute |
| `L` | Toggle lyrics |
| `Q` | Toggle queue |
| `A` | Toggle auto-add similar |
| `F` | Favourite current track |
| `Ctrl/⌘ + K` | Focus search |

## Deploying

Deploys to any Node host. Remember to set `NEXT_PUBLIC_SITE_URL` to the public
origin so metadata, `sitemap.ts` and `robots.ts` emit absolute URLs.

## Notes

- Cover art uses `next/image` with `unoptimized`, so remote patterns are not
  required and third-party CDN art loads directly.
- `scripts/gen-icons.mjs` regenerates `public/icons/icon-{192,512}.png` from
  `public/logo.png`.
- See `/disclaimer` for the project disclaimer.