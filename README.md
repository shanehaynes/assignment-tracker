# Assignment tracker

Every Fall-2 deliverable for Yale SOM's Silver cohort, in one list, with the term's progress at the top. Local, single-user.

```bash
npm install
npm run dev      # http://localhost:5173
npm run check    # typecheck, tests, lint, format
```

Data lives in `data/assignments.json` (the deliverables, with provenance) and `data/semester.json` (the term window and milestones). Done-marks are written to `data/progress.json` by the dev server; the file is git-ignored, so `git add -f data/progress.json` if you want your progress versioned.

Specs: [docs/mission.md](docs/mission.md) · [docs/tech-stack.md](docs/tech-stack.md) · [docs/roadmap.md](docs/roadmap.md) · [docs/ui-contract.md](docs/ui-contract.md). Working rules for Claude sessions: [CLAUDE.md](CLAUDE.md), [STATUS.md](STATUS.md).
