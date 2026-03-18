# 🧭 Thesis GPS

> An AI-powered single-page app that acts like Google Maps for your thesis journey. Drop in your situation, get a live route, and never feel lost again.

Built for **START Hack 2026** — Studyond challenge.

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




- Inputs it receives: ...
- Output it should produce: ...
- Prompt to use: see src/lib/prompts.ts > [PROMPT_NAME]
