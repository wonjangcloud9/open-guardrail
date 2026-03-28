"""Detect supply chain attack patterns in code snippets."""

import re
import time

from open_guardrail.core import GuardResult

_PATTERNS: list[re.Pattern[str]] = [
    re.compile(
        r"(?:npm|npx)\s+install\s+[a-z0-9]"
        r"(?:[a-z0-9._-]*[a-z0-9])?"
        r"\s+--(?:unsafe-perm|ignore-scripts=false)",
        re.IGNORECASE,
    ),
    re.compile(
        r"pip\s+install\s+--(?:pre|no-verify)",
        re.IGNORECASE,
    ),
    re.compile(
        r"[\"']?postinstall[\"']?\s*:\s*[\"']",
        re.IGNORECASE,
    ),
    re.compile(
        r"eval\s*\(\s*(?:fetch|axios|http|request|require)"
        r".*(?:https?://)",
        re.IGNORECASE,
    ),
    re.compile(
        r"require\s*\(\s*[\"']https?://",
        re.IGNORECASE,
    ),
    re.compile(
        r"(?:import|from)\s+.*(?:cdn|unpkg|jsdelivr"
        r"|cloudflare|rawgit|raw\.githubusercontent)",
        re.IGNORECASE,
    ),
    re.compile(
        r"(?:require|import)\s*\(?\s*[\"']"
        r"(?:lod[a4]sh|reqeusts|crypt0|col[o0]rs"
        r"|ev[e3]nt-stream|cr[o0]ss-env"
        r"|flatm[a4]p-stream)[\"']",
        re.IGNORECASE,
    ),
    re.compile(
        r"(?:require|import)\s*\(?\s*"
        r"(?:Buffer\.from|atob|btoa)\s*\(\s*[\"']"
        r"[A-Za-z0-9+/=]{20,}",
        re.IGNORECASE,
    ),
    re.compile(
        r"(?:exec|spawn|system|popen)\s*\("
        r".*(?:curl|wget|nc|bash\s+-c)\s+",
        re.IGNORECASE,
    ),
    re.compile(
        r"(?:process\.env|os\.environ)"
        r".*(?:curl|wget|fetch|http)",
        re.IGNORECASE,
    ),
    re.compile(
        r"eval\s*\(\s*(?:atob|Buffer\.from)\s*\(",
        re.IGNORECASE,
    ),
    re.compile(
        r"pip\s+install\s+(?:reqeusts|djang0"
        r"|numppy|pandsa|scikitlearn|flak|beautifulsop"
        r"|request[sz]|python-dateuti|urllib4)",
        re.IGNORECASE,
    ),
]


class _SupplyChainDetect:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "supply-chain-detect"
        self.action = action

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []

        for pat in _PATTERNS:
            if pat.search(text):
                matched.append(pat.pattern)

        triggered = len(matched) > 0
        score = min(len(matched) / 3, 1.0) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="supply-chain-detect",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Supply chain attack pattern detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "matched_patterns": len(matched),
                    "reason": (
                        "Text contains suspicious package"
                        " installation or code execution"
                        " patterns indicative of supply"
                        " chain attacks"
                    ),
                }
                if triggered
                else None
            ),
        )


def supply_chain_detect(
    *, action: str = "block"
) -> _SupplyChainDetect:
    return _SupplyChainDetect(action=action)
