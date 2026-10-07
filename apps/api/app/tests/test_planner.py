from datetime import date, datetime, timezone

from app.services import planner_service as P


def _profile():
    return {"timezone": "UTC", "available_schedule": {"mon": [{"start": "09:00", "end": "12:00"}]}}


def _cp_prefs():
    return {
        "notifications_enabled": True, "problems_per_session": 2,
        "morning_time": "10:00", "evening_time": "20:00",
        "min_rating": 800, "max_rating": 1200, "preferred_tags": ["greedy"],
    }


def test_prioritize_tasks_orders_by_priority():
    tasks = [{"priority": 2, "scheduled_start": None}, {"priority": 5, "scheduled_start": None}]
    ordered = P.prioritize_tasks(tasks)
    assert ordered[0]["priority"] == 5


def test_build_daily_plan_respects_available_minutes():
    plan = P.build_daily_plan(
        profile=_profile(), deadlines=[], cp_prefs=_cp_prefs(),
        on_date=date(2024, 6, 3),  # Monday
    )
    assert plan, "plan should not be empty"
    cp_tasks = [t for t in plan if t["task_type"] == "cp"]
    study = [t for t in plan if t["task_type"] == "study"]
    assert len(cp_tasks) == 2  # morning + evening
    assert sum(t["estimated_minutes"] for t in study) <= 180  # within the 3h window


def test_build_daily_plan_prefers_urgent_deadline():
    now = datetime(2024, 6, 3, 8, 0, tzinfo=timezone.utc)
    deadlines = [{
        "id": "d1", "title": "DBMS exam", "status": "pending", "priority": 5,
        "due_at": datetime(2024, 6, 4, 9, 0, tzinfo=timezone.utc).isoformat(),
    }]
    plan = P.build_daily_plan(profile=_profile(), deadlines=deadlines,
                              cp_prefs=None, on_date=date(2024, 6, 3), now=now)
    study = [t for t in plan if t["task_type"] == "study"]
    assert any("DBMS exam" in t["title"] for t in study)


def test_recovery_skip():
    patch = P.apply_recovery({"status": "pending"}, "skip")
    assert patch["status"] == "skipped"


def test_recovery_reduce_scope_halves_estimate():
    patch = P.apply_recovery({"estimated_minutes": 60}, "reduce_scope")
    assert patch["estimated_minutes"] == 30
    assert patch["status"] == "pending"


def test_recovery_move_tomorrow_shifts_a_day():
    start = datetime(2024, 6, 3, 9, 0, tzinfo=timezone.utc)
    patch = P.apply_recovery({"scheduled_start": start.isoformat()}, "move_tomorrow")
    assert patch["scheduled_start"].startswith("2024-06-04")
    assert patch["status"] == "rescheduled"


def test_recovery_unknown_action_raises():
    import pytest
    with pytest.raises(ValueError):
        P.apply_recovery({}, "teleport")
