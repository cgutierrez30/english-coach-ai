# CLAUDE.md — English Coach AI

This document orients AI agents and developers working on the codebase.

## Product summary

English Coach AI is a scenario-based English tutor. Learners pick a real-life situation, converse with an in-character Claude partner, and receive rubric-scored feedback. Progress is stored per user in SQLite (PostgreSQL-ready via `DATABASE_URL`).

## Repository layout

```
backend/
  main.py              FastAPI app, CORS, routers, /transcribe
  config.py            pydantic-settings from .env
  database.py          SQLAlchemy engine, SessionLocal, init_db
  models/              User, Session, Evaluation ORM models
  scenarios/
    scenario_registry.py   Loads JSON from library/
    controller.py          ScenarioController (prompts, replies, goals)
    library/*.json           Scenario definitions
  rubric/
    schema.py            RubricDimension, RubricSchema
    evaluator.py         RubricEvaluator (Claude JSON scoring)
    feedback.py            FeedbackGenerator
  api/
    sessions.py          /scenarios, /sessions, messages, end
    evaluation.py        /sessions/{id}/evaluate
    progress.py          /progress/{user_id}
  tests/                 pytest suites

frontend/
  src/App.jsx            Tab shell: practice vs progress
  components/            UI modules
  hooks/useSession.js    Session state + API calls
  hooks/useVoiceInput.js Web Speech recognition + TTS
  api/client.js          fetch wrapper via /api proxy
```

## Key conventions

### Conversation history format

Every message is `{"role": "user" | "assistant", "content": "..."}`. The opening assistant line is stored when a session starts.

### Scenario JSON contract

Each file in `backend/scenarios/library/` must include: `id`, `title`, `description`, `difficulty`, `context`, `opening_line`, `goal_state` (list), `success_criteria`, `rubric_weights` (four keys summing to ~1.0).

### Rubric dimensions

Fixed set of four (scores 1–5):

1. `task_completion`
2. `communicative_appropriateness`
3. `fluency`
4. `vocabulary_range`

`RubricSchema.overall_score` is a weighted average using scenario `rubric_weights`.

### LLM integration

- **Model**: `claude-sonnet-4-20250514` via `anthropic` SDK (`config.settings.anthropic_model`)
- **ScenarioController**: system prompt from scenario; `get_next_response` uses Claude messages API; `check_goal_completion` asks Claude for JSON `all_goals_met`
- **RubricEvaluator** / **FeedbackGenerator**: single-turn prompts expecting JSON; regex extraction fallback
- **Without API key**: heuristic scoring and template feedback so local dev/tests work

### Database

- `User`: `id`, `display_name`
- `Session`: conversation JSON string, `goals_completed`, `status` (`active` | `completed`)
- `Evaluation`: one per session, stores rubric + feedback JSON

Run `init_db()` on app startup (`main.py` lifespan).

### API flow

1. `POST /sessions` — create user if needed, seed history with `opening_line`
2. `POST /sessions/{id}/message` — append user message, Claude reply, update goals
3. `POST /sessions/{id}/end` — mark completed
4. `POST /sessions/{id}/evaluate` — rubric + feedback, persist `Evaluation`
5. `GET /progress/{user_id}` — aggregates sessions and scores

### Frontend

- User ID persisted in `localStorage` (`english_coach_user_id`)
- Vite proxies `/api` → `http://127.0.0.1:8000`
- TTS: `speechSynthesis` on new assistant messages
- STT: `webkitSpeechRecognition` in `useVoiceInput`

## Development commands

```bash
# Backend (from backend/)
uvicorn main:app --reload --port 8000
pytest -v

# Frontend (from frontend/)
npm run dev
npm run build
```

## Testing notes

- `test_scenario_controller.py` — prompt content, opening line, heuristic goals
- `test_rubric_evaluator.py` — weighted scores, heuristic evaluate
- `test_api.py` — full HTTP flow with TestClient (drops/recreates tables)

Run pytest with `backend` as cwd (`pytest.ini` sets `pythonpath = .`).

## Extension points

- Add scenarios: new JSON in `library/`, auto-loaded by registry
- Swap DB: set `DATABASE_URL` to PostgreSQL; remove SQLite `connect_args` logic if needed
- Auth: wire `SECRET_KEY` into JWT middleware; attach `user_id` from token instead of client-supplied UUID

## Do not

- Break the four-dimension rubric without updating evaluator prompts, schema, and frontend labels
- Store API keys in the repo
- Remove heuristic fallbacks without ensuring CI has test API keys
