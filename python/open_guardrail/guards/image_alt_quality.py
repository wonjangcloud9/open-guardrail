"""Detect low-quality image alt-text or descriptions."""
from __future__ import annotations

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_ALT_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r'alt=["\']([^"\']*)["\']', re.IGNORECASE),
    re.compile(r"alt\s+text:\s*(.+?)(?:\n|$)", re.IGNORECASE),
    re.compile(
        r"image\s+description:\s*(.+?)(?:\n|$)",
        re.IGNORECASE,
    ),
    re.compile(
        r"describes\s+image:\s*(.+?)(?:\n|$)",
        re.IGNORECASE,
    ),
    re.compile(r"\[image\]\s*(.+?)(?:\n|$)", re.IGNORECASE),
    re.compile(r"!\[([^\]]*)\]"),
]

_GENERIC: list[re.Pattern[str]] = [
    re.compile(r"^an?\s+image$", re.IGNORECASE),
    re.compile(r"^an?\s+photo$", re.IGNORECASE),
    re.compile(r"^picture$", re.IGNORECASE),
    re.compile(r"^screenshot$", re.IGNORECASE),
    re.compile(r"^image$", re.IGNORECASE),
    re.compile(r"^photo$", re.IGNORECASE),
    re.compile(
        r"^photo\s+of\s+something$", re.IGNORECASE
    ),
    re.compile(r"^an?\s+picture$", re.IGNORECASE),
    re.compile(r"^img$", re.IGNORECASE),
    re.compile(r"^untitled$", re.IGNORECASE),
    re.compile(r"^placeholder$", re.IGNORECASE),
]

_FILE_EXT = re.compile(r"^\S+\.\w{2,4}$")


def _extract_alts(text: str) -> List[str]:
    results: List[str] = []
    for pat in _ALT_PATTERNS:
        for m in pat.finditer(text):
            if m.group(1) is not None:
                results.append(m.group(1).strip())
    return results


class _ImageAltQuality:
    def __init__(
        self, *, action: str = "warn", min_length: int = 10
    ) -> None:
        self.name = "image-alt-quality"
        self.action = action
        self._min_length = min_length

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        alts = _extract_alts(text)

        if not alts:
            elapsed = (time.perf_counter() - start) * 1000
            return GuardResult(
                guard_name="image-alt-quality",
                passed=True,
                action="allow",
                latency_ms=round(elapsed, 2),
            )

        issues: List[str] = []
        for alt in alts:
            if not alt:
                issues.append("Empty alt text")
                continue
            if len(alt) < self._min_length:
                issues.append(f'Alt text too short: "{alt}"')
                continue
            if any(p.match(alt) for p in _GENERIC):
                issues.append(f'Generic alt text: "{alt}"')
                continue
            if _FILE_EXT.match(alt):
                issues.append(
                    f'Filename as alt text: "{alt}"'
                )
                continue
            words = alt.split()
            if len(words) < 3:
                issues.append(
                    f'Too few words in alt text: "{alt}"'
                )

        triggered = len(issues) > 0
        score = (
            min(len(issues) / len(alts), 1.0)
            if triggered
            else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="image-alt-quality",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Low-quality alt text detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"issues": issues, "total_alts": len(alts)}
                if triggered
                else None
            ),
        )


def image_alt_quality(
    *, action: str = "warn", min_length: int = 10
) -> _ImageAltQuality:
    return _ImageAltQuality(
        action=action, min_length=min_length
    )
