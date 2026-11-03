# Squash-merge only, branches up to date, auto-delete merged branches

Date: 2026-11-02 · Status: accepted · Applied 2026-11-03

## Context

Parallel Claude sessions will open PRs. The defaults from the new-dev-project skill fit a solo repo.

## Decision

Squash merges only; `main` requires branches to be up to date and the `check` CI job to pass; merged head branches are deleted automatically.

Applied 2026-11-03 at Shane's request, with his gh login: `gh repo edit --enable-squash-merge --enable-merge-commit=false --enable-rebase-merge=false --delete-branch-on-merge`, then `PUT /repos/shanehaynes/assignment-tracker/branches/main/protection` with `required_status_checks: { strict: true, contexts: ["check"] }`, `enforce_admins: true`, `required_linear_history: true`, no force pushes, no deletions, no required reviews (single-owner repo). `enforce_admins` means `gh pr merge` from any session, Shane's included, waits for a green `check` on an up-to-date branch.

## Revisit when

Fleets of 10+ PRs become routine (consider dropping the up-to-date rule in favor of a combine check before each batch).
