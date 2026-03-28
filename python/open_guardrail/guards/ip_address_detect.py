"""Detect IP addresses (v4 and v6)."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_IPV4 = re.compile(
    r"\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}"
    r"(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b"
)
_IPV6 = re.compile(
    r"\b(?:[0-9a-fA-F]{1,4}:){7}"
    r"[0-9a-fA-F]{1,4}\b"
)


def _is_private(ip: str) -> bool:
    if ip in ("127.0.0.1", "0.0.0.0"):
        return True
    if ip.startswith("10."):
        return True
    if ip.startswith("192.168."):
        return True
    if re.match(r"^172\.(1[6-9]|2\d|3[01])\.", ip):
        return True
    if ip == "::1":
        return True
    return False


class _IpAddressDetect:
    def __init__(
        self,
        *,
        action: str = "block",
        allow_private: bool = True,
    ) -> None:
        self.name = "ip-address-detect"
        self.action = action
        self.allow_private = allow_private

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        v4 = _IPV4.findall(text)
        v6 = _IPV6.findall(text)
        all_ips = v4 + v6

        if self.allow_private:
            all_ips = [
                ip for ip in all_ips
                if not _is_private(ip)
            ]

        triggered = len(all_ips) > 0
        score = (
            min(len(all_ips) / 3, 1.0)
            if triggered
            else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="ip-address-detect",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "IP address detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"ip_count": len(all_ips)}
                if triggered
                else None
            ),
        )


def ip_address_detect(
    *,
    action: str = "block",
    allow_private: bool = True,
) -> _IpAddressDetect:
    return _IpAddressDetect(
        action=action, allow_private=allow_private
    )
