import pytest
from fastapi import HTTPException
from app.services.gemini_service import GeminiService
from app.core.config import get_settings


@pytest.mark.parametrize('patch', [
    {'current_level': None}, {'available_schedule': {'mon': 'bad'}},
    {'timezone': 'not/a-zone'}, {'available_schedule': {'mon': [{'start': '11:00', 'end': '09:00'}]}},
])
def test_bad_profile_never_persists(client, patch):
    assert client.patch('/api/me', json=patch).status_code == 422
    assert client.get('/api/me').status_code == 200


def test_delete_includes_private_snippets(client):
    item = client.post('/api/snippets', json={'title': 'Mine', 'code': 'pass', 'language': 'python', 'category': 'Python'}).json()
    assert client.delete('/api/me?confirm=true').status_code == 200
    assert client.get('/api/snippets/' + item['id']).status_code == 404


def test_deadline_defaults(client):
    response = client.post('/api/deadlines', json={'title': 'Exam', 'type': 'exam', 'due_at': '2027-01-01T12:00:00+00:00'})
    assert response.status_code == 201
    assert response.json()['status'] == 'pending'


def test_provider_failure_does_not_become_mock(monkeypatch):
    class BrokenModel:
        def generate_content(self, *args, **kwargs):
            raise RuntimeError('sensitive upstream error')
    svc = GeminiService()
    monkeypatch.setattr(svc, '_ensure_model', lambda: BrokenModel())
    with pytest.raises(HTTPException) as error:
        svc.generate('hello')
    assert error.value.status_code == 502
    assert 'sensitive' not in error.value.detail


def test_planner_generation_is_repeatable(client):
    body = {'date': '2027-01-04T12:00:00+00:00'}
    first = client.post('/api/tasks/generate-daily', json=body).json()['items']
    second = client.post('/api/tasks/generate-daily', json=body).json()['items']
    assert first
    assert {t['id'] for t in first} == {t['id'] for t in second}
    task_id = first[0]['id']
    client.post(f'/api/tasks/{task_id}/complete', json={})
    client.post('/api/tasks/generate-daily', json={**body, 'replace_existing': True})
    tasks = client.get('/api/tasks?limit=100').json()['items']
    assert next(t for t in tasks if t['id'] == task_id)['status'] == 'completed'


def test_planner_no_overlaps():
    from datetime import date, datetime
    from app.services.planner_service import build_daily_plan
    rows = build_daily_plan(profile={'timezone': 'UTC', 'available_schedule': {'mon': [{'start': '09:00', 'end': '10:00'}]}},
                            deadlines=[], cp_prefs={'morning_time': '09:00', 'evening_time': '20:00'}, on_date=date(2027, 1, 4))
    assert sum(t['estimated_minutes'] for t in rows) <= 60
    for a, b in zip(rows, rows[1:]):
        assert datetime.fromisoformat(a['scheduled_end']) <= datetime.fromisoformat(b['scheduled_start'])


def test_disabled_notifications_are_not_delivered(client):
    from app.core.store import get_memory_store
    from app.core.security import DEMO_USER_ID
    store = get_memory_store()
    store.delete('notifications', [('user_id', 'eq', DEMO_USER_ID)])
    client.patch('/api/notifications/preferences', json={'in_app_enabled': False, 'daily_summary': False, 'cp_reminders': False})
    result = client.post('/internal/cron/daily-planning', headers={'x-cron-secret': 'test-secret'})
    assert result.json()['notifications'] == 0
    assert client.get('/api/notifications').json()['items'] == []


def test_focus_stop_is_idempotent_and_counts_active_time(client):
    from app.core.store import get_memory_store
    from datetime import datetime, timedelta, timezone
    session = client.post('/api/focus/start', json={}).json()
    get_memory_store().update('study_sessions', [('id', 'eq', session['id'])], {'started_at': (datetime.now(timezone.utc) - timedelta(minutes=30)).isoformat()})
    first = client.post('/api/focus/stop', json={'session_id': session['id'], 'active_seconds': 300}).json()
    second = client.post('/api/focus/stop', json={'session_id': session['id'], 'active_seconds': 1200}).json()
    assert first == second
    assert first['duration_minutes'] == 5
    assert client.get('/api/dashboard').json()['study_minutes_today'] >= 5


def test_conversation_history_and_ownership(client):
    from app.core.store import get_memory_store
    reply = client.post('/api/chat', json={'message': 'Explain recursion'}).json()
    cid = reply['conversation_id']
    history = client.get(f'/api/conversations/{cid}/messages').json()
    assert [m['role'] for m in history] == ['user', 'assistant']
    assert history[1]['mocked'] is True
    foreign = get_memory_store().insert('conversations', {'user_id': 'another-user', 'title': 'Private'})
    assert client.get(f"/api/conversations/{foreign['id']}/messages").status_code == 404
    assert client.post('/api/chat', json={'message': 'hello', 'conversation_id': foreign['id']}).status_code == 404


def test_weekly_replace_does_not_accumulate(client):
    body = {'date': '2027-01-04T12:00:00+00:00', 'replace_existing': True}
    assert client.post('/api/tasks/generate-weekly-plan', json=body).status_code == 200
    count = client.get('/api/tasks?limit=100').json()['count']
    assert client.post('/api/tasks/generate-weekly-plan', json=body).status_code == 200
    assert client.get('/api/tasks?limit=100').json()['count'] == count
