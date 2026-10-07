# API Reference

Base URL: `http://localhost:8000` (local) · interactive docs at `/docs`.

**Auth:** send `Authorization: Bearer <supabase-access-token>`. In demo mode the
header is optional and a fixed demo user is used.

**Errors:** consistent envelope
```json
{ "error": { "code": 404, "message": "Task not found." } }
```

**Pagination:** list endpoints accept `?limit=` (1–100, default 20) and
`?offset=` and return `{ items, limit, offset, count }`.

## Health
| Method | Path | Notes |
|---|---|---|
| GET | `/health` | status, mode flags |
| GET | `/` | service info |

## Profile
| Method | Path | Notes |
|---|---|---|
| GET | `/api/me` | current profile (auto-created if missing) |
| PATCH | `/api/me` | update profile / onboarding fields |
| DELETE | `/api/me?confirm=true` | **privacy:** delete all personal data |

## Dashboard
| GET | `/api/dashboard` | today's tasks, deadlines, streak, totals, CP progress, weak areas |

## Courses
`GET /api/courses` · `POST /api/courses` · `PATCH /api/courses/{id}` · `DELETE /api/courses/{id}`

## Deadlines
`GET /api/deadlines` · `POST /api/deadlines` · `PATCH /api/deadlines/{id}` · `DELETE /api/deadlines/{id}`

## Tasks
| Method | Path | Notes |
|---|---|---|
| GET | `/api/tasks?status=&task_type=` | list (filterable) |
| POST | `/api/tasks` | create |
| PATCH | `/api/tasks/{id}` | update |
| DELETE | `/api/tasks/{id}` | delete |
| POST | `/api/tasks/{id}/complete` | `{completion_note?, actual_minutes?}` |
| POST | `/api/tasks/{id}/skip` | `{skip_reason?}` |
| POST | `/api/tasks/{id}/reschedule` | `{scheduled_start, scheduled_end?}` |
| GET | `/api/tasks/recovery-options` | compassionate recovery choices |
| POST | `/api/tasks/{id}/recover` | `{action: move_tomorrow\|move_weekend\|reduce_scope\|skip}` |
| POST | `/api/tasks/generate-daily` | `{date?, replace_existing?}` |
| POST | `/api/tasks/generate-weekly-plan` | 7-day plan |

## Chat (rate-limited 20/min)
`POST /api/chat` → `{message, conversation_id?, language?}`
Response: `{answer, intent, conversation_id, actions_taken, suggested_actions, links, mocked}`

## Developer tools (rate-limited 15/min)
| Method | Path | Notes |
|---|---|---|
| POST | `/api/review` | `{code, language, want_rewrite?}` → Markdown review with sections (What's good / Likely bugs / Complexity / Security / Readability / Suggested tests) |
| POST | `/api/roadmap` | `{idea, stack_preference?}` → Markdown plan (Requirements / Stack / Folder structure / API design / DB entities / Milestones / Deployment checklist) |

Both return `{..., mocked}` and fall back to a clearly-labelled section skeleton when no Gemini key is set.

## Codeforces
| Method | Path | Notes |
|---|---|---|
| GET | `/api/cp/profile` | public profile summary |
| POST | `/api/cp/sync` | fetch live stats (rate-limited) |
| GET/POST | `/api/cp/preferences` | read / upsert |
| GET | `/api/cp/recommendations` | list |
| POST | `/api/cp/recommendations/generate` | morning+evening picks (rate-limited) |
| PATCH | `/api/cp/recommendations/{id}` | `{status}` |
| GET | `/api/cp/contests` | upcoming contests |

## Snippets
| Method | Path | Notes |
|---|---|---|
| GET | `/api/snippets?q=&language=&category=&tags=&visibility=` | search (public + own) |
| GET | `/api/snippets/{id}` | detail |
| POST | `/api/snippets` | create (private) |
| PATCH | `/api/snippets/{id}` | update own |
| DELETE | `/api/snippets/{id}` | delete own |
| POST | `/api/snippets/{id}/copy-event` | usage counter |

## Focus
`POST /api/focus/start` `{task_id?}` · `POST /api/focus/stop` `{session_id, notes?}`

## Notifications
| Method | Path | Notes |
|---|---|---|
| GET | `/api/notifications?unread_only=` | list |
| POST | `/api/notifications/{id}/read` | mark read |
| GET/PATCH | `/api/notifications/preferences` | read / update |
| POST | `/api/notifications/subscribe` | `{token, platform}` web-push token |

## Analytics
`GET /api/analytics/weekly?week=YYYY-MM-DD` · `GET /api/analytics/topics`

## Quiz (feeds weak-topic detection)
| Method | Path | Notes |
|---|---|---|
| POST | `/api/quiz/generate` | `{topic, count?, seed?}` → questions **without** answers |
| POST | `/api/quiz/attempt` | `{topic, question_id, answer_index}` → grade + explanation |
| GET | `/api/quiz/history` | recent attempts |

Topics: `dsa`, `dbms`, `os`, `networks`, `python`, `sql` (aliases accepted).

## Internal cron (secured by `x-cron-secret`)
`POST /internal/cron/daily-planning` · `POST /internal/cron/send-notifications` ·
`POST /internal/cron/weekly-summary`
