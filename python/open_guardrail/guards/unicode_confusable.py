"""Detect confusable Unicode characters."""

import time
import unicodedata

from open_guardrail.core import GuardResult

_CYRILLIC_LATIN = {
    "\u0430": "a", "\u0435": "e", "\u043e": "o",
    "\u0441": "c", "\u0440": "p", "\u0443": "y",
    "\u0445": "x", "\u043d": "h", "\u0422": "T",
    "\u041c": "M", "\u0412": "B", "\u041d": "H",
}

_GREEK_LATIN = {
    "\u03b1": "a", "\u03bf": "o", "\u03b5": "e",
    "\u0391": "A", "\u039f": "O", "\u0395": "E",
    "\u0392": "B", "\u039a": "K", "\u0396": "Z",
}


def _script(ch: str) -> str:
    try:
        name = unicodedata.name(ch, "")
        if "CYRILLIC" in name:
            return "Cyrillic"
        if "GREEK" in name:
            return "Greek"
        if "FULLWIDTH" in name:
            return "Fullwidth"
        if "LATIN" in name:
            return "Latin"
    except ValueError:
        pass
    return "Other"


class _UnicodeConfusable:
    def __init__(self, *, action: str = "warn") -> None:
        self.name = "unicode-confusable"
        self.action = action

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        found: list[dict] = []
        scripts_seen: set[str] = set()

        for i, ch in enumerate(text):
            s = _script(ch)
            if s not in ("Other",):
                scripts_seen.add(s)
            if ch in _CYRILLIC_LATIN:
                found.append({
                    "char": ch, "pos": i,
                    "looks_like": _CYRILLIC_LATIN[ch],
                    "script": "Cyrillic",
                })
            elif ch in _GREEK_LATIN:
                found.append({
                    "char": ch, "pos": i,
                    "looks_like": _GREEK_LATIN[ch],
                    "script": "Greek",
                })
            elif _script(ch) == "Fullwidth":
                found.append({
                    "char": ch, "pos": i,
                    "looks_like": chr(ord(ch) - 0xFEE0),
                    "script": "Fullwidth",
                })

        mixed = len(scripts_seen) > 1
        triggered = len(found) > 0 and mixed
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="unicode-confusable",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                f"Mixed scripts with {len(found)} confusable chars"
                if triggered else None
            ),
            latency_ms=round(elapsed, 2),
            details={
                "confusables": found[:10],
                "scripts": sorted(scripts_seen),
            } if triggered else None,
        )


def unicode_confusable(
    *, action: str = "warn",
) -> _UnicodeConfusable:
    return _UnicodeConfusable(action=action)
