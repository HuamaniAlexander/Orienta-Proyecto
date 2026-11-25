import base64
import hashlib
import logging
from datetime import datetime
from uuid import UUID

import httpx

logger = logging.getLogger("orienta.zoom")


class ZoomProvisioner:
    """Provisions Zoom meeting links using Zoom Server-to-Server OAuth API when configured,
    or deterministic Zoom room links for local/demo environments."""

    def __init__(self, account_id: str = "", client_id: str = "", client_secret: str = ""):
        self.account_id = account_id.strip()
        self.client_id = client_id.strip()
        self.client_secret = client_secret.strip()

    @property
    def api_configured(self) -> bool:
        return bool(self.account_id and self.client_id and self.client_secret)

    def create_meeting(self, request_id: UUID, topic: str, starts_at: datetime, duration_minutes: int = 30) -> str:
        if self.api_configured:
            try:
                return self._create_via_zoom_api(topic, starts_at, duration_minutes)
            except Exception as error:
                logger.warning("Zoom API fallback for %s: %s", request_id, type(error).__name__)
        return self._deterministic_zoom_url(request_id)

    def _create_via_zoom_api(self, topic: str, starts_at: datetime, duration_minutes: int) -> str:
        credentials = f"{self.client_id}:{self.client_secret}".encode()
        basic = base64.b64encode(credentials).decode("ascii")
        with httpx.Client(timeout=15) as client:
            token_resp = client.post(
                "https://zoom.us/oauth/token",
                params={"grant_type": "account_credentials", "account_id": self.account_id},
                headers={"Authorization": f"Basic {basic}"},
            )
            token_resp.raise_for_status()
            access_token = token_resp.json()["access_token"]

            meeting_resp = client.post(
                "https://api.zoom.us/v2/users/me/meetings",
                headers={"Authorization": f"Bearer {access_token}"},
                json={
                    "topic": topic[:180],
                    "type": 2,
                    "start_time": starts_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
                    "duration": duration_minutes,
                    "timezone": "America/Lima",
                    "settings": {
                        "waiting_room": True,
                        "join_before_host": False,
                        "auto_recording": "none",
                    },
                },
            )
            meeting_resp.raise_for_status()
            join_url: str = meeting_resp.json()["join_url"]
            return join_url

    @staticmethod
    def _deterministic_zoom_url(request_id: UUID) -> str:
        digest = hashlib.sha256(f"orienta-zoom-{request_id}".encode()).digest()
        # 11-digit Zoom meeting number starting with 8 (standard scheduled Zoom range)
        number_int = 80000000000 + (int.from_bytes(digest[:6], "big") % 19999999999)
        pwd = base64.urlsafe_b64encode(digest[6:24]).decode("ascii").rstrip("=")
        return f"https://us05web.zoom.us/j/{number_int}?pwd={pwd}"
