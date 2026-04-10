"""Alert when guard effectiveness degrades."""
from __future__ import annotations
import time
from open_guardrail.core import GuardResult

class _GuardrailEffectiveness:
    def __init__(self, *, action="block", window_size=50, min_pass_rate=0.3, max_pass_rate=0.95):
        self.name = "guardrail-effectiveness"; self.action = action
        self._window = window_size; self._min = min_pass_rate; self._max = max_pass_rate
        self._history: list[bool] = []
    def check(self, text, stage="output"):
        start = time.perf_counter()
        passed = len(text.strip()) > 0
        self._history.append(passed)
        if len(self._history) > self._window:
            self._history = self._history[-self._window:]
        n = len(self._history)
        pass_rate = sum(self._history) / n if n else 1.0
        prev_rate = sum(self._history[:-1]) / (n - 1) if n > 1 else pass_rate
        trend = "rising" if pass_rate > prev_rate else ("falling" if pass_rate < prev_rate else "stable")
        too_low = pass_rate < self._min
        too_high = pass_rate > self._max and n >= self._window
        triggered = too_low or too_high
        elapsed = (time.perf_counter() - start) * 1000
        msg = None
        if triggered:
            pct = f"{pass_rate * 100:.1f}%"
            msg = f"Pass rate too low ({pct}) — possible false positive storm" if too_low else f"Pass rate too high ({pct}) — possible bypass"
        return GuardResult(guard_name="guardrail-effectiveness", passed=not triggered,
            action=self.action if triggered else "allow", message=msg,
            latency_ms=round(elapsed, 2),
            details={"pass_rate": round(pass_rate, 3), "trend": trend, "window_size": n, "threshold": "below-min" if too_low else "above-max"} if triggered else None)

def guardrail_effectiveness(*, action="block", window_size=50, min_pass_rate=0.3, max_pass_rate=0.95):
    return _GuardrailEffectiveness(action=action, window_size=window_size, min_pass_rate=min_pass_rate, max_pass_rate=max_pass_rate)
