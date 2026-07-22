# Career PathFinder

Personalized AI career roadmaps. FastAPI + React + PostgreSQL + Redis + Gemini.

## Structure

```
career-pathfinder/
├── backend/    FastAPI (async), SQLAlchemy async, JWT auth, Gemini structured JSON
└── frontend/   React + Vite + Tailwind + Lucide + Axios
```

## Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in GEMINI_API_KEY, JWT_SECRET_KEY, DATABASE_URL, REDIS_URL
uvicorn app.main:app --reload --port 8000
```

Requires a running PostgreSQL and Redis instance. Tables are auto-created on startup.

### Endpoints

- `POST /api/v1/auth/signup` `{ email, password, full_name? }`
- `POST /api/v1/auth/login` `{ email, password }` → `{ access_token, user }`
- `POST /api/v1/roadmap/generate` (Bearer token) — assessment payload → generated roadmap
- `GET  /api/v1/roadmap` — list current user's roadmaps
- `GET  /api/v1/roadmap/{id}` — fetch a roadmap
- `DELETE /api/v1/roadmap/{id}` — delete

Gemini is called with `response_mime_type=application/json` and a `response_schema`, then
parsed with the `RoadmapPayload` Pydantic model — guaranteeing:

```json
{
  "target_role": "string",
  "skill_gap": ["string"],
  "milestones": [
    {
      "phase_title": "string",
      "duration": "string",
      "core_topics": ["string"],
      "free_resources": [{ "title": "string", "url": "string", "type": "course|article|video|book|project|docs|other" }]
    }
  ]
}
```

## Frontend

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173, proxies /api → http://localhost:8000
```

Pages:
- `/login` — sign in / sign up
- `/` — multi-step Assessment (skills tag input, interests tag input, goal dropdown)
- `/roadmap/:id` — interactive vertical timeline with progress toggles and resource links

## Notes

- All backend endpoints and DB operations are `async`.
- Redis powers a per-IP fixed-window rate limit (`RATE_LIMIT_PER_MINUTE`, default 30/min).
  Fails open if Redis is unavailable.
- JWTs are stored in `localStorage`; Axios interceptor injects `Authorization: Bearer` and
  redirects to `/login` on 401.
