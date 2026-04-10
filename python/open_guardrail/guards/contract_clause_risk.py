"""Flag high-risk contract clauses in generated legal text."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_CLAUSES: list[tuple[str, re.Pattern[str], str]] = [
    ("unlimited-liability", re.compile(r"\bunlimited\s+liability\b", re.I), "high"),
    ("unlimited-liability", re.compile(r"\bno\s+cap\s+on\s+damages\b", re.I), "high"),
    ("unlimited-liability", re.compile(r"\bunlimited\s+indemnification\b", re.I), "high"),
    ("auto-renewal", re.compile(r"\bauto[- ]?renewal\b", re.I), "medium"),
    ("auto-renewal", re.compile(r"\bautomatically\s+renew\b", re.I), "medium"),
    ("auto-renewal", re.compile(r"\bevergreen\s+clause\b", re.I), "medium"),
    ("unilateral-termination", re.compile(r"\bterminate\s+at\s+will\b", re.I), "high"),
    ("unilateral-termination", re.compile(r"\bterminate\s+without\s+cause\b", re.I), "high"),
    ("unilateral-termination", re.compile(r"\bsole\s+discretion\s+to\s+terminate\b", re.I), "high"),
    ("waiver-of-rights", re.compile(r"\bwaive\s+all\s+rights\b", re.I), "high"),
    ("waiver-of-rights", re.compile(r"\bwaive\s+right\s+to\s+sue\b", re.I), "high"),
]


class _ContractClauseRisk:
    def __init__(self, *, action: str = "warn") -> None:
        self.name = "contract-clause-risk"
        self.action = action

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        found: list[dict[str, str]] = []
        for cat, pat, risk in _CLAUSES:
            m = pat.search(text)
            if m:
                found.append({"category": cat, "risk": risk, "match": m.group()})
        # Non-compete + broad scope
        if re.search(r"\bnon[- ]?compete\b", text, re.I):
            if re.search(r"\b(?:worldwide|perpetual|indefinite|all\s+industries)\b", text, re.I):
                found.append({"category": "non-compete-broad", "risk": "high", "match": "non-compete + broad scope"})
        # Mandatory arbitration + jury waiver
        if re.search(r"\bmandatory\s+arbitration\b", text, re.I):
            if re.search(r"\bwaive\s+jury\b", text, re.I):
                found.append({"category": "mandatory-arbitration-jury-waiver", "risk": "high", "match": "mandatory arbitration + jury waiver"})
        # Broad IP assignment
        ip_broad = bool(re.search(r"\b(?:all\s+intellectual\s+property|assign\s+all\s+IP)\b", text, re.I))
        wfh = bool(re.search(r"\bwork\s+for\s+hire\b", text, re.I)) and bool(re.search(r"\bperpetual\b", text, re.I))
        if ip_broad or wfh:
            found.append({"category": "ip-assignment-broad", "risk": "high", "match": "broad IP assignment"})
        triggered = len(found) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="contract-clause-risk",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"{len(found)} risky clause(s): {', '.join(f['category'] for f in found)}" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"risky_clauses": found} if triggered else None,
        )


def contract_clause_risk(*, action: str = "warn") -> _ContractClauseRisk:
    return _ContractClauseRisk(action=action)
