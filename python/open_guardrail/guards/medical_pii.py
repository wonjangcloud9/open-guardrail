"""Detect medical PII in text."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_PATTERNS: list[re.Pattern[str]] = [
    # ICD-10 codes (e.g. A00.0, Z99.89)
    re.compile(
        r"\b[A-TV-Z]\d{2}\.?\d{0,2}\b",
        re.IGNORECASE,
    ),
    # Prescription number (Rx followed by digits)
    re.compile(
        r"\bRx\s*#?\s*\d{6,12}\b",
        re.IGNORECASE,
    ),
    # Medical record number (MRN)
    re.compile(
        r"\bMRN\s*[:#]?\s*\d{5,12}\b",
        re.IGNORECASE,
    ),
    # Health insurance ID
    re.compile(
        r"\b(health\s+insurance|member)\s*(id|#|number)"
        r"\s*[:#]?\s*[A-Z0-9]{6,15}\b",
        re.IGNORECASE,
    ),
    # Blood type with result
    re.compile(
        r"\b(blood\s+type|type)\s*[:#]?\s*"
        r"(A|B|AB|O)[+-]\b",
        re.IGNORECASE,
    ),
    # Lab values (e.g. glucose 120 mg/dL)
    re.compile(
        r"\b(glucose|hemoglobin|cholesterol|creatinine"
        r"|potassium|sodium|platelet|WBC|RBC|HbA1c)"
        r"\s*[:#]?\s*\d+\.?\d*\s*"
        r"(mg/dL|g/dL|mmol/L|mEq/L|%|K/uL|M/uL)\b",
        re.IGNORECASE,
    ),
]

_MASK_RE = re.compile(
    r"("
    r"\b[A-TV-Z]\d{2}\.?\d{0,2}\b"
    r"|Rx\s*#?\s*\d{6,12}"
    r"|MRN\s*[:#]?\s*\d{5,12}"
    r"|\b(health\s+insurance|member)\s*(id|#|number)"
    r"\s*[:#]?\s*[A-Z0-9]{6,15}\b"
    r")",
    re.IGNORECASE,
)


class _MedicalPii:
    def __init__(
        self,
        *,
        action: str = "redact",
        mask_medical: bool = True,
    ) -> None:
        self.name = "medical-pii"
        self.action = action
        self.mask_medical = mask_medical

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []

        for pat in _PATTERNS:
            if pat.search(text):
                matched.append(pat.pattern)

        triggered = len(matched) > 0
        score = min(len(matched) / 3, 1.0) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000

        redacted = None
        if triggered and self.mask_medical:
            redacted = _MASK_RE.sub("[MEDICAL_REDACTED]", text)

        return GuardResult(
            guard_name="medical-pii",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Medical PII detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "matched_categories": len(matched),
                    "redacted_text": redacted,
                    "reason": (
                        "Text contains medical personally"
                        " identifiable information"
                    ),
                }
                if triggered
                else None
            ),
        )


def medical_pii(
    *,
    action: str = "redact",
    mask_medical: bool = True,
) -> _MedicalPii:
    return _MedicalPii(
        action=action, mask_medical=mask_medical
    )
