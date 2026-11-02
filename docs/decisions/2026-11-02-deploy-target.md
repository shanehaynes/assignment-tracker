# No deploy target

Date: 2026-11-02 · Status: accepted

## Context

The mission is a single-user local tool. The data file contains course content.

## Decision

None yet. The app runs with `npm run dev`. There is no version endpoint because there is nothing to verify after a deploy.

## Revisit when

Shane wants it on a phone or a second machine. The first step then is a static build on a private host, with progress state moved off the dev-server middleware.
