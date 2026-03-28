"""Check URL accessibility concerns."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult


class _UrlAccessibility:
    def __init__(self, *, action: str = "warn") -> None:
        self.name = "url-accessibility"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []

        click_here = re.findall(
            r"\[click\s+here\]\(https?://[^)]+\)",
            text,
            re.IGNORECASE,
        )
        for m in click_here:
            issues.append(
                f"Non-descriptive link text: {m[:50]}"
            )

        md_links = re.findall(
            r"\[[^\]]+\]\((https?://[^)]+)\)", text
        )
        md_urls = set(md_links)

        raw_urls = re.findall(
            r"(?<!\[|\()https?://[^\s)\]]+", text
        )
        for url in raw_urls:
            if url not in md_urls:
                issues.append(
                    "Raw URL without descriptive"
                    f" text: {url[:60]}"
                )

        for m in re.finditer(
            r"\[([^\]]*)\]\(#([^)]*)\)", text
        ):
            target = m.group(2)
            headings = re.findall(
                r"^#{1,6}\s+(.+)$", text, re.MULTILINE
            )
            slugs = [
                re.sub(
                    r"\s+",
                    "-",
                    re.sub(r"[^a-z0-9\s-]", "", h.lower()),
                )
                for h in headings
            ]
            if target not in slugs:
                issues.append(
                    f"Possibly broken anchor: #{target}"
                )

        triggered = len(issues) > 0
        score = (
            min(len(issues) / 4, 1.0)
            if triggered
            else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="url-accessibility",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "URL accessibility issues found"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"issues": issues} if triggered else None
            ),
        )


def url_accessibility(
    *, action: str = "warn"
) -> _UrlAccessibility:
    return _UrlAccessibility(action=action)
