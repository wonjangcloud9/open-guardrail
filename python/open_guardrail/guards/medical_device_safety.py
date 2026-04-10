"""SaMD output validation for FDA 21 CFR Part 11."""
from __future__ import annotations

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_DEVICE_CONTEXT = [
    re.compile(r"\bmedical\s+device\b", re.I),
    re.compile(r"\bSaMD\b"),
    re.compile(
        r"\bsoftware\s+as\s+a\s+medical"
        r"\s+device\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:diagnostic|therapeutic|"
        r"implantable|life[\s-]sustaining)\s+"
        r"(?:device|system|software|output)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bFDA\s+(?:cleared|approved|"
        r"submission|classification)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bdevice\s+(?:output|decision|"
        r"recommendation|classification)\b",
        re.IGNORECASE,
    ),
]

_COMPLIANCE_MARKERS = [
    (re.compile(r"\blog_id\b", re.I), "log_id"),
    (re.compile(r"\btimestamp\b", re.I), "timestamp"),
    (re.compile(r"\bversion\b", re.I), "version"),
    (re.compile(r"\boperator\b", re.I), "operator"),
    (re.compile(r"\bvalidated\b", re.I), "validated"),
    (re.compile(r"\bverified\b", re.I), "verified"),
    (re.compile(r"\bcalibrated\b", re.I), "calibrated"),
    (re.compile(r"\b21\s*CFR\s*Part\s*11\b", re.I), "21 CFR Part 11"),
    (re.compile(r"\belectronic\s+records?\b", re.I), "electronic records"),
    (re.compile(r"\baudit\s+trail\b", re.I), "audit trail"),
    (re.compile(r"\belectronic\s+signature\b", re.I), "electronic signature"),
    (re.compile(r"\bauthenticat(?:ed|ion)\b", re.I), "authentication"),
]

_MIN_MARKERS = 3


class _MedicalDeviceSafety:
    def __init__(
        self, *, action: str = "block"
    ) -> None:
        self.name = "medical-device-safety"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()

        device_ctx = any(
            p.search(text) for p in _DEVICE_CONTEXT
        )
        if not device_ctx:
            elapsed = (
                time.perf_counter() - start
            ) * 1000
            return GuardResult(
                guard_name="medical-device-safety",
                passed=True,
                action="allow",
                latency_ms=round(elapsed, 2),
            )

        count = 0
        missing: List[str] = []
        for pat, label in _COMPLIANCE_MARKERS:
            if pat.search(text):
                count += 1
            else:
                missing.append(label)

        triggered = count < _MIN_MARKERS
        elapsed = (
            time.perf_counter() - start
        ) * 1000

        return GuardResult(
            guard_name="medical-device-safety",
            passed=not triggered,
            action=(
                self.action if triggered else "allow"
            ),
            message=(
                "Medical device context detected"
                " with insufficient compliance"
                f" markers ({count}/{_MIN_MARKERS})"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "marker_count": count,
                    "min_required": _MIN_MARKERS,
                    "missing_markers": missing[:5],
                    "reason": (
                        "Medical device output lacks"
                        " FDA 21 CFR Part 11"
                        " compliance markers"
                    ),
                }
                if triggered
                else None
            ),
        )


def medical_device_safety(
    *, action: str = "block"
) -> _MedicalDeviceSafety:
    return _MedicalDeviceSafety(action=action)
