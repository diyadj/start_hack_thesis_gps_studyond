# 🧭 Thesis GPS

> An AI-powered single-page app that acts like Google Maps for your thesis journey. Drop in your situation, get a live route, and never feel lost again.

Built for **START Hack 2026** — Studyond challenge.

---

## Team Roles

| Person | Role | Focus |
|--------|------|-------|
| **Lead dev** | Architect + integrator | Core app, AI wiring, final merge |
| **Peru dev** | Async coder | AI features, persistence, polish (works while team sleeps) |
| **Non-coder 1** | Design + copy | UI copy, demo script, pitch deck |
| **Non-coder 2** | Data + prompts | Mock data, prompt engineering, QA testing |

---

## Task Board

### Hours 0-8 — Lead dev (skeleton)
- [ ] Scaffold Vite + React + TS project
- [ ] Wire up Tailwind + shadcn + brand tokens
- [ ] Build intake form (topic, university, stage, deadline)
- [ ] Render static journey map from intake data
- [ ] Push to GitHub, write Peru dev handoff note

### Hours 8-18 — Peru dev (AI features)
- [ ] ActionCard component — calls Anthropic API with stage context
- [ ] "I'm Stuck" button + conversation dialog
- [ ] localStorage persistence (saves intake + current stage)
- [ ] PR with comments on anything unclear

### Hours 18-26 — Lead dev (matching + outreach)
- [ ] MatchCard component — pulls from supervisors.json + experts.json
- [ ] Match scoring logic (field overlap)
- [ ] Outreach draft generation via AI
- [ ] Merge Peru dev PR

### Hours 26-32 — Peru dev (polish)
- [ ] Mark stage as done — map advances visually
- [ ] Deadline urgency logic (3 weeks left vs 5 months = different map)
- [ ] Loading states + error handling
- [ ] Mobile layout pass

### Hours 32-36 — Everyone (demo prep)
- [ ] Lock 3 demo scenarios (see below)
- [ ] Non-coder 1: finalize pitch deck
- [ ] Non-coder 2: run full QA pass
- [ ] Lead dev: fix critical bugs only

---

## Demo Scenarios (Nail These Three)

1. **Lost at the start** — no topic, 4 months left, MSc student at ETH. GPS generates full route from scratch.
2. **Mid-journey stuck** — has topic + supervisor, needs expert interviews, deadline in 6 weeks. "I'm stuck" button kicks in.
3. **Deadline panic** — 3 weeks left, still needs to finalize proposal. Map shows urgent compressed route.

---

## Setup

```bash
# Clone and install
git clone <your-repo-url>
cd thesis-gps
npm install

# Add your Anthropic API key
cp .env.example .env
# then edit .env and add: VITE_ANTHROPIC_API_KEY=your_key_here

# Run dev server
npm run dev
```

---

## Project Structure

```
src/
  components/
    intake/       # Intake form (stage, topic, university, deadline)
    journey/      # Visual map + stage cards
    stuck/        # "I'm Stuck" dialog + AI conversation
    match/        # Supervisor/expert match cards
    outreach/     # One-click email draft generator
    ui/           # Shared UI primitives (shadcn overrides)
  data/           # Mock data (supervisors, experts, topics, fields)
  hooks/          # useJourneyState, useAI, useOutreach
  lib/            # utils, AI client, matching logic
  store/          # Zustand store (persisted to localStorage)
```

---

## Key Decisions

- **No backend.** Everything runs client-side. State lives in localStorage.
- **Anthropic API called directly from the browser** for the hackathon. In production this would go through a server.
- **Match scores** are calculated from field overlap between student input and supervisor/expert fieldIds in the mock data. Simple, explainable, honest.
- **AI system prompts** live in `src/lib/prompts.ts` — non-coders can edit these without touching component code.

---

## For Non-Coders

### Non-coder 1 — things you own
- All text in `src/lib/copy.ts` (stage names, card descriptions, button labels, empty states)
- The demo script in `docs/demo-script.md`
- The pitch deck (Figma or Google Slides — link it here)

### Non-coder 2 — things you own
- All AI prompts in `src/lib/prompts.ts`
- Testing all three demo scenarios and logging bugs as GitHub issues
- Extending mock data if needed (follow the pattern in `src/data/`)

---

## Handoff Template (for async Peru dev)

When leaving tasks for Peru dev, create a file called `HANDOFF.md` in the root with:
```
## What's done
- ...

## Your task
- File: src/components/...
- Build: ...
- Inputs it receives: ...
- Output it should produce: ...
- Prompt to use: see src/lib/prompts.ts > [PROMPT_NAME]

## Don't touch
- ...
```
