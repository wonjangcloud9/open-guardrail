"""Safety guard for multimodal AI interactions."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_IMAGE_ABUSE_PATTERNS: list[re.Pattern[str]] = [
    re.compile(
        r"generate\s+(nude|explicit)\s+image",
        re.IGNORECASE,
    ),
    re.compile(r"\bdeepfake\b", re.IGNORECASE),
    re.compile(r"\bundress\b", re.IGNORECASE),
    re.compile(
        r"child\s+image",
        re.IGNORECASE,
    ),
    re.compile(
        r"fake\s+(id|document)",
        re.IGNORECASE,
    ),
]

_STEGANOGRAPHY_PATTERNS: list[re.Pattern[str]] = [
    re.compile(
        r"hide\s+data\s+in\s+image",
        re.IGNORECASE,
    ),
    re.compile(r"\bsteganograph", re.IGNORECASE),
    re.compile(r"\bLSB\s+embed", re.IGNORECASE),
    re.compile(r"\bexif\s+inject", re.IGNORECASE),
]

_VISUAL_INJECTION_PATTERNS: list[re.Pattern[str]] = [
    re.compile(
        r"image\s+contains?\s+hidden\s+instructions",
        re.IGNORECASE,
    ),
    re.compile(
        r"OCR\s+extract\s+then\s+execute",
        re.IGNORECASE,
    ),
]


class _MultimodalSafety:
    def __init__(
        self,
        *,
        action: str = "block",
        check_image_prompts: bool = True,
        check_steganography: bool = True,
        extra_patterns: Optional[List[re.Pattern[str]]] = None,
    ) -> None:
        self.name = "multimodal-safety"
        self.action = action
        self._patterns: list[re.Pattern[str]] = []
        if check_image_prompts:
            self._patterns.extend(_IMAGE_ABUSE_PATTERNS)
            self._patterns.extend(_VISUAL_INJECTION_PATTERNS)
        if check_steganography:
            self._patterns.extend(_STEGANOGRAPHY_PATTERNS)
        if extra_patterns:
            self._patterns.extend(extra_patterns)

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []

        for pat in self._patterns:
            if pat.search(text):
                matched.append(pat.pattern)

        triggered = len(matched) > 0
        score = min(len(matched) / 3, 1.0) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="multimodal-safety",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Multimodal safety violation detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "matched_patterns": len(matched),
                    "reason": (
                        "Text contains patterns indicating"
                        " unsafe multimodal AI usage"
                        " such as image abuse or"
                        " steganography attempts"
                    ),
                }
                if triggered
                else None
            ),
        )


def multimodal_safety(
    *,
    action: str = "block",
    check_image_prompts: bool = True,
    check_steganography: bool = True,
    extra_patterns: Optional[List[re.Pattern[str]]] = None,
) -> _MultimodalSafety:
    return _MultimodalSafety(
        action=action,
        check_image_prompts=check_image_prompts,
        check_steganography=check_steganography,
        extra_patterns=extra_patterns,
    )
