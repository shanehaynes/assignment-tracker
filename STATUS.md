# Status

_Updated 2026-11-02 by the day-0 session._

## Workstreams

| Workstream                  | Branch / claim                                     | State       | Next step                                           |
| --------------------------- | -------------------------------------------------- | ----------- | --------------------------------------------------- |
| Day-0 setup                 | main                                               | done        | —                                                   |
| Fall-2 extraction (Phase 0) | scratch workflow, lands in `data/assignments.json` | in progress | replace the seed items with the verified extraction |
| Tracker UI (Phase 1)        | feat/tracker-ui                                    | not started | build to docs/ui-contract.md                        |
| Acceptance tests (Phase 1)  | verify/tracker-acceptance                          | not started | write from the contract only                        |

## Pending for Shane

- [ ] The GitHub repository is **public**; `data/assignments.json` carries Canvas descriptions. `gh repo edit shanehaynes/assignment-tracker --visibility private --accept-visibility-change-consequences` makes it private.
- [ ] Apply merge settings (squash only, branches up to date, auto-delete, required check `check`) — checklist in docs/decisions/2026-11-02-merge-settings.md.

## Known gaps

- Bash guard not mechanized; the look-before-discarding rules are prose in CLAUDE.md.
- No browser e2e; the gate is typecheck + unit/acceptance tests + lint + format.
- The Canvas pull is manual (signed-in Chrome session); Phase 2 of the roadmap adds a refresh script.
