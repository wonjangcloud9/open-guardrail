"""Detect unsafe content in audio transcription output."""
from __future__ import annotations

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_MANIPULATION: list[re.Pattern[str]] = [
    re.compile(r"\[redacted\]", re.IGNORECASE),
    re.compile(r"\[censored\]", re.IGNORECASE),
]

_IMPERSONATION: list[re.Pattern[str]] = [
    re.compile(r"pretending\s+to\s+be", re.IGNORECASE),
    re.compile(r"imitating\b", re.IGNORECASE),
    re.compile(
        r"mimicking\s+the\s+voice", re.IGNORECASE
    ),
]

_DEEPFAKE: list[re.Pattern[str]] = [
    re.compile(r"synthetic\s+voice", re.IGNORECASE),
    re.compile(r"ai[\s-]+generated", re.IGNORECASE),
    re.compile(r"cloned\s+voice", re.IGNORECASE),
    re.compile(r"voice\s+clone", re.IGNORECASE),
]

_THREAT: list[re.Pattern[str]] = [
    re.compile(
        r"\bi\s+will\s+(?:kill|hurt|harm|destroy)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bgoing\s+to\s+(?:kill|hurt|harm|destroy)\b",
        re.IGNORECASE,
    ),
    re.compile(r"\bthreat(?:en|ening)\b", re.IGNORECASE),
    re.compile(
        r"\bi['\u2019]ll\s+(?:kill|hurt|harm|destroy)\b",
        re.IGNORECASE,
    ),
]

_HARASSMENT: list[re.Pattern[str]] = [
    re.compile(r"\bstalk(?:ing|er)?\b", re.IGNORECASE),
    re.compile(
        r"\bharass(?:ing|ment)?\b", re.IGNORECASE
    ),
    re.compile(r"\bbully(?:ing)?\b", re.IGNORECASE),
]

_INAUDIBLE = re.compile(r"\[inaudible\]", re.IGNORECASE)
_UNCERTAIN = re.compile(
    r"\[(?:uncertain|low confidence)\]", re.IGNORECASE
)


class _AudioTranscriptSafety:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "audio-transcript-safety"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: List[str] = []

        inaudible_count = len(_INAUDIBLE.findall(text))
        if inaudible_count > 5:
            issues.append(
                f"Excessive [inaudible] markers:"
                f" {inaudible_count}"
            )

        for p in _MANIPULATION:
            if p.search(text):
                issues.append(
                    "Transcription manipulation artifact"
                )

        for p in _IMPERSONATION:
            if p.search(text):
                issues.append(
                    "Speaker impersonation detected"
                )

        for p in _DEEPFAKE:
            if p.search(text):
                issues.append("Deepfake indicator detected")

        uncertain_count = len(_UNCERTAIN.findall(text))
        if uncertain_count > 5:
            issues.append(
                f"Low quality markers: {uncertain_count}"
            )

        for p in _THREAT:
            if p.search(text):
                issues.append(
                    "Threatening language detected"
                )

        for p in _HARASSMENT:
            if p.search(text):
                issues.append(
                    "Harassment pattern detected"
                )

        triggered = len(issues) > 0
        score = (
            min(len(issues) / 5, 1.0)
            if triggered
            else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="audio-transcript-safety",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Unsafe audio transcript content"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"issues": issues} if triggered else None
            ),
        )


def audio_transcript_safety(
    *, action: str = "block"
) -> _AudioTranscriptSafety:
    return _AudioTranscriptSafety(action=action)
