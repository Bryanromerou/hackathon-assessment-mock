# CCAT Practice Assessment App

A lightweight, client-side cognitive assessment app that evaluates users across multiple reasoning domains (verbal, math, abstract, spatial). No backend, no database — just a simple practice tool.

---

## Features

- **Multi-category cognitive assessment** — 10 questions across Verbal, Math, Abstract, and Spatial reasoning
- **Fully client-side** — No server, database, or external services required
- **Simple flow** — Land → Start → Answer questions → View results

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| UI | React 19, Tailwind CSS 4, shadcn/ui (Base Nova) |
| Icons | Lucide React |

---

## Project Structure

```
src/
  app/
    assessment/page.tsx         # Assessment page (ready → in_progress → completed)
    layout.tsx                  # Root layout
    page.tsx                    # Landing page
    globals.css                 # Tailwind config + CSS variables
  components/
    ui/                         # shadcn/ui primitives (Button, Card, Badge, etc.)
    assessment-runner.tsx       # Question display & answer submission
    landing-hero.tsx            # Home page hero with "Start Assessment" CTA
    completion-summary.tsx      # Final results page
  lib/
    questions.ts                # Question bank (10 questions)
    types.ts                    # Shared TypeScript interfaces
    utils.ts                    # cn() utility (clsx + tailwind-merge)
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm (or pnpm / yarn / bun)

### Install & Run

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to begin.

### Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `npm run dev` | Start development server |
| `build` | `npm run build` | Create production build |
| `start` | `npm run start` | Run production server |
| `lint` | `npm run lint` | Run ESLint |

---

## Assessment Flow

```
1. User clicks "Start Assessment" on landing page
   └─▶ Navigates to /assessment

2. User clicks "Begin Assessment"
   └─▶ Questions are presented one at a time

3. User answers all 10 questions
   └─▶ Completion summary is displayed
```

---

## Assessment Questions

10 multiple-choice questions across four categories:

| Category | Count | Topics |
|----------|-------|--------|
| Verbal | 3 | Vocabulary, word relationships, analogies |
| Math | 2 | Arithmetic, financial calculations, speed problems |
| Abstract | 3 | Pattern recognition, logical reasoning |
| Spatial | 2 | 3D visualization, geometric problem-solving |

Each question has 4 options (indices 0–3).

---

## UI Components

| Component | Purpose |
|-----------|---------|
| `LandingHero` | Home page entry point — navigates to the assessment |
| `AssessmentRunner` | Renders questions, tracks selections |
| `CompletionSummary` | Final screen with results |
