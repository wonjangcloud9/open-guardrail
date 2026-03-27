"""Empty/near-empty response detection guard."""

import time

from open_guardrail.core import GuardResult


class _EmptyResponse:
    def __init__(self, *, action: str = "block", min_content_length: int = 1, ignore_whitespace: bool = True) -> None:
        self.name = "empty-response"
        self.action = action
        self.min_len = min_content_length
        self.ignore_ws = ignore_whitespace

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        content = text.strip() if self.ignore_ws else text
        triggered = len(content) < self.min_len
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="empty-response",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message="Empty or near-empty response" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"length": len(content), "min_required": self.min_len} if triggered else None,
        )


def empty_response(*, action: str = "block", min_content_length: int = 1, ignore_whitespace: bool = True) -> _EmptyResponse:
    return _EmptyResponse(action=action, min_content_length=min_content_length, ignore_whitespace=ignore_whitespace)
