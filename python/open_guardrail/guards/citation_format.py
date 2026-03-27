"""Validate citation format and count."""

import re
import time

from open_guardrail.core import GuardResult

_BRACKET_RE = re.compile(r"\[\d+\]")
_FOOTNOTE_RE = re.compile(r"\[\^\d+\]")
_INLINE_URL_RE = re.compile(r"\[[^\]]+\]\(https?://[^\)]+\)")

_FORMAT_MAP = {
    "brackets": _BRACKET_RE,
    "footnote": _FOOTNOTE_RE,
    "inline-url": _INLINE_URL_RE,
}


class _CitationFormat:
    def __init__(
        self,
        *,
        action: str = "warn",
        format: str = "any",
        min_citations: int = 0,
    ) -> None:
        self.name = "citation-format"
        self.action = action
        self.format = format
        self.min_citations = min_citations

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        counts: dict[str, int] = {}

        if self.format == "any":
            for name, pat in _FORMAT_MAP.items():
                counts[name] = len(pat.findall(text))
        else:
            pat = _FORMAT_MAP.get(self.format)
            if pat:
                counts[self.format] = len(pat.findall(text))

        total = sum(counts.values())
        triggered = total < self.min_citations
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="citation-format",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                f"Found {total} citations, need"
                f" >= {self.min_citations}"
                if triggered else None
            ),
            latency_ms=round(elapsed, 2),
            details={
                "counts": counts,
                "total": total,
            } if triggered else None,
        )


def citation_format(
    *,
    action: str = "warn",
    format: str = "any",
    min_citations: int = 0,
) -> _CitationFormat:
    return _CitationFormat(
        action=action,
        format=format,
        min_citations=min_citations,
    )
