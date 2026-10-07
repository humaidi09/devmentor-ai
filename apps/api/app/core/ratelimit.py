"""Shared SlowAPI rate limiter (used by main app + rate-limited routes)."""
from __future__ import annotations

from slowapi import Limiter
from slowapi.util import get_remote_address

# Default generous cap; specific routes (chat, CP sync) tighten this.
limiter = Limiter(key_func=get_remote_address, default_limits=["240/minute"])
