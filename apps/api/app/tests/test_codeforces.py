from app.services.codeforces_client import (
    contest_reminder_payloads,
    filter_problems,
    post_contest_upsolve,
    problems_from_submissions,
    solved_problem_keys,
)


def test_solved_problem_keys_only_accepted():
    subs = [
        {"verdict": "OK", "problem": {"contestId": 1, "index": "A"}},
        {"verdict": "WRONG_ANSWER", "problem": {"contestId": 1, "index": "B"}},
    ]
    assert solved_problem_keys(subs) == {"1-A"}


def test_filter_problems_band_and_exclusions():
    problems = [
        {"contestId": 1, "index": "A", "rating": 800, "tags": ["greedy"]},
        {"contestId": 1, "index": "B", "rating": 900, "tags": ["dp"]},
        {"contestId": 2, "index": "A", "rating": 1200, "tags": ["math"]},
        {"contestId": 3, "index": "A", "rating": 850, "tags": ["greedy", "math"]},
    ]
    out = filter_problems(
        problems, min_rating=800, max_rating=1000,
        solved_keys={"1-A"}, preferred_tags=["greedy"], limit=10,
    )
    keys = [f"{p['contestId']}-{p['index']}" for p in out]
    assert "1-A" not in keys          # solved
    assert "2-A" not in keys          # out of rating band
    assert keys[0] == "3-A"           # preferred-tag match ranked first


def test_filter_problems_excludes_already_recommended():
    problems = [{"contestId": 5, "index": "A", "rating": 900, "tags": []}]
    out = filter_problems(problems, min_rating=800, max_rating=1000,
                          solved_keys=set(), exclude_keys={"5-A"})
    assert out == []


def test_contest_reminder_within_window():
    now = 1_000_000
    contests = [
        {"id": 1, "name": "Round A", "startTimeSeconds": now + 1800},   # in 30 min -> remind
        {"id": 2, "name": "Round B", "startTimeSeconds": now + 7200},   # in 2h -> no
        {"id": 3, "name": "Round C", "startTimeSeconds": now - 60},     # started -> no
        {"id": 4, "name": "No time"},                                   # missing -> no
    ]
    payloads = contest_reminder_payloads(contests, now, window_seconds=3600)
    assert len(payloads) == 1
    assert payloads[0]["contest_id"] == 1
    assert payloads[0]["minutes_until"] == 30


def test_post_contest_upsolve_sorts_unsolved_easiest_first():
    submissions = [
        {"verdict": "OK", "problem": {"contestId": 10, "index": "A", "rating": 800, "tags": ["math"]}},
        {"verdict": "WRONG_ANSWER", "problem": {"contestId": 10, "index": "C", "rating": 1500, "tags": ["dp"]}},
        {"verdict": "WRONG_ANSWER", "problem": {"contestId": 10, "index": "B", "rating": 1200, "tags": ["greedy"]}},
        {"verdict": "OK", "problem": {"contestId": 99, "index": "A", "rating": 800}},  # other contest
    ]
    upsolve = post_contest_upsolve(submissions, contest_id=10)
    assert [p["index"] for p in upsolve] == ["B", "C"]  # A solved, other contest ignored
    asserted = problems_from_submissions(submissions, contest_id=10)
    assert {p["index"] for p in asserted} == {"A", "B", "C"}
