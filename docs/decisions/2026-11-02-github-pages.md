# Publish the static build to GitHub Pages from `main`

Date: 2026-11-02 · Status: accepted · Supersedes [2026-11-02-deploy-target.md](2026-11-02-deploy-target.md)

## Context

Shane asked for the tracker to be live on GitHub Pages so it is reachable without running the dev server. The repository is public by his decision, so a public page adds no exposure the repo does not already have.

## Options

- **GitHub Pages via Actions** — free, deploys on every merge to `main`, no server / static only, so the dev-server progress endpoint is absent.
- **Vercel** — previews per PR, serverless functions could host a progress API / another account and host to manage for a one-user tool.
- **Stay local** — simplest / not what was asked.

## Decision

GitHub Pages, built by `.github/workflows/pages.yml` on every push to `main`: the workflow runs the gate, builds with `VITE_BASE=/assignment-tracker/`, stamps `dist/version.json` with the commit SHA, and deploys with `actions/deploy-pages`. The site is https://shanehaynes.github.io/assignment-tracker/. On the hosted page the `/__progress` endpoint does not exist, so done-marks fall back to the browser's `localStorage` (per device, per browser); the local `npm run dev` keeps writing `data/progress.json`.

Post-deploy check: `curl -s https://shanehaynes.github.io/assignment-tracker/version.json` reports the merged SHA.

Enabling the site was a one-time manual step. `actions/configure-pages` with `enablement: true` cannot create the Pages site with the workflow token (the first run on 2026-11-03 failed in `build` with "Resource not accessible by integration"), so the site was created once with Shane's own credentials: `gh api -X POST repos/shanehaynes/assignment-tracker/pages -f build_type=workflow`. The flag is harmless now that the site exists; a fresh fork or a renamed repository needs that command again before its first deploy.

## Revisit when

- Done-marks need to follow Shane across devices (then a small hosted store, or syncing `data/progress.json` through the repo, replaces the per-browser fallback).
- Anything private lands in the data file (then the page must come down or the repo go private).
