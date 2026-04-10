"""Detect when response describes wrong modality."""
from __future__ import annotations

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_CROSS_MODALITY: list[re.Pattern[str]] = [
    re.compile(
        r"as\s+you\s+can\s+see\s+in\s+the\s+audio",
        re.IGNORECASE,
    ),
    re.compile(
        r"listen\s+to\s+this\s+image", re.IGNORECASE
    ),
    re.compile(
        r"the\s+sound\s+in\s+this\s+picture",
        re.IGNORECASE,
    ),
    re.compile(
        r"hear\s+(?:the|this)"
        r"\s+(?:image|photo|picture)",
        re.IGNORECASE,
    ),
    re.compile(
        r"see\s+(?:the|this)"
        r"\s+(?:audio|sound|recording)",
        re.IGNORECASE,
    ),
    re.compile(
        r"visible\s+in\s+the"
        r"\s+(?:audio|sound|recording)",
        re.IGNORECASE,
    ),
    re.compile(
        r"audible\s+in\s+the"
        r"\s+(?:image|photo|picture)",
        re.IGNORECASE,
    ),
    re.compile(
        r"watch\s+(?:the|this)"
        r"\s+(?:audio|sound)",
        re.IGNORECASE,
    ),
    re.compile(
        r"the\s+sound"
        r"\s+(?:shows?|displays?|depicts?)",
        re.IGNORECASE,
    ),
    re.compile(
        r"the\s+(?:image|photo|picture)"
        r"\s+(?:sounds?|plays?)\b",
        re.IGNORECASE,
    ),
]

_IMPOSSIBLE: list[re.Pattern[str]] = [
    re.compile(
        r"the\s+color\s+of\s+the\s+sound",
        re.IGNORECASE,
    ),
    re.compile(
        r"the\s+melody\s+in\s+the\s+image",
        re.IGNORECASE,
    ),
    re.compile(
        r"the\s+pitch\s+of\s+(?:the|this)"
        r"\s+(?:photo|picture|image)",
        re.IGNORECASE,
    ),
    re.compile(
        r"the\s+brightness\s+of\s+(?:the|this)"
        r"\s+(?:audio|sound|music)",
        re.IGNORECASE,
    ),
    re.compile(
        r"the\s+volume\s+of\s+(?:the|this)"
        r"\s+(?:image|photo|picture)",
        re.IGNORECASE,
    ),
    re.compile(
        r"the\s+rhythm"
        r"\s+(?:shown|displayed|depicted)"
        r"\s+in\s+the\s+(?:image|photo)",
        re.IGNORECASE,
    ),
    re.compile(
        r"the\s+texture\s+of\s+(?:the|this)"
        r"\s+(?:sound|audio|music)",
        re.IGNORECASE,
    ),
]

_IMG_INPUT = re.compile(
    r"you\s+(?:asked|inquired)\s+about"
    r"\s+the\s+(?:image|photo|picture)",
    re.IGNORECASE,
)
_AUD_INPUT = re.compile(
    r"you\s+(?:asked|inquired)\s+about"
    r"\s+the\s+(?:audio|sound|recording|video)",
    re.IGNORECASE,
)
_IMG_RESP = re.compile(
    r"(?:in\s+(?:the|this)\s+(?:image|photo|picture)"
    r"|the\s+(?:image|photo|picture)"
    r"\s+(?:shows?|displays?))",
    re.IGNORECASE,
)
_AUD_RESP = re.compile(
    r"(?:in\s+(?:the|this)"
    r"\s+(?:audio|sound|recording)"
    r"|the\s+(?:audio|sound|recording)"
    r"\s+(?:contains?|plays?))",
    re.IGNORECASE,
)


class _ModalityMismatch:
    def __init__(self, *, action: str = "warn") -> None:
        self.name = "modality-mismatch"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: List[str] = []

        for p in _CROSS_MODALITY:
            if p.search(text):
                issues.append(
                    "Cross-modality confusion detected"
                )

        for p in _IMPOSSIBLE:
            if p.search(text):
                issues.append(
                    "Impossible modality description"
                )

        asked_img = bool(_IMG_INPUT.search(text))
        asked_aud = bool(_AUD_INPUT.search(text))
        ans_img = bool(_IMG_RESP.search(text))
        ans_aud = bool(_AUD_RESP.search(text))

        if asked_img and ans_aud and not ans_img:
            issues.append(
                "Asked about image but responded"
                " about audio"
            )
        if asked_aud and ans_img and not ans_aud:
            issues.append(
                "Asked about audio but responded"
                " about image"
            )

        triggered = len(issues) > 0
        score = (
            min(len(issues) / 3, 1.0)
            if triggered
            else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="modality-mismatch",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Modality mismatch detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"issues": issues} if triggered else None
            ),
        )


def modality_mismatch(
    *, action: str = "warn"
) -> _ModalityMismatch:
    return _ModalityMismatch(action=action)
