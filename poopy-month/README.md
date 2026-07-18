# Poopy Month

A personal one-month discipline app. It shows your day in 15-minute blocks, tells you what to do now, tracks a weighted daily score out of 100, and keeps a daily photo and record. The month runs Monday 20 July 2026 for 30 days. Sunday loads its own rest-day plan automatically.

Built as an installable PWA (Next.js 16, App Router). Add it to your home screen and it runs full screen.

## Structure

- `lib/poopy-core.mjs` - all data (plans, supplements, gym, diet, scoring weights) and the pure date/score/streak logic. Framework-free and unit tested.
- `lib/poopy-app.ts` - the DOM app: renders every screen and wires the behaviour. Mounted once by the client component.
- `app/poopy.tsx` - thin React client component that mounts the app and registers the service worker.
- `app/globals.css` - the full visual style (warm stone paper, chunky black-outlined cards, lime accent).
- `app/manifest.webmanifest`, `public/sw.js`, `public/icon-*.png` - PWA install, offline, and icons.

State is stored on the device (localStorage), one record per calendar day, plus a scores map for the month view. Nothing is sent anywhere yet.

## Scripts

- `npm run dev` - run locally at http://localhost:3000
- `npm run build` - production build
- `npm test` - core unit tests plus a headless client smoke test
- `npm run icons` - regenerate the PWA icons

## Roadmap

- Phase 1 (this): the full app, installable, on-device data. Done.
- Phase 2: Google Calendar (one sign-in, both accounts) so real Sash meetings appear in the work blocks.
- Phase 3: real scheduled push notifications (fire when the app is closed), cloud sync so photos and records follow you across devices, then Nina's profile.

## Deploy

Publish this folder as its own private GitHub repo (GitHub Desktop, Publish repository), then import it on Vercel. Every push then deploys automatically. Commit as doubleedged101@gmail.com.

Note: the app lives in the `poopy-month/` subfolder of this repo, so set the Vercel project Root Directory to `poopy-month`.
