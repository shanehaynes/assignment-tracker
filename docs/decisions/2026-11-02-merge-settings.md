# Squash-merge only, branches up to date, auto-delete merged branches

Date: 2026-11-02 · Status: accepted (settings pending; see STATUS.md)

## Context

Parallel Claude sessions will open PRs. The defaults from the new-dev-project skill fit a solo repo.

## Decision

Squash merges only; `main` requires branches to be up to date and the `check` CI job to pass; merged head branches are deleted automatically. The session that created the repo did not change repository settings on Shane's behalf; the checklist is in STATUS.md.

## Revisit when

Fleets of 10+ PRs become routine (consider dropping the up-to-date rule in favor of a combine check before each batch).
