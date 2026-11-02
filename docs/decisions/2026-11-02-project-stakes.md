# Assignment tracker is a months-long, single-user, local tool built with Claude sessions

Date: 2026-11-02 · Status: accepted

## Context

Shane asked for a tracker of every Fall-2 deliverable scraped from Canvas, with spec-driven development (mission, tech stack, roadmap). The session ran autonomously, so the four stakes questions were answered from the request and recorded here for him to correct.

## The four answers

1. **Lifespan**: product-lite. It must last the academic year (through spring break 2027 at least) and be extended for Spring-1 courses. Not a throwaway.
2. **Who works on it**: Shane plus Claude sessions and subagent fleets. No other humans.
3. **Data**: Shane's own course data. Assignment descriptions and syllabus excerpts are Yale course content; the GitHub repository named in the request is currently public (see below).
4. **Reach**: local only. `npm run dev` on Shane's machine.

## Implications

- Full new-project path, trimmed: gate, CI, CLAUDE.md, STATUS.md, vendored parallel-agents, decision log. No deploy target, no secrets.
- The data file is committed. Because the repo at github.com/shanehaynes/assignment-tracker is public, course content in `data/assignments.json` is public too. Shane decided on 2026-11-02 to keep it public.

## Revisit when

- Someone else wants to use it (reach changes).
- Canvas sync needs a stored token (data and secrets change).
