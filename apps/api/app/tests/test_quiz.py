import pytest

from app.services import quiz_service as Q


def test_generate_returns_requested_count():
    qs = Q.generate_quiz("dsa", count=3, seed=1)
    assert len(qs) == 3
    assert all({"id", "topic", "question", "options"} <= set(q) for q in qs)


def test_generate_hides_answers():
    qs = Q.generate_quiz("dbms", count=4, seed=2)
    for q in qs:
        assert "answer" not in q and "a" not in q
        assert len(q["options"]) >= 2


def test_slug_aliases_and_fallback():
    assert Q._slug("Algorithms") == "dsa"
    assert Q._slug("Operating Systems") == "os"
    assert Q._slug("something unknown") == "dsa"  # default bank


def test_grade_correct_and_incorrect():
    good = Q.grade("dsa:0", 1)   # correct index for the first dsa question is 1
    assert good["correct"] is True and good["score"] == 1.0
    bad = Q.grade("dsa:0", 0)
    assert bad["correct"] is False and bad["score"] == 0.0


def test_grade_rejects_bad_id():
    with pytest.raises(ValueError):
        Q.grade("nonsense", 0)


def test_topics_below_threshold():
    rows = [
        {"topic": "dp", "attempts": 3, "accuracy": 0.3},
        {"topic": "greedy", "attempts": 3, "accuracy": 0.9},
        {"topic": "graphs", "attempts": 1, "accuracy": 0.0},  # too few attempts
    ]
    assert Q.topics_below(rows) == ["dp"]
