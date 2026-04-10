"""Detects dangerous file system operations."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_DANGEROUS_PATHS = [
    "/etc/passwd",
    "/etc/shadow",
    "~/.ssh",
    "/root",
    "/proc",
    "/sys",
    "C:\\Windows\\System32",
]

_DANGEROUS_OPS = ["unlink", "rmdir", "chmod 777", "chown root", "mkfs", "fdisk"]

_DEFAULT_DENIED_EXTENSIONS = [".exe", ".sh", ".bat", ".cmd", ".ps1", ".dll", ".so", ".dylib"]

_PATH_PATTERN = re.compile(r"(?:/[\w.~-]+){2,}|[A-Z]:\\[\w.~\\-]+", re.IGNORECASE)


class _FileSystemGuard:
    def __init__(
        self,
        *,
        action: str = "block",
        allowed_paths: Optional[List[str]] = None,
        denied_extensions: Optional[List[str]] = None,
    ) -> None:
        self.name = "file-system-guard"
        self.action = action
        self.allowed_paths = allowed_paths
        self.denied_extensions = denied_extensions if denied_extensions is not None else _DEFAULT_DENIED_EXTENSIONS

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        lower = text.lower()
        reasons: List[str] = []

        for dp in _DANGEROUS_PATHS:
            if dp.lower() in lower:
                reasons.append(f"dangerous path: {dp}")

        for op in _DANGEROUS_OPS:
            if op.lower() in lower:
                reasons.append(f"dangerous operation: {op}")

        for ext in self.denied_extensions:
            escaped = re.escape(ext)
            if re.search(rf"\S+{escaped}\b", text, re.IGNORECASE):
                reasons.append(f"denied extension: {ext}")

        if self.allowed_paths:
            detected_paths = _PATH_PATTERN.findall(text)
            for detected in detected_paths:
                if not any(detected.startswith(ap) for ap in self.allowed_paths):
                    reasons.append(f"path outside allowed: {detected}")

        triggered = len(reasons) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="file-system-guard",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"File system violations: {len(reasons)} issues found" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"reasons": reasons} if triggered else None,
        )


def file_system_guard(
    *,
    action: str = "block",
    allowed_paths: Optional[List[str]] = None,
    denied_extensions: Optional[List[str]] = None,
) -> _FileSystemGuard:
    return _FileSystemGuard(
        action=action,
        allowed_paths=allowed_paths,
        denied_extensions=denied_extensions,
    )
