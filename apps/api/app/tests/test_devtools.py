def test_review_returns_structured_sections(client):
    r = client.post("/api/review", json={"code": "def f(x):\n  return x+1", "language": "python"})
    assert r.status_code == 200
    body = r.json()
    assert body["mocked"] is True  # no Gemini key in tests
    assert "## What's good" in body["review"]
    assert "## Security" in body["review"]


def test_review_rejects_empty_code(client):
    assert client.post("/api/review", json={"code": "", "language": "python"}).status_code == 422


def test_roadmap_returns_structured_sections(client):
    r = client.post("/api/roadmap", json={"idea": "A habit tracker for students"})
    assert r.status_code == 200
    body = r.json()
    assert body["mocked"] is True
    assert "## Requirements" in body["roadmap"]
    assert "## Deployment checklist" in body["roadmap"]
