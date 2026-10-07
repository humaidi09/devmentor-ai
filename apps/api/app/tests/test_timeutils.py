from datetime import datetime, timezone

from app.core.timeutils import (
    day_bounds_utc,
    in_quiet_hours,
    to_user_tz,
    week_start,
)


def test_utc_to_dhaka_offset():
    utc = datetime(2024, 1, 1, 0, 0, tzinfo=timezone.utc)
    dhaka = to_user_tz(utc, "Asia/Dhaka")  # UTC+6
    assert dhaka.hour == 6
    assert dhaka.date().isoformat() == "2024-01-01"


def test_naive_datetime_treated_as_utc():
    naive = datetime(2024, 1, 1, 0, 0)
    dhaka = to_user_tz(naive, "Asia/Dhaka")
    assert dhaka.hour == 6


def test_invalid_timezone_falls_back_to_utc():
    utc = datetime(2024, 1, 1, 12, 0, tzinfo=timezone.utc)
    assert to_user_tz(utc, "Not/AZone").hour == 12


def test_quiet_hours_wrap_midnight():
    base = datetime(2024, 1, 1, tzinfo=timezone.utc)
    assert in_quiet_hours(base.replace(hour=2), "23:00", "07:00") is True
    assert in_quiet_hours(base.replace(hour=12), "23:00", "07:00") is False
    # Non-wrapping window
    assert in_quiet_hours(base.replace(hour=13), "09:00", "17:00") is True


def test_day_bounds_are_24h_apart():
    start, end = day_bounds_utc("Asia/Dhaka", datetime(2024, 6, 1).date())
    assert (end - start).total_seconds() == 24 * 3600


def test_week_start_is_monday():
    # 2024-06-05 is a Wednesday -> Monday is 2024-06-03
    assert week_start(datetime(2024, 6, 5).date()).isoformat() == "2024-06-03"
