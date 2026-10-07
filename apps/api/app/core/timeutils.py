"""Timezone-safe helpers. All stored timestamps are UTC; we convert to the
user's IANA timezone (e.g. 'Asia/Dhaka') only for scheduling/display logic."""
from __future__ import annotations

from datetime import date, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError


def get_tz(tz_name: str | None) -> ZoneInfo:
    try:
        return ZoneInfo(tz_name or "UTC")
    except (ZoneInfoNotFoundError, ValueError):
        return ZoneInfo("UTC")


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def to_user_tz(dt: datetime, tz_name: str | None) -> datetime:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(get_tz(tz_name))


def user_now(tz_name: str | None) -> datetime:
    return utc_now().astimezone(get_tz(tz_name))


def day_bounds_utc(tz_name: str | None, on: date | None = None) -> tuple[datetime, datetime]:
    """UTC [start, end) covering the given local calendar day (today by default)."""
    tz = get_tz(tz_name)
    local_day = on or user_now(tz_name).date()
    start_local = datetime.combine(local_day, time.min, tzinfo=tz)
    end_local = start_local + timedelta(days=1)
    return start_local.astimezone(timezone.utc), end_local.astimezone(timezone.utc)


def parse_hhmm(value: str | None) -> time | None:
    if not value:
        return None
    try:
        hh, mm = value.split(":")
        return time(int(hh), int(mm))
    except (ValueError, AttributeError):
        return None


def in_quiet_hours(local_dt: datetime, start: str | None, end: str | None) -> bool:
    """Quiet hours may wrap midnight (e.g. 23:00 -> 07:00)."""
    s, e = parse_hhmm(start), parse_hhmm(end)
    if s is None or e is None:
        return False
    now_t = local_dt.time()
    if s <= e:
        return s <= now_t < e
    return now_t >= s or now_t < e  # wraps midnight


def combine_local_to_utc(on: date, hhmm: str, tz_name: str | None) -> datetime:
    """Combine a local date + 'HH:MM' into a UTC datetime."""
    t = parse_hhmm(hhmm) or time(0, 0)
    local = datetime.combine(on, t, tzinfo=get_tz(tz_name))
    return local.astimezone(timezone.utc)


def week_start(on: date) -> date:
    """Most recent Monday on/before `on`."""
    return on - timedelta(days=on.weekday())
