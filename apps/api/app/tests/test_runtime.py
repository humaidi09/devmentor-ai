from app.core.config import Settings
from app.core.config import get_settings


def test_missing_live_configuration_fails_closed(client):
    settings = Settings(_env_file=None, demo_mode=False, supabase_url=None,
                        supabase_anon_key=None, supabase_service_role_key=None)
    old = get_settings().demo_mode
    current = get_settings()
    saved = (current.supabase_url, current.supabase_anon_key, current.supabase_service_role_key)
    try:
        current.demo_mode = False
        current.supabase_url = current.supabase_anon_key = current.supabase_service_role_key = None
        assert not settings.effective_demo_mode
        assert client.get("/api/me").status_code == 503
    finally:
        current.demo_mode = old
        current.supabase_url, current.supabase_anon_key, current.supabase_service_role_key = saved


def test_asymmetric_auth_does_not_require_legacy_jwt_secret():
    settings = Settings(_env_file=None, demo_mode=False, supabase_url="https://example.supabase.co",
                        supabase_anon_key="test", supabase_service_role_key="test",
                        supabase_jwt_secret=None)
    assert settings.supabase_configured
    assert not settings.effective_demo_mode
