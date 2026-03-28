"""Prevent chatbot identity confusion."""
from __future__ import annotations

import re
import time
from typing import Optional

from open_guardrail.core import GuardResult

_HUMAN_CLAIM: list[re.Pattern[str]] = [
    re.compile(
        r"\bI\s+am\s+(a\s+)?human\b", re.IGNORECASE
    ),
    re.compile(
        r"\bI'?m\s+(a\s+)?real\s+person\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bI\s+have\s+(real\s+)?feelings\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bI\s+am\s+not\s+(an?\s+)?AI\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bI\s+am\s+not\s+(an?\s+)?"
        r"(artificial|machine|robot|bot)\b",
        re.IGNORECASE,
    ),
]

_DIFFERENT_AI: list[re.Pattern[str]] = [
    re.compile(r"\bI\s+am\s+ChatGPT\b", re.IGNORECASE),
    re.compile(r"\bI\s+am\s+GPT-?\d", re.IGNORECASE),
    re.compile(r"\bI\s+am\s+Gemini\b", re.IGNORECASE),
    re.compile(r"\bI\s+am\s+Bard\b", re.IGNORECASE),
    re.compile(r"\bI\s+am\s+Copilot\b", re.IGNORECASE),
    re.compile(r"\bI\s+am\s+Claude\b", re.IGNORECASE),
    re.compile(r"\bI\s+am\s+Siri\b", re.IGNORECASE),
    re.compile(r"\bI\s+am\s+Alexa\b", re.IGNORECASE),
    re.compile(
        r"\bI\s+was\s+(created|made|built)"
        r"\s+by\s+OpenAI\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bI\s+was\s+(created|made|built)"
        r"\s+by\s+Google\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bI\s+was\s+(created|made|built)"
        r"\s+by\s+Anthropic\b",
        re.IGNORECASE,
    ),
]

_DENY_AI: list[re.Pattern[str]] = [
    re.compile(
        r"\bI'?m\s+not\s+(an?\s+)?"
        r"(AI|artificial|bot|language\s+model)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bdon'?t\s+call\s+me\s+(an?\s+)?"
        r"(AI|bot|machine)\b",
        re.IGNORECASE,
    ),
]


class _ChatbotIdentity:
    def __init__(
        self,
        *,
        action: str = "block",
        bot_name: Optional[str] = None,
    ) -> None:
        self.name = "chatbot-identity"
        self.action = action
        self._bot_name = (
            bot_name.lower() if bot_name else None
        )

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []

        for p in _HUMAN_CLAIM:
            if p.search(text):
                issues.append("claims_human")
        for p in _DENY_AI:
            if p.search(text):
                issues.append("denies_ai")
        for p in _DIFFERENT_AI:
            m = p.search(text)
            if m:
                claimed = m.group(0).lower()
                if (
                    not self._bot_name
                    or self._bot_name not in claimed
                ):
                    issues.append("wrong_identity")

        unique = list(dict.fromkeys(issues))
        triggered = len(unique) > 0
        score = (
            min(len(unique) / 3, 1.0)
            if triggered
            else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="chatbot-identity",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Identity confusion detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"issues": unique} if triggered else None
            ),
        )


def chatbot_identity(
    *,
    action: str = "block",
    bot_name: Optional[str] = None,
) -> _ChatbotIdentity:
    return _ChatbotIdentity(
        action=action, bot_name=bot_name
    )
