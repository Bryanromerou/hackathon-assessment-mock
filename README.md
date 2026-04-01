# CCAT Practice Assessment App

A web-based cognitive assessment platform that evaluates candidates across multiple reasoning domains (verbal, math, abstract, spatial) while monitoring for academic integrity violations in real time. Designed to pair with the **Integrity Companion App** (a desktop/Electron application) for system-level proctoring.

---

## Getting Started

### Prerequisites

- Node.js 22
- npm (or pnpm / yarn / bun)

### Install & Run

```bash
# Install dependencies
npm install

# Generate Prisma client & push schema to SQLite
npx prisma generate
npx prisma db push

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to begin.

### Available Scripts

| Script  | Command         | Description              |
| ------- | --------------- | ------------------------ |
| `dev`   | `npm run dev`   | Start development server |
| `build` | `npm run build` | Create production build  |
| `start` | `npm run start` | Run production server    |
| `lint`  | `npm run lint`  | Run ESLint               |

---

## Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="file:./dev.db"
```

| Variable       | Description               | Default         |
| -------------- | ------------------------- | --------------- |
| `DATABASE_URL` | SQLite database file path | `file:./dev.db` |

---

## Features

- **Multi-category cognitive assessment** — 10 questions across Verbal, Math, Abstract, and Spatial reasoning
- **Real-time integrity monitoring** — Browser-side and system-level checks detect cheating signals as they happen
- **Dual-source validation** — Signals originate from both the browser (JavaScript) and the Electron companion app
- **Adaptive integrity scoring** — Score starts at 100 and decreases automatically based on signal severity
- **Timing analysis** — Category-aware thresholds flag suspiciously fast answers
- **Automatic session pairing** — The web assessment auto-connects to the desktop companion app
- **Live updates via SSE** — Server-Sent Events stream status changes and integrity signals to the client in real time
- **AI browser detection** — Identifies known AI-assisted browsers (Claude, Comet, Arc, Atlas, Dia, Opera Neon)

---

## Tech Stack

| Layer     | Technology                                      |
| --------- | ----------------------------------------------- |
| Framework | Next.js 16 (App Router)                         |
| Language  | TypeScript 5                                    |
| UI        | React 19, Tailwind CSS 4, shadcn/ui (Base Nova) |
| Database  | SQLite (file-based)                             |
| ORM       | Prisma 7 with LibSQL adapter                    |
| Icons     | Lucide React                                    |
| Real-time | Server-Sent Events (SSE)                        |

---

## Project Structure

```
src/
  app/                          # Next.js App Router
    api/session/
      create/route.ts           # POST  — create a new session
      [sessionId]/
        status/route.ts         # GET (SSE) / POST — session status stream & updates
        poll/route.ts           # GET  — lightweight session state polling
        questions/route.ts      # GET  — retrieve assessment questions
        signal/route.ts         # POST — submit integrity signals
    assessment/page.tsx         # Assessment page (requires ?session= param)
    layout.tsx                  # Root layout
    page.tsx                    # Landing page
    globals.css                 # Tailwind config + CSS variables
  components/
    ui/                         # shadcn/ui primitives (Button, Card, Badge, etc.)
    assessment-runner.tsx       # Question display & answer submission
    landing-hero.tsx            # Home page hero with "Start Assessment" CTA
    pairing-code.tsx            # Auto-connection status for companion app
    pre-check-status.tsx        # System checks screen (blocking apps list)
    integrity-banner.tsx        # Real-time score + signal counter
    completion-summary.tsx      # Final results page
    paused-overlay.tsx          # Full-screen overlay when paused
    hard-warning-overlay.tsx    # Warning modal requiring acknowledgement
    locked-out-overlay.tsx      # Overlay when session is permanently locked
  hooks/
    use-sse.ts                  # EventSource connection to status stream
    use-timing-analyzer.ts      # Per-question timing & anomaly detection
    use-browser-detector.ts     # One-time + continuous browser integrity checks
  lib/
    db.ts                       # Prisma client singleton
    types.ts                    # Shared TypeScript interfaces
    sessions.ts                 # Session CRUD helpers
    integrity-scoring.ts        # Score deduction logic
    questions.ts                # Question bank (10 questions)
    sse.ts                      # SSE controller map
    utils.ts                    # cn() utility (clsx + tailwind-merge)
  generated/prisma/             # Auto-generated Prisma client

prisma/
  schema.prisma                 # Database schema definition
```

---

## Database

### Schema (Prisma)

**Session**

| Column           | Type            | Description                          |
| ---------------- | --------------- | ------------------------------------ |
| `id`             | UUID            | Primary key                          |
| `status`         | String          | Current session state                |
| `integrityScore` | Int             | 0–100, starts at 100                 |
| `hardWarnings`   | Int             | Running count of hard warnings       |
| `createdAt`      | DateTime        | Auto-set on creation                 |
| `updatedAt`      | DateTime        | Auto-updated                         |

**IntegritySignal**

| Column      | Type                 | Description                                   |
| ----------- | -------------------- | --------------------------------------------- |
| `id`        | Int (auto-increment) | Primary key                                   |
| `sessionId` | UUID (FK)            | References Session                            |
| `type`      | String               | Signal type (e.g. `ai_browser`, `extensions`) |
| `severity`  | String               | `danger` / `warning` / `info`                 |
| `metadata`  | JSON                 | Additional signal data                        |
| `source`    | String               | `electron` or `browser`                       |
| `timestamp` | DateTime             | When the signal was detected                  |

**AssessmentResponse**

| Column           | Type                 | Description                         |
| ---------------- | -------------------- | ----------------------------------- |
| `id`             | Int (auto-increment) | Primary key                         |
| `sessionId`      | UUID (FK)            | References Session                  |
| `questionId`     | String               | Reference to question bank          |
| `selectedOption` | Int                  | 0–3 (selected answer index)         |
| `responseTimeMs` | Int                  | Time taken in milliseconds          |
| `timingSeverity` | String               | `normal` / `warning` / `suspicious` |
| `answeredAt`     | DateTime             | When the answer was submitted       |

### Session Status Enum

```
waiting_for_companion → paired → pre_check → ready → in_progress → paused → hard_warning → locked_out → completed
```

---

## Session Lifecycle

```
1. User clicks "Start Assessment"
   └─▶ POST /api/session/create → returns { sessionId }

2. Redirect to /assessment?session=[id]
   └─▶ SSE connection opens to /api/session/[id]/status

3. Companion app auto-connects (status: waiting_for_companion → paired)
   └─▶ No manual pairing code — app detects and connects automatically

4. Companion app runs system checks (status: paired → pre_check)
   └─▶ Signals sent via POST /api/session/[id]/signal

5. Checks pass (status: ready)
   └─▶ User clicks "Begin Assessment"

6. Assessment in progress (status: in_progress)
   └─▶ Questions loaded from GET /api/session/[id]/questions
   └─▶ Each answer → timing analysis → integrity signals → score updates via SSE

7. Integrity violations may trigger:
   └─▶ hard_warning — user must acknowledge to continue
   └─▶ locked_out — session is permanently terminated

8. Final question answered (status: completed)
   └─▶ Completion summary with integrity score + signal count
```

---

## API Reference

### `POST /api/session/create`

Creates a new assessment session.

**Response:**

```json
{
  "sessionId": "uuid"
}
```

---

### `GET /api/session/[sessionId]/poll`

Lightweight polling endpoint for session state.

**Response:**

```json
{
  "status": "in_progress",
  "integrityScore": 85,
  "hardWarnings": 1
}
```

---

### `GET /api/session/[sessionId]/status`

Opens a **Server-Sent Events** stream. Pushes real-time updates for:

- Session status changes
- New integrity signals

Sends the current status immediately on connection.

---

### `POST /api/session/[sessionId]/status`

Updates the session status.

**Request Body:**

```json
{
  "status": "in_progress",
  "details": {}
}
```

**Response:** Updated session with current integrity score.

---

### `GET /api/session/[sessionId]/questions`

Returns the 10-question assessment. Only accessible when status is `ready` or `in_progress`.

**Response:**

```json
[
  {
    "id": "string",
    "category": "verbal | math | abstract | spatial",
    "text": "Question text...",
    "options": ["A", "B", "C", "D"]
  }
]
```

---

### `POST /api/session/[sessionId]/signal`

Submits an integrity signal.

**Request Body:**

```json
{
  "type": "ai_browser",
  "metadata": {},
  "source": "browser"
}
```

**Response:** Updated session with recalculated integrity score. Signal is broadcast to the SSE stream.

---

## Integrity Monitoring

### Browser-Side Detection

The `useBrowserDetector` hook performs continuous monitoring for:

| Check                | What it detects                                                                                      |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| AI browser detection | User agent patterns, CSS variables, and DOM artifacts for Claude, Comet, Arc, Atlas, Dia, Opera Neon |
| Extension runtime    | `chrome-extension://` or `moz-extension://` protocols                                                |
| Prototype tampering  | Overridden `fetch`, `XMLHttpRequest`, `addEventListener`, etc.                                       |
| iframe embedding     | Detects if the app is running inside an iframe                                                       |
| DOM mutations        | Injected scripts, iframes, or form elements                                                          |
| Focus loss           | Tab switches, window blur, visibility changes                                                        |
| Keyboard shortcuts   | `Ctrl+Enter`, `Ctrl+Shift+Space` (common AI triggers)                                                |
| Clipboard events     | Copy, paste, and cut operations                                                                      |
| Webdriver / Cypress  | Automated browser detection                                                                          |

### Timing Analysis

The `useTimingAnalyzer` hook flags suspiciously fast answers using category-specific thresholds:

| Category | Suspicious if answered in less than |
| -------- | ----------------------------------- |
| Verbal   | 6 seconds                           |
| Math     | 10 seconds                          |
| Abstract | 8 seconds                           |
| Spatial  | 8 seconds                           |

Additional timing flags:

- **3+ consecutive fast answers** triggers a warning
- **>50% suspicious ratio** across all answers triggers an alert

### Integrity Score Deductions

| Severity | Deduction  | Example signals                                            |
| -------- | ---------- | ---------------------------------------------------------- |
| Danger   | -15 points | AI browser detected, extensions found, prototype tampering |
| Warning  | -5 points  | DOM mutations, focus loss, fast answers, clipboard usage   |
| Info     | 0 points   | Informational only                                         |

The score floors at **0** and cannot go negative.

---

## Assessment Questions

10 multiple-choice questions across four categories:

| Category | Count | Topics                                             |
| -------- | ----- | -------------------------------------------------- |
| Verbal   | 3     | Vocabulary, word relationships, analogies          |
| Math     | 2     | Arithmetic, financial calculations, speed problems |
| Abstract | 3     | Pattern recognition, logical reasoning             |
| Spatial  | 2     | 3D visualization, geometric problem-solving        |

Each question has 4 options (indices 0–3).

---

## UI Components

| Component           | Purpose                                                |
| ------------------- | ------------------------------------------------------ |
| `LandingHero`       | Home page entry point — creates a session on click     |
| `PairingCode`         | Shows auto-connection status for companion app pairing |
| `PreCheckStatus`      | Shows system check progress and blocking app list      |
| `AssessmentRunner`    | Renders questions, tracks selections and timing        |
| `IntegrityBanner`     | Persistent top bar showing live score and signal count |
| `PausedOverlay`       | Full-screen modal when the session is paused           |
| `HardWarningOverlay`  | Warning modal requiring user acknowledgement           |
| `LockedOutOverlay`    | Full-screen overlay when session is permanently locked |
| `CompletionSummary`   | Final screen with integrity score and signal summary   |
