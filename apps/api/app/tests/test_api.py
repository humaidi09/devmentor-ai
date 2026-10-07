"""Integration tests against the live app in demo mode (no secrets)."""


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["demo_mode"] is True


def test_get_me_returns_demo_profile(client):
    r = client.get("/api/me")
    assert r.status_code == 200
    assert r.json()["display_name"] == "Demo Student"


def test_update_me(client):
    r = client.patch("/api/me", json={"display_name": "Ada", "current_level": "intermediate"})
    assert r.status_code == 200
    assert r.json()["display_name"] == "Ada"
    assert r.json()["current_level"] == "intermediate"


def test_task_crud_and_complete(client):
    created = client.post("/api/tasks", json={"title": "Learn DP", "task_type": "study"})
    assert created.status_code == 201
    task_id = created.json()["id"]

    listed = client.get("/api/tasks")
    assert listed.status_code == 200
    assert any(t["id"] == task_id for t in listed.json()["items"])

    done = client.post(f"/api/tasks/{task_id}/complete", json={"completion_note": "done"})
    assert done.status_code == 200
    assert done.json()["status"] == "completed"


def test_update_missing_task_404(client):
    r = client.patch("/api/tasks/does-not-exist", json={"title": "x"})
    assert r.status_code == 404


def test_task_recovery_options(client):
    r = client.get("/api/tasks/recovery-options")
    assert r.status_code == 200
    actions = {o["action"] for o in r.json()["options"]}
    assert {"move_tomorrow", "reduce_scope", "skip"}.issubset(actions)


def test_snippet_search(client):
    r = client.get("/api/snippets", params={"q": "comprehension", "language": "python"})
    assert r.status_code == 200
    items = r.json()["items"]
    assert len(items) >= 1
    assert all(i["language"] == "python" for i in items)


def test_create_private_snippet(client):
    r = client.post("/api/snippets", json={
        "title": "My helper", "language": "python", "category": "Python",
        "code": "print('hi')", "tags": ["demo"],
    })
    assert r.status_code == 201
    assert r.json()["is_owner"] is True
    assert r.json()["visibility"] == "private"


def test_chat_is_mocked_without_key(client):
    r = client.post("/api/chat", json={"message": "Explain binary search"})
    assert r.status_code == 200
    body = r.json()
    assert body["mocked"] is True
    assert body["intent"] in {"chat_explain", "snippet_lookup"}


def test_cp_generate_demo_recommendations(client):
    r = client.post("/api/cp/recommendations/generate")
    assert r.status_code == 200
    items = r.json()["items"]
    assert len(items) == 4  # 2 per session x 2 sessions
    assert all(i["problem_url"].startswith("https://codeforces.com/") for i in items)


def test_dashboard_shape(client):
    r = client.get("/api/dashboard")
    assert r.status_code == 200
    body = r.json()
    for key in ("tasks", "task_summary", "streak_days", "cp_progress", "upcoming_deadlines"):
        assert key in body


def test_chat_conversation_continuity(client):
    first = client.post("/api/chat", json={"message": "Explain recursion"}).json()
    conv = first["conversation_id"]
    assert conv  # a conversation is created and returned
    second = client.post(
        "/api/chat",
        json={"message": "now give a tiny example", "conversation_id": conv},
    )
    assert second.status_code == 200
    assert second.json()["conversation_id"] == conv


def test_quiz_generate_and_attempt(client):
    gen = client.post("/api/quiz/generate", json={"topic": "dsa", "count": 2})
    assert gen.status_code == 200
    questions = gen.json()
    assert len(questions) == 2
    assert "answer" not in questions[0]

    # Grade a known question, then confirm it lands in history.
    attempt = client.post(
        "/api/quiz/attempt",
        json={"topic": "dsa", "question_id": questions[0]["id"], "answer_index": 1},
    )
    assert attempt.status_code == 200
    assert "correct" in attempt.json()

    hist = client.get("/api/quiz/history")
    assert hist.status_code == 200
    assert hist.json()["count"] >= 1


def test_quiz_rejects_bad_question_id(client):
    r = client.post(
        "/api/quiz/attempt",
        json={"topic": "dsa", "question_id": "nonsense", "answer_index": 0},
    )
    assert r.status_code == 400


def test_generate_daily_includes_weak_topic_revision(client):
    # Two wrong answers on a topic should add a "Revise:" task.
    for _ in range(2):
        client.post(
            "/api/quiz/attempt",
            json={"topic": "dsa", "question_id": "dsa:0", "answer_index": 0},  # index 0 is wrong
        )
    r = client.post("/api/tasks/generate-daily", json={})
    assert r.status_code == 200
    titles = [t["title"] for t in r.json()["items"]]
    assert any(t.startswith("Revise:") for t in titles)


def test_cron_requires_secret(client):
    assert client.post("/internal/cron/daily-planning").status_code == 401
    ok = client.post("/internal/cron/daily-planning", headers={"x-cron-secret": "test-secret"})
    assert ok.status_code == 200
    assert "users" in ok.json()
