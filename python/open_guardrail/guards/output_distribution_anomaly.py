"""Detect anomalous output patterns deviating from expected distribution."""
from __future__ import annotations

import re
import time
from typing import Dict, List, Optional

from open_guardrail.core import GuardResult

_SCRIPT_PATTERNS = [
    ("latin", re.compile(r"[a-zA-Z]")),
    ("cjk", re.compile(r"[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]")),
    ("cyrillic", re.compile(r"[\u0400-\u04ff]")),
    ("arabic", re.compile(r"[\u0600-\u06ff]")),
    ("devanagari", re.compile(r"[\u0900-\u097f]")),
]

_CODE_RE = re.compile(
    r"[{}\[\]();=<>]|function\s|const\s|let\s|var\s|def\s|class\s|import\s|return\s"
)
_UNUSUAL_RE = re.compile(
    r"[\x00-\x08\x0e-\x1f\x7f-\x9f\u200b-\u200f\u2028-\u202f\ufeff]"
)


def _detect_script(text: str) -> str:
    best, best_count = "unknown", 0
    for name, pat in _SCRIPT_PATTERNS:
        count = len(pat.findall(text))
        if count > best_count:
            best, best_count = name, count
    return best


def _repetition_ratio(text: str) -> float:
    words = text.lower().split()
    if len(words) <= 1:
        return 0.0
    bigrams: Dict[str, int] = {}
    for i in range(len(words) - 1):
        key = f"{words[i]} {words[i + 1]}"
        bigrams[key] = bigrams.get(key, 0) + 1
    total = len(words) - 1
    repeated = sum(c for c in bigrams.values() if c > 1)
    return repeated / total if total else 0.0


class _OutputDistributionAnomaly:
    def __init__(self, *, action: str = "block", window_size: int = 10) -> None:
        self.name = "output-distribution-anomaly"
        self.action = action
        self.window_size = window_size
        self._history: List[dict] = []

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        current = {
            "length": len(text),
            "unusual": bool(_UNUSUAL_RE.search(text)),
            "script": _detect_script(text),
            "is_code": bool(_CODE_RE.search(text)),
            "rep_ratio": _repetition_ratio(text),
        }
        warming = len(self._history) < self.window_size
        anomalies: List[str] = []

        if not warming:
            avg_len = sum(h["length"] for h in self._history) / len(self._history)
            if avg_len > 0 and (current["length"] > avg_len * 5 or current["length"] < avg_len * 0.2):
                anomalies.append("response_length")

            if current["unusual"]:
                anomalies.append("unusual_characters")

            prev = self._history[-1]
            if prev["script"] and current["script"] != prev["script"]:
                anomalies.append("language_switch")

            if current["is_code"] != prev["is_code"]:
                anomalies.append("format_change")

            avg_rep = sum(h["rep_ratio"] for h in self._history) / len(self._history)
            if avg_rep > 0 and current["rep_ratio"] > avg_rep * 3:
                anomalies.append("repetition_spike")

        triggered = len(anomalies) > 0

        self._history.append(current)
        if len(self._history) > self.window_size:
            self._history.pop(0)

        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="output-distribution-anomaly",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Output anomalies detected: {', '.join(anomalies)}" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={
                "anomalies": anomalies,
                "current_length": current["length"],
                "dominant_script": current["script"],
                "repetition_ratio": round(current["rep_ratio"], 2),
            } if triggered else None,
        )


def output_distribution_anomaly(*, action: str = "block", window_size: int = 10) -> _OutputDistributionAnomaly:
    return _OutputDistributionAnomaly(action=action, window_size=window_size)
