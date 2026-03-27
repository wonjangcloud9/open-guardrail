"""Sanitize tool/function call output."""

import re
import time

from open_guardrail.core import GuardResult

_HTML_RE = re.compile(r"<[^>]+>")
_CTRL_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")


class _ToolOutputSanitize:
    def __init__(
        self,
        *,
        action: str = "override",
        max_length: int = 10000,
        strip_html: bool = True,
    ) -> None:
        self.name = "tool-output-sanitize"
        self.action = action
        self.max_length = max_length
        self.strip_html = strip_html

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        sanitized = text
        changes: list[str] = []

        sanitized = _CTRL_RE.sub("", sanitized)
        if sanitized != text:
            changes.append("control-chars-removed")

        if self.strip_html:
            cleaned = _HTML_RE.sub("", sanitized)
            if cleaned != sanitized:
                changes.append("html-stripped")
                sanitized = cleaned

        if len(sanitized) > self.max_length:
            sanitized = sanitized[: self.max_length]
            changes.append("truncated")

        modified = sanitized != text
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="tool-output-sanitize",
            passed=True,
            action="override" if modified else "allow",
            override_text=sanitized if modified else None,
            message=(
                f"Sanitized: {', '.join(changes)}"
                if modified else None
            ),
            latency_ms=round(elapsed, 2),
            details={
                "changes": changes,
                "original_length": len(text),
                "sanitized_length": len(sanitized),
            } if modified else None,
        )


def tool_output_sanitize(
    *,
    action: str = "override",
    max_length: int = 10000,
    strip_html: bool = True,
) -> _ToolOutputSanitize:
    return _ToolOutputSanitize(
        action=action,
        max_length=max_length,
        strip_html=strip_html,
    )
