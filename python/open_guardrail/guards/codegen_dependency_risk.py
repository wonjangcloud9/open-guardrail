"""Detect risky or hallucinated package dependencies."""
from __future__ import annotations

import re
import time
from typing import List, Optional, Set

from open_guardrail.core import GuardResult

_INSTALL_CMD = re.compile(
    r"(?:pip\s+install|npm\s+install|yarn\s+add"
    r"|pnpm\s+add|gem\s+install|cargo\s+add)\s+(.+)",
    re.IGNORECASE,
)

_DANGEROUS_FLAGS: list[re.Pattern[str]] = [
    re.compile(r"--force\b"),
    re.compile(r"--no-verify\b"),
    re.compile(r"--ignore-scripts\b"),
    re.compile(r"--unsafe-perm\b"),
    re.compile(r"--trust-server-names\b"),
]

_SUSPICIOUS_REGISTRY: list[re.Pattern[str]] = [
    re.compile(
        r"--registry\s+https?://(?!registry\.npmjs\.org"
        r"|pypi\.org)",
        re.IGNORECASE,
    ),
    re.compile(
        r"--index-url\s+https?://(?!pypi\.org)",
        re.IGNORECASE,
    ),
    re.compile(r"--extra-index-url\s+", re.IGNORECASE),
]

_KNOWN_TYPOSQUATS: dict[str, str] = {
    "requets": "requests",
    "reqeusts": "requests",
    "lodahs": "lodash",
    "lodasg": "lodash",
    "axois": "axios",
    "axos": "axios",
    "expresss": "express",
    "djnago": "django",
    "flaask": "flask",
    "numppy": "numpy",
    "padas": "pandas",
    "tensoflow": "tensorflow",
    "colrs": "colors",
    "chak": "chalk",
}


def _is_suspicious_name(name: str) -> bool:
    if len(name) <= 2:
        return True
    if (
        re.fullmatch(r"[a-z0-9]{10,}", name)
        and not re.search(r"[aeiou]{2}", name, re.IGNORECASE)
    ):
        return True
    if re.match(r"^\d", name):
        return True
    return False


class _CodegenDependencyRisk:
    def __init__(
        self,
        *,
        action: str = "block",
        known_packages: Optional[list[str]] = None,
    ) -> None:
        self.name = "codegen-dependency-risk"
        self.action = action
        self._known: Optional[set[str]] = (
            {p.lower() for p in known_packages}
            if known_packages
            else None
        )

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []

        for cm in _INSTALL_CMD.finditer(text):
            args = cm.group(1).strip().split()
            for arg in args:
                if arg.startswith("-"):
                    continue
                pkg = re.sub(r"@[^@]*$", "", arg).lower()
                if not pkg:
                    continue
                if pkg in _KNOWN_TYPOSQUATS:
                    real = _KNOWN_TYPOSQUATS[pkg]
                    issues.append(
                        f'typosquat "{pkg}"'
                        f' (did you mean "{real}"?)'
                    )
                if _is_suspicious_name(pkg):
                    issues.append(
                        f'suspicious package name "{pkg}"'
                    )
                if self._known is not None and pkg not in self._known:
                    issues.append(
                        f'unknown package "{pkg}"'
                    )

        for flag in _DANGEROUS_FLAGS:
            fm = flag.search(text)
            if fm:
                issues.append(
                    f"dangerous flag: {fm.group()}"
                )

        for reg in _SUSPICIOUS_REGISTRY:
            rm = reg.search(text)
            if rm:
                issues.append(
                    f"suspicious registry:"
                    f" {rm.group().strip()}"
                )

        unique = list(dict.fromkeys(issues))
        triggered = len(unique) > 0
        elapsed = (time.perf_counter() - start) * 1000

        preview = "; ".join(unique[:3])
        if len(unique) > 3:
            preview += f" (+{len(unique) - 3} more)"

        return GuardResult(
            guard_name="codegen-dependency-risk",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                f"Dependency risk: {preview}"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "issues": unique,
                    "reason": (
                        "Code references risky or suspicious"
                        " package dependencies"
                    ),
                }
                if triggered
                else None
            ),
        )


def codegen_dependency_risk(
    *,
    action: str = "block",
    known_packages: Optional[list[str]] = None,
) -> _CodegenDependencyRisk:
    return _CodegenDependencyRisk(
        action=action,
        known_packages=known_packages,
    )
