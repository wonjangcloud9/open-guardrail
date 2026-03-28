"""Brazilian PII detection and masking guard."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_PATTERNS: dict[str, re.Pattern[str]] = {
    "cpf": re.compile(r"\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b"),
    "cnpj": re.compile(r"\b\d{2}\.?\d{3}\.?\d{3}/?\d{4}-?\d{2}\b"),
    "rg": re.compile(r"\b\d{2}\.?\d{3}\.?\d{3}-?[\dXx]\b"),
    "phone-br": re.compile(r"\b(?:\+55|0055)?\s?\(?\d{2}\)?\s?\d{4,5}[\s\-]?\d{4}\b"),
    "cep": re.compile(r"\b\d{5}-?\d{3}\b"),
}

_MASK_LABELS: dict[str, str] = {
    "cpf": "[CPF]",
    "cnpj": "[CNPJ]",
    "rg": "[RG]",
    "phone-br": "[TELEFONE-BR]",
    "cep": "[CEP]",
}


def _detect(text: str, entities: list[str]) -> list[dict]:
    matches: list[dict] = []
    for entity in entities:
        pat = _PATTERNS.get(entity)
        if not pat:
            continue
        for m in pat.finditer(text):
            matches.append({"type": entity, "value": m.group(), "start": m.start(), "end": m.end()})
    matches.sort(key=lambda x: x["start"], reverse=True)
    return matches


def _mask(text: str, matches: list[dict]) -> str:
    result = text
    for m in matches:
        result = result[: m["start"]] + _MASK_LABELS.get(m["type"], "[PII]") + result[m["end"] :]
    return result


class _PiiBr:
    def __init__(self, *, action: str = "block", entities: Optional[List[str]] = None) -> None:
        self.name = "pii-br"
        self.action = action
        self._entities = entities or list(_PATTERNS.keys())

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        matches = _detect(text, self._entities)
        elapsed = (time.perf_counter() - start) * 1000
        if not matches:
            return GuardResult(guard_name="pii-br", passed=True, action="allow", latency_ms=round(elapsed, 2))
        detected = [{"type": m["type"], "value": m["value"]} for m in matches]
        if self.action == "mask":
            return GuardResult(guard_name="pii-br", passed=True, action="override", override_text=_mask(text, matches), latency_ms=round(elapsed, 2), details={"detected": detected})
        return GuardResult(guard_name="pii-br", passed=False, action=self.action, message="Brazilian PII detected", latency_ms=round(elapsed, 2), details={"detected": detected})


def pii_br(*, action: str = "block", entities: Optional[List[str]] = None) -> _PiiBr:
    return _PiiBr(action=action, entities=entities)
