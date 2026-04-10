"""Detects excessive resource consumption patterns in agent behavior."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_URL_PATTERN = re.compile(r"https?://", re.IGNORECASE)
_FILE_OPS_PATTERNS = [
    re.compile(r"read file", re.IGNORECASE),
    re.compile(r"write file", re.IGNORECASE),
    re.compile(r"open\(", re.IGNORECASE),
    re.compile(r"fs\.", re.IGNORECASE),
    re.compile(r"File\."),
    re.compile(r"fopen", re.IGNORECASE),
]
_API_PATTERNS = [
    re.compile(r"api/", re.IGNORECASE),
    re.compile(r"endpoint", re.IGNORECASE),
    re.compile(r"fetch\(", re.IGNORECASE),
    re.compile(r"request\(", re.IGNORECASE),
    re.compile(r"\bcurl\b", re.IGNORECASE),
    re.compile(r"\bwget\b", re.IGNORECASE),
]


def _count_matches(text: str, patterns: List[re.Pattern[str]]) -> int:
    count = 0
    for pattern in patterns:
        count += len(pattern.findall(text))
    return count


class _AgentResourceGuard:
    def __init__(
        self,
        *,
        action: str = "block",
        max_urls: int = 20,
        max_file_ops: int = 30,
        max_api_calls: int = 50,
    ) -> None:
        self.name = "agent-resource-guard"
        self.action = action
        self.max_urls = max_urls
        self.max_file_ops = max_file_ops
        self.max_api_calls = max_api_calls

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        url_count = len(_URL_PATTERN.findall(text))
        file_ops_count = _count_matches(text, _FILE_OPS_PATTERNS)
        api_call_count = _count_matches(text, _API_PATTERNS)

        triggered = (
            url_count > self.max_urls
            or file_ops_count > self.max_file_ops
            or api_call_count > self.max_api_calls
        )
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="agent-resource-guard",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Resource limits exceeded: urls={url_count}, file_ops={file_ops_count}, api_calls={api_call_count}" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={
                "url_count": url_count,
                "file_ops_count": file_ops_count,
                "api_call_count": api_call_count,
            } if triggered else None,
        )


def agent_resource_guard(
    *,
    action: str = "block",
    max_urls: int = 20,
    max_file_ops: int = 30,
    max_api_calls: int = 50,
) -> _AgentResourceGuard:
    return _AgentResourceGuard(
        action=action,
        max_urls=max_urls,
        max_file_ops=max_file_ops,
        max_api_calls=max_api_calls,
    )
