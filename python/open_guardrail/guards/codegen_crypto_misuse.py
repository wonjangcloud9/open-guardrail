"""Detect cryptographic misuse in generated code (CWE-327)."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_WEAK_HASH: list[re.Pattern[str]] = [
    re.compile(r"\bMD5\s*\("),
    re.compile(r"\bmd5\s*\("),
    re.compile(r"\bSHA1\s*\("),
    re.compile(r"\bsha1\s*\("),
    re.compile(r"hashlib\.md5\s*\("),
    re.compile(r"hashlib\.sha1\s*\("),
    re.compile(
        r"crypto\.createHash\(\s*['\"]md5['\"]\s*\)"
    ),
    re.compile(
        r"crypto\.createHash\(\s*['\"]sha1['\"]\s*\)"
    ),
]

_WEAK_ENCRYPTION: list[re.Pattern[str]] = [
    re.compile(r"\bDES\b"),
    re.compile(r"\bRC4\b"),
    re.compile(r"\bECB\b"),
    re.compile(r"\bBlowfish\b", re.IGNORECASE),
    re.compile(r"DES\.new\s*\("),
    re.compile(r"DESede"),
    re.compile(r"AES\.MODE_ECB"),
    re.compile(r"mode:\s*['\"]ECB['\"]"),
]

_HARDCODED_IV: list[re.Pattern[str]] = [
    re.compile(r"\biv\s*=\s*b\"", re.IGNORECASE),
    re.compile(r"\biv\s*=\s*\"", re.IGNORECASE),
    re.compile(r"\bIV\s*=\s*\""),
    re.compile(r"\bnonce\s*=\s*b\""),
    re.compile(r"\bnonce\s*=\s*\""),
]

_INSECURE_RANDOM: list[re.Pattern[str]] = [
    re.compile(r"Math\.random\s*\(\)"),
    re.compile(r"random\.random\s*\(\)"),
    re.compile(r"\brand\s*\(\s*\)"),
]

_NO_SALT: list[re.Pattern[str]] = [
    re.compile(r"\.hashpw\s*\([^,)]+\)"),
    re.compile(
        r"pbkdf2.*iterations\s*=\s*[12]\b",
        re.IGNORECASE,
    ),
    re.compile(r"hash\s*\(\s*password\s*\)", re.IGNORECASE),
]

_ALL = (
    _WEAK_HASH
    + _WEAK_ENCRYPTION
    + _HARDCODED_IV
    + _INSECURE_RANDOM
    + _NO_SALT
)


class _CodegenCryptoMisuse:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "codegen-crypto-misuse"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []

        for pat in _ALL:
            m = pat.search(text)
            if m:
                matched.append(m.group().strip())

        unique = list(dict.fromkeys(matched))
        triggered = len(unique) > 0
        elapsed = (time.perf_counter() - start) * 1000

        preview = ", ".join(unique[:3])
        if len(unique) > 3:
            preview += f" (+{len(unique) - 3} more)"

        return GuardResult(
            guard_name="codegen-crypto-misuse",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                f"Crypto misuse detected: {preview}"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "matched": unique,
                    "reason": (
                        "Code contains weak or insecure"
                        " cryptographic patterns"
                    ),
                }
                if triggered
                else None
            ),
        )


def codegen_crypto_misuse(
    *, action: str = "block"
) -> _CodegenCryptoMisuse:
    return _CodegenCryptoMisuse(action=action)
