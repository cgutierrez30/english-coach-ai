# English Coach AI

Scenario-based English language learning through realistic conversations. Practice ordering food, calling a school, or scheduling appointments—then receive rubric-based LLM feedback across four dimensions and track progress over time.

## Motivation

Traditional language apps often drill vocabulary in isolation. Real fluency requires navigating **situated conversations** with unclear expectations, follow-up questions, and social norms. English Coach AI simulates those moments and scores performance with a transparent rubric so learners know what to improve next.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     React + Tailwind (Vite)                      │
│  ScenarioSelector │ ConversationView │ EvaluationReport        │
│  ProgressDashboard │ useVoiceInput (Web Speech) │ useSession     │
└────────────────────────────┬────────────────────────────────────┘
                             │ REST /api proxy
┌────────────────────────────▼────────────────────────────────────┐
│                      FastAPI Backend                             │
│  ┌──────────────┐  ┌─────────────────┐  ┌──────────────────────┐ │
│  │ Sessions API │  │ ScenarioController│  │ RubricEvaluator    │ │
│  │ Progress API │  │ + JSON library   │  │ + FeedbackGenerator │ │
│  │ Evaluation   │  └────────┬─────────┘  └──────────┬─────────┘ │
│  └──────┬───────┘           │                       │           │
│         │                   Claude API              Claude API   │
│         ▼                                                        │
│  ┌──────────────┐     ┌──────────────┐                            │
│  │ SQLAlchemy   │     │ Whisper STT  │ (optional upload)          │
│  │ SQLite / PG  │     │ OpenAI API   │                            │
│  └──────────────┘     └──────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

## Features

- **3 practice scenarios**: restaurant order, school absence call, doctor appointment
- **In-character AI partner** powered by Claude (`claude-sonnet-4-20250514`)
- **Goal tracking** per scenario with LLM-based completion checks
- **4-dimension rubric** (1–5): task completion, communicative appropriateness, fluency, vocabulary range
- **Structured feedback**: summary, strengths, improvements, examples, next steps
- **Progress dashboard** across sessions and scenarios
- **Voice input** via browser Web Speech API; **TTS** for assistant replies
- **Whisper transcription** endpoint for audio uploads (optional)

## Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- [Anthropic API key](https://console.anthropic.com/) (required for conversation + evaluation)
- [OpenAI API key](https://platform.openai.com/) (optional; needed for Whisper upload only)

### Backend

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
cp ../.env.example ../.env
# Edit .env with your keys

uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The Vite dev server proxies `/api` to the backend.

### Environment variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Claude API for role-play and rubric evaluation |
| `OPENAI_API_KEY` | Whisper transcription (optional) |
| `DATABASE_URL` | Default `sqlite:///./dev.db` |
| `SECRET_KEY` | App secret placeholder for future auth |

## Running tests

```bash
cd backend
pip install -r requirements.txt
pytest -v
```

Tests use heuristic fallbacks when API keys are absent.

## Project structure

See [CLAUDE.md](CLAUDE.md) for architecture details aimed at AI agents and contributors.

## Roadmap

- [ ] User authentication and persistent profiles
- [ ] PostgreSQL deployment configuration
- [ ] Additional scenarios and difficulty levels
- [ ] Pronunciation scoring
- [ ] Spaced repetition for weak rubric dimensions
- [ ] Teacher/admin dashboard

## License

MIT
