"""Test fixtures. Force demo mode so the whole API runs in-memory, no secrets."""
import os

os.environ.setdefault("DEMO_MODE", "true")
os.environ.setdefault("CRON_SECRET", "test-secret")
os.environ.setdefault("SUPABASE_URL", "")
os.environ.setdefault("GEMINI_API_KEY", "")

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.core.store import reset_memory_store  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(autouse=True)
def _fresh_store():
    """Each test starts from a clean demo dataset."""
    reset_memory_store()
    yield
    reset_memory_store()


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)
