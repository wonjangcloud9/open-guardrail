"""Number format validation guard."""

import re
import time

from open_guardrail.core import GuardResult


class _NumberFormat:
    def __init__(self, *, action: str = "warn", decimal_separator: str = ".", thousands_separator: str = ",") -> None:
        self.name = "number-format"
        self.action = action
        self.dec = decimal_separator
        self.thou = thousands_separator

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        wrong_dec = "," if self.dec == "." else "."
        wrong_pat = re.compile(r"\d" + re.escape(wrong_dec) + r"\d{1,2}\b")
        violations = wrong_pat.findall(text)
        triggered = len(violations) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(guard_name="number-format", passed=not triggered, action=self.action if triggered else "allow", message=f"Wrong decimal separator found" if triggered else None, latency_ms=round(elapsed, 2), details={"expected_decimal": self.dec, "violations": len(violations)} if triggered else None)


def number_format(*, action: str = "warn", decimal_separator: str = ".", thousands_separator: str = ",") -> _NumberFormat:
    return _NumberFormat(action=action, decimal_separator=decimal_separator, thousands_separator=thousands_separator)
