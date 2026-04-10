"""Detect potential license compliance issues in generated code."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_PERMISSIVE = {
    "mit",
    "apache-2.0",
    "apache",
    "bsd-2-clause",
    "bsd-3-clause",
    "bsd",
    "isc",
    "unlicense",
    "cc0",
}

_COPYLEFT: list[re.Pattern[str]] = [
    re.compile(r"\bGPL\b"),
    re.compile(r"\bAGPL\b"),
    re.compile(r"\bLGPL\b"),
    re.compile(r"\bSSPL\b"),
    re.compile(r"\bEUPL\b"),
    re.compile(r"GPLv[23]"),
    re.compile(r"AGPL-3\.0"),
    re.compile(
        r"GNU\s+General\s+Public", re.IGNORECASE
    ),
    re.compile(r"GNU\s+Affero", re.IGNORECASE),
    re.compile(
        r"Licensed\s+under\s+(?:the\s+)?GPL",
        re.IGNORECASE,
    ),
    re.compile(
        r"Licensed\s+under\s+(?:the\s+)?AGPL",
        re.IGNORECASE,
    ),
    re.compile(
        r"Licensed\s+under\s+(?:the\s+)?LGPL",
        re.IGNORECASE,
    ),
]

_PROPRIETARY: list[re.Pattern[str]] = [
    re.compile(r"All\s+rights\s+reserved", re.IGNORECASE),
    re.compile(r"\bproprietary\b", re.IGNORECASE),
    re.compile(
        r"\bconfidential\s+and\s+proprietary\b",
        re.IGNORECASE,
    ),
    re.compile(r"do\s+not\s+distribute", re.IGNORECASE),
    re.compile(
        r"not\s+for\s+redistribution", re.IGNORECASE
    ),
]

_COPYRIGHT = re.compile(
    r"Copyright\s+\(c\)\s+\d{4}", re.IGNORECASE
)

_LICENSE_FILE_REF: list[re.Pattern[str]] = [
    re.compile(
        r"see\s+(?:the\s+)?LICENSE\s+file",
        re.IGNORECASE,
    ),
    re.compile(
        r"see\s+(?:the\s+)?NOTICE\s+file",
        re.IGNORECASE,
    ),
    re.compile(
        r"refer\s+to\s+(?:the\s+)?LICENSE",
        re.IGNORECASE,
    ),
]


class _CodegenLicenseConflict:
    def __init__(
        self,
        *,
        action: str = "block",
        project_license: str = "MIT",
    ) -> None:
        self.name = "codegen-license-conflict"
        self.action = action
        self._proj = project_license.lower()
        self._is_permissive = self._proj in _PERMISSIVE

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []

        if self._is_permissive:
            for pat in _COPYLEFT:
                m = pat.search(text)
                if m:
                    issues.append(
                        f'copyleft license "{m.group()}"'
                        f" incompatible with"
                        f" {self._proj}"
                    )

        for pat in _PROPRIETARY:
            m = pat.search(text)
            if m:
                issues.append(
                    f'proprietary marker: "{m.group()}"'
                )

        cm = _COPYRIGHT.search(text)
        if cm:
            issues.append(
                f'third-party copyright: "{cm.group()}"'
            )

        for pat in _LICENSE_FILE_REF:
            m = pat.search(text)
            if m:
                issues.append(
                    f'license file reference: "{m.group()}"'
                )

        unique = list(dict.fromkeys(issues))
        triggered = len(unique) > 0
        elapsed = (time.perf_counter() - start) * 1000

        preview = "; ".join(unique[:3])
        if len(unique) > 3:
            preview += f" (+{len(unique) - 3} more)"

        return GuardResult(
            guard_name="codegen-license-conflict",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                f"License conflict: {preview}"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "issues": unique,
                    "projectLicense": self._proj,
                    "reason": (
                        "Code contains license references"
                        " that may conflict with"
                        " project license"
                    ),
                }
                if triggered
                else None
            ),
        )


def codegen_license_conflict(
    *,
    action: str = "block",
    project_license: str = "MIT",
) -> _CodegenLicenseConflict:
    return _CodegenLicenseConflict(
        action=action,
        project_license=project_license,
    )
