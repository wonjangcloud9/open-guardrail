"""Verify citation format quality."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_NUMBER_REF = re.compile(r"\[(\d+)\]")
_AUTHOR_YEAR_REF = re.compile(
    r"\(([A-Z][a-zA-Z]+(?:\s+(?:et\s+al\.|&\s+[A-Z][a-zA-Z]+))?)"
    r",?\s*(\d{4})\)"
)
_DOI_PATTERN = re.compile(r"10\.\d{4,}/[^\s]+")
_URL_PATTERN = re.compile(r"https?://[^\s)]+")


def _valid_doi(doi: str) -> bool:
    return bool(
        re.match(r"^10\.\d{4,9}/[-._;()/:A-Za-z0-9]+$", doi)
    )


def _valid_url(url: str) -> bool:
    return bool(
        re.match(r"^https?://[a-zA-Z0-9]", url)
    ) and len(url) > 10


class _CitationVerify:
    def __init__(
        self,
        *,
        action: str = "warn",
        required_format: str = "any",
    ) -> None:
        self.name = "citation-verify"
        self.action = action
        self._fmt = required_format

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []

        num_refs = _NUMBER_REF.findall(text)
        ay_refs = _AUTHOR_YEAR_REF.findall(text)
        dois = _DOI_PATTERN.findall(text)
        urls = _URL_PATTERN.findall(text)

        if self._fmt == "number" and not num_refs and len(text) > 50:
            issues.append("no-number-refs-found")
        if self._fmt == "author-year" and not ay_refs and len(text) > 50:
            issues.append("no-author-year-refs-found")

        if num_refs:
            nums = sorted(int(n) for n in num_refs)
            for i in range(len(nums) - 1):
                if nums[i + 1] - nums[i] > 1:
                    issues.append("non-sequential-number-refs")
                    break

        if num_refs and ay_refs:
            issues.append("mixed-citation-formats")

        for doi in dois:
            if not _valid_doi(doi):
                issues.append("invalid-doi-format")
                break

        for url in urls:
            if not _valid_url(url):
                issues.append("incomplete-url")
                break

        triggered = len(issues) > 0
        score = min(len(issues) / 3, 1.0) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="citation-verify",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Citation format issues found"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details={"issues": issues} if triggered else None,
        )


def citation_verify(
    *,
    action: str = "warn",
    required_format: str = "any",
) -> _CitationVerify:
    return _CitationVerify(
        action=action, required_format=required_format
    )
