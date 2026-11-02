# Status

_Updated 2026-11-02 by the day-0 session._

## Workstreams

| Workstream                  | Branch / claim            | State       | Next step                                                                                          |
| --------------------------- | ------------------------- | ----------- | -------------------------------------------------------------------------------------------------- |
| Day-0 setup                 | main                      | done        | —                                                                                                  |
| Fall-2 extraction (Phase 0) | data/fall2-extraction     | done        | re-run when Canvas changes (memo prompts unlock Nov 11, Nov 18, Dec 4; Investor homework handouts) |
| Tracker UI (Phase 1)        | feat/tracker-ui           | not started | build to docs/ui-contract.md                                                                       |
| Acceptance tests (Phase 1)  | verify/tracker-acceptance | not started | write from the contract only                                                                       |

## Pending for Shane

- [ ] Apply merge settings (squash only, branches up to date, auto-delete, required check `check`) — checklist in docs/decisions/2026-11-02-merge-settings.md.

## Open questions from the extraction (confirm with the TAs or on Canvas)

- Competitor: Shane is in no 'Small Group of 4' Canvas group (category 13034), which Homework 1 (Nov 4) submits through; his 'Silver 1B' sits in the free-form 'Student Group' tab.
- Investor: the homework assignments use the 'Homework Group N' set; Shane's 'Silver 1A' is in a different set. The TAs asked everyone to join a Homework Group by end of day Nov 4.
- State & Society: Learning Team 1 is inferred from the MGT 401 group 'Team 1'. If right, the Amazon HQ2 debate is Nov 5 with the speaker/slide email due Nov 4, 5 PM; if wrong, the debate is Nov 12, Dec 10 or Dec 15.
- Competitor homework due times: Canvas enforces 8:30 AM for every section; the announcement says 'before your section' (4:10 PM for Silver). The tracker uses 8:30 AM.
- Customer final exam: syllabus says 9-11 AM, the Lecture 1 deck says 9-12. Start time is the same.
- Not tracked on purpose: readings without a deliverable, office hours, review sessions, optional practice problems, the Lecture 1 prep that has already passed.

## Known gaps

- The repository is public by Shane's decision (2026-11-02); `data/assignments.json` carries Canvas descriptions and syllabus excerpts.

- Two browser tabs on the dev server overwrite each other's done-marks (last writer wins); see the roadmap's Phase 4.
- Memo 2-4 and Investor homework descriptions are empty on Canvas until their prompts unlock; re-run the extraction after Nov 11, Nov 18, Dec 4.

- Bash guard not mechanized; the look-before-discarding rules are prose in CLAUDE.md.
- No browser e2e; the gate is typecheck + unit/acceptance tests + lint + format.
- The Canvas pull is manual (signed-in Chrome session); Phase 2 of the roadmap adds a refresh script.
