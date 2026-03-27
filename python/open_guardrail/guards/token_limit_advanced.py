"""Per-model token limit guard."""

import time

from open_guardrail.core import GuardResult

_MODEL_LIMITS = {
    "gpt-4": 128000,
    "gpt-4-turbo": 128000,
    "gpt-3.5-turbo": 16385,
    "claude": 200000,
    "claude-3": 200000,
    "claude-3.5": 200000,
    "gemini-pro": 128000,
    "llama-3": 8192,
    "mistral": 32768,
}


class _TokenLimitAdvanced:
    def __init__(
        self,
        *,
        action: str = "block",
        model: str = "gpt-4",
        max_tokens: int | None = None,
        chars_per_token: float = 4.0,
    ) -> None:
        self.name = "token-limit-advanced"
        self.action = action
        self.model = model
        self.chars_per_token = chars_per_token
        if max_tokens is not None:
            self.max_tokens = max_tokens
        else:
            self.max_tokens = _MODEL_LIMITS.get(
                model, 4096
            )

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        estimated = int(
            len(text) / self.chars_per_token + 0.5
        )
        triggered = estimated > self.max_tokens
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="token-limit-advanced",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                f"~{estimated} tokens exceeds"
                f" {self.model} limit {self.max_tokens}"
                if triggered else None
            ),
            latency_ms=round(elapsed, 2),
            details={
                "estimated_tokens": estimated,
                "max_tokens": self.max_tokens,
                "model": self.model,
            } if triggered else None,
        )


def token_limit_advanced(
    *,
    action: str = "block",
    model: str = "gpt-4",
    max_tokens: int | None = None,
    chars_per_token: float = 4.0,
) -> _TokenLimitAdvanced:
    return _TokenLimitAdvanced(
        action=action,
        model=model,
        max_tokens=max_tokens,
        chars_per_token=chars_per_token,
    )
