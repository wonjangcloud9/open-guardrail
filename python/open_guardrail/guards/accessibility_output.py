"""Verify output meets accessibility standards (WCAG 2.2 inspired)."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult


def _count_syllables(word: str) -> int:
    w = word.lower()
    w = re.sub(r"(?:[^laeiouy]es|ed|[^laeiouy]e)$", "", w)
    w = re.sub(r"^y", "", w)
    groups = re.findall(r"[aeiouy]{1,2}", w)
    return max(len(groups), 1) if groups else 1


def _estimate_grade(text: str) -> float:
    sentences = [
        s
        for s in re.split(r"[.!?]+", text)
        if s.strip()
    ]
    if not sentences:
        return 0.0
    words = [
        w for w in text.split() if re.search(r"[a-zA-Z]", w)
    ]
    if not words:
        return 0.0
    total_syl = sum(_count_syllables(w) for w in words)
    avg_wps = len(words) / len(sentences)
    avg_spw = total_syl / len(words)
    grade = 0.39 * avg_wps + 11.8 * avg_spw - 15.59
    return round(max(0.0, grade), 1)


def _check_image_alt(text: str) -> List[str]:
    issues: List[str] = []
    for m in re.finditer(r"!\[([^\]]*)\]\([^)]+\)", text):
        alt = m.group(1).strip()
        if not alt:
            issues.append("missing_alt_text")
        elif len(alt) < 5 or re.match(
            r"^(?:image|photo|picture|img|screenshot)$",
            alt,
            re.I,
        ):
            issues.append("non_descriptive_alt_text")
    return issues


def _check_color_only(text: str) -> bool:
    has_color = bool(
        re.search(
            r"\b(?:the\s+)?(?:red|green|blue|yellow|"
            r"orange|purple|pink)\s+"
            r"(?:items?|buttons?|sections?|areas?|"
            r"text|elements?|boxes?|markers?|"
            r"indicators?)\b",
            text,
            re.I,
        )
    )
    has_alt = bool(
        re.search(
            r"\b(?:labeled|marked|titled|numbered|"
            r"named|with\s+(?:icon|symbol|label|text))\b",
            text,
            re.I,
        )
    )
    return has_color and not has_alt


def _check_link_text(text: str) -> List[str]:
    issues: List[str] = []
    for m in re.finditer(r"\[([^\]]+)\]\([^)]+\)", text):
        lt = m.group(1).strip().lower()
        if re.match(
            r"^(?:click\s+here|here|read\s+more|"
            r"more|link|this)$",
            lt,
            re.I,
        ):
            issues.append(
                f'inaccessible_link_text: "{m.group(1)}"'
            )
    return issues


def _check_abbreviations(text: str) -> List[str]:
    issues: List[str] = []
    defined = set()
    for m in re.finditer(r"\(([A-Z]{2,6})\)", text):
        defined.add(m.group(1))
    for m in re.finditer(
        r"([A-Z]{2,6})\s*[-\u2013:]\s*[A-Z][a-z]", text
    ):
        defined.add(m.group(1))
    common = {
        "US", "UK", "EU", "AI", "IT", "OK",
        "AM", "PM", "ID", "TV", "PC", "OS",
        "VS", "OR", "AN", "IF", "IS", "IN",
        "ON", "TO", "DO", "GO", "NO", "SO",
        "UP", "AT", "BY", "AS", "OF",
    }
    for m in re.finditer(r"\b([A-Z]{2,6})\b", text):
        abbr = m.group(1)
        if abbr not in defined and abbr not in common:
            issues.append(
                f"undefined_abbreviation: {abbr}"
            )
            defined.add(abbr)
    return issues


def _check_table_headers(text: str) -> bool:
    has_table = bool(re.search(r"\|[^\n]+\|\n", text))
    has_sep = bool(
        re.search(r"\|[\s:]*-+[\s:]*\|", text)
    )
    return has_table and not has_sep


class _AccessibilityOutput:
    def __init__(
        self,
        *,
        action: str = "warn",
        max_reading_level: int = 12,
    ) -> None:
        self.name = "accessibility-output"
        self.action = action
        self.max_reading_level = max_reading_level

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: List[str] = []

        grade = _estimate_grade(text)
        if grade > self.max_reading_level:
            issues.append(
                f"reading_level_too_high:"
                f" grade {grade}"
                f" > {self.max_reading_level}"
            )

        issues.extend(_check_image_alt(text))
        if _check_color_only(text):
            issues.append("color_only_information")
        issues.extend(_check_link_text(text))
        issues.extend(_check_abbreviations(text))
        if _check_table_headers(text):
            issues.append("table_missing_header_row")

        triggered = len(issues) > 0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="accessibility-output",
            passed=not triggered,
            action=(
                self.action if triggered else "allow"
            ),
            message=(
                f"Accessibility issues found:"
                f" {len(issues)}"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "issues": issues,
                    "grade_level": grade,
                    "max_reading_level": (
                        self.max_reading_level
                    ),
                }
                if triggered
                else None
            ),
        )


def accessibility_output(
    *,
    action: str = "warn",
    max_reading_level: int = 12,
) -> _AccessibilityOutput:
    return _AccessibilityOutput(
        action=action,
        max_reading_level=max_reading_level,
    )
