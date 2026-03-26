"""Detect invisible unicode characters."""

import time

from open_guardrail.core import GuardResult

_INVISIBLE_RANGES: list[tuple[int, int]] = [
    (0x200B, 0x200F),
    (0x2028, 0x202F),
    (0x2060, 0x2064),
    (0x2066, 0x206F),
    (0xFEFF, 0xFEFF),
    (0xFFF0, 0xFFF8),
    (0x00AD, 0x00AD),
    (0x034F, 0x034F),
    (0x061C, 0x061C),
    (0x180E, 0x180E),
    (0xE0001, 0xE007F),
]


def _is_invisible(code: int) -> bool:
    for lo, hi in _INVISIBLE_RANGES:
        if lo <= code <= hi:
            return True
    return False


def _detect(
    text: str,
) -> tuple[int, list[str]]:
    count = 0
    types: set[str] = set()
    for ch in text:
        code = ord(ch)
        if _is_invisible(code):
            count += 1
            if 0x200B <= code <= 0x200F:
                types.add("zero-width")
            elif 0x2028 <= code <= 0x202F:
                types.add("bidi-control")
            elif 0x2060 <= code <= 0x206F:
                types.add("invisible-format")
            elif code == 0xFEFF:
                types.add("bom")
            elif 0xE0001 <= code <= 0xE007F:
                types.add("tag-character")
            else:
                types.add("other-invisible")
    return count, sorted(types)


def _sanitize(text: str) -> str:
    return "".join(
        ch for ch in text if not _is_invisible(ord(ch))
    )


class _InvisibleText:
    def __init__(
        self, *, action: str = "block"
    ) -> None:
        self.name = "invisible-text"
        self.action = action

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        count, types = _detect(text)
        elapsed = (time.perf_counter() - start) * 1000

        if count == 0:
            return GuardResult(
                guard_name="invisible-text",
                passed=True,
                action="allow",
                latency_ms=round(elapsed, 2),
            )

        if self.action == "sanitize":
            return GuardResult(
                guard_name="invisible-text",
                passed=True,
                action="override",
                override_text=_sanitize(text),
                latency_ms=round(elapsed, 2),
                details={
                    "invisible_count": count,
                    "types": types,
                },
            )

        return GuardResult(
            guard_name="invisible-text",
            passed=False,
            action=self.action,
            message=(
                f"{count} invisible character(s)"
                f" found: {', '.join(types)}"
            ),
            latency_ms=round(elapsed, 2),
            details={
                "invisible_count": count,
                "types": types,
                "reason": (
                    "Invisible unicode characters can"
                    " be used to hide prompt injection"
                    " attacks"
                ),
            },
        )


def invisible_text(
    *, action: str = "block"
) -> _InvisibleText:
    return _InvisibleText(action=action)
