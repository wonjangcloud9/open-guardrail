"""Chinese profanity detection with pinyin variants."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_BASE_WORDS: list[str] = [
    "他妈的", "操你妈", "你妈逼", "傻逼", "草泥马",
    "混蛋", "王八蛋", "狗屎", "去死", "废物",
    "白痴", "智障", "脑残", "贱人", "婊子",
    "滚蛋", "放屁", "妈的", "靠", "卧槽",
    "牛逼", "装逼", "逗比", "屌丝",
]

_PINYIN_VARIANTS: dict[str, str] = {
    "TMD": "他妈的",
    "tmd": "他妈的",
    "cnm": "操你妈",
    "CNM": "操你妈",
    "nmb": "你妈逼",
    "NMB": "你妈逼",
    "sb": "傻逼",
    "SB": "傻逼",
    "wc": "卧槽",
    "WC": "卧槽",
    "nb": "牛逼",
    "NB": "牛逼",
}

_VARIANT_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"[操草艹肏]你[妈吗嗎马]"), "操你妈"),
    (re.compile(r"[傻煞][逼比屄]"), "傻逼"),
    (re.compile(r"[草艹肏]泥[马馬]"), "草泥马"),
    (re.compile(r"他[妈吗嗎马]的"), "他妈的"),
    (re.compile(r"[卧我][槽草艹]"), "卧槽"),
    (re.compile(r"[牛\U0001F402][逼比屄]"), "牛逼"),
    (re.compile(r"[装裝][逼比屄]"), "装逼"),
]


def _find_base(text: str) -> list[str]:
    return [w for w in _BASE_WORDS if w in text]


def _find_pinyin(text: str) -> list[str]:
    found: list[str] = []
    for abbr, word in _PINYIN_VARIANTS.items():
        pat = re.compile(rf"\b{re.escape(abbr)}\b")
        if pat.search(text):
            found.append(f"{abbr}({word})")
    return found


def _find_variants(text: str) -> list[str]:
    found: list[str] = []
    for pat, label in _VARIANT_PATTERNS:
        if pat.search(text):
            found.append(label)
    return found


class _ProfanityCn:
    def __init__(
        self,
        *,
        action: str = "block",
        detect_variants: bool = True,
    ) -> None:
        self.name = "profanity-cn"
        self.action = action
        self._detect_variants = detect_variants

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []

        matched.extend(_find_base(text))

        if self._detect_variants:
            matched.extend(_find_pinyin(text))
            matched.extend(_find_variants(text))

        unique = list(dict.fromkeys(matched))
        triggered = len(unique) > 0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="profanity-cn",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                "Chinese profanity detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "matched": unique,
                    "reason": (
                        "Text contains Chinese"
                        " profanity or variants"
                    ),
                }
                if triggered
                else None
            ),
        )


def profanity_cn(
    *,
    action: str = "block",
    detect_variants: bool = True,
) -> _ProfanityCn:
    return _ProfanityCn(
        action=action,
        detect_variants=detect_variants,
    )
