"""Embed and verify invisible watermarks using zero-width characters."""

from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_ZWC_MAP = {
    "0": "\u200b",
    "1": "\u200c",
}

_ZWC_SET = set(_ZWC_MAP.values())


def _encode_watermark(watermark_id: str) -> str:
    binary = "".join(format(ord(c), "08b") for c in watermark_id)
    return "".join(_ZWC_MAP[b] for b in binary)


def _decode_watermark(text: str) -> str | None:
    bits: list[str] = []
    for ch in text:
        if ch == "\u200b":
            bits.append("0")
        elif ch == "\u200c":
            bits.append("1")
    if len(bits) < 8:
        return None
    usable = len(bits) - (len(bits) % 8)
    chars: list[str] = []
    for i in range(0, usable, 8):
        byte = "".join(bits[i : i + 8])
        chars.append(chr(int(byte, 2)))
    return "".join(chars) if chars else None


def _has_zwc(text: str) -> bool:
    return any(ch in _ZWC_SET for ch in text)


class _ContentWatermark:
    def __init__(
        self,
        *,
        action: str = "allow",
        watermark_id: str = "og",
        verify_only: bool = False,
    ) -> None:
        self.name = "content-watermark"
        self.action = action
        self.watermark_id = watermark_id
        self.verify_only = verify_only

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()

        if self.verify_only:
            return self._verify(text, start)
        return self._embed(text, start)

    def _verify(
        self, text: str, start: float
    ) -> GuardResult:
        decoded = _decode_watermark(text)
        has_wm = decoded is not None
        valid = decoded == self.watermark_id if has_wm else False
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="content-watermark",
            passed=valid,
            action="allow" if valid else self.action,
            score=1.0 if valid else 0.0,
            message=(
                None
                if valid
                else (
                    "Watermark missing or invalid"
                )
            ),
            latency_ms=round(elapsed, 2),
            details={
                "mode": "verify",
                "watermark_found": has_wm,
                "watermark_valid": valid,
            },
        )

    def _embed(
        self, text: str, start: float
    ) -> GuardResult:
        encoded = _encode_watermark(self.watermark_id)
        watermarked = text + encoded
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="content-watermark",
            passed=True,
            action="allow",
            score=0.0,
            message=None,
            latency_ms=round(elapsed, 2),
            details={
                "mode": "embed",
                "watermark_id": self.watermark_id,
            },
            override_text=watermarked,
        )


def content_watermark(
    *,
    action: str = "allow",
    watermark_id: str = "og",
    verify_only: bool = False,
) -> _ContentWatermark:
    return _ContentWatermark(
        action=action,
        watermark_id=watermark_id,
        verify_only=verify_only,
    )
