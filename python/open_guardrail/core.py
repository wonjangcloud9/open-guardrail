"""Core engine: Guard protocol, Pipeline, composition utilities."""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Any, Callable, List, Optional, Protocol, Sequence


@dataclass
class GuardResult:
    guard_name: str
    passed: bool
    action: str  # 'allow' | 'block' | 'warn' | 'override'
    message: Optional[str] = None
    override_text: Optional[str] = None
    score: Optional[float] = None
    latency_ms: float = 0
    details: Optional[dict[str, Any]] = None


class Guard(Protocol):
    name: str

    def check(self, text: str, stage: str = "input") -> GuardResult: ...


@dataclass
class PipelineResult:
    passed: bool
    action: str
    output: Optional[str] = None
    results: list[GuardResult] = field(default_factory=list)
    latency_ms: float = 0


class Pipeline:
    def __init__(
        self,
        guards: Sequence[Guard],
        mode: str = "fail-fast",
    ) -> None:
        self._guards = list(guards)
        self._mode = mode

    def run(self, text: str, stage: str = "input") -> PipelineResult:
        start = time.perf_counter()
        results: list[GuardResult] = []
        current_text = text

        for guard in self._guards:
            result = guard.check(current_text, stage)
            results.append(result)

            if result.action == "override" and result.override_text:
                current_text = result.override_text

            if self._mode == "fail-fast" and not result.passed:
                break

        blocked = [r for r in results if not r.passed]
        elapsed = (time.perf_counter() - start) * 1000

        if blocked:
            return PipelineResult(
                passed=False,
                action=blocked[0].action,
                output=current_text,
                results=results,
                latency_ms=round(elapsed, 2),
            )

        return PipelineResult(
            passed=True,
            action="allow",
            output=current_text if current_text != text else None,
            results=results,
            latency_ms=round(elapsed, 2),
        )


def pipe(*guards: Guard) -> Pipeline:
    return Pipeline(guards)


def compose(name: str, *guards: Guard) -> Guard:
    class ComposedGuard:
        def __init__(self) -> None:
            self.name = name

        def check(self, text: str, stage: str = "input") -> GuardResult:
            start = time.perf_counter()
            current = text
            sub_results = []

            for g in guards:
                r = g.check(current, stage)
                sub_results.append(r)
                if r.action == "override" and r.override_text:
                    current = r.override_text
                if r.action == "block":
                    return GuardResult(
                        guard_name=name,
                        passed=False,
                        action="block",
                        message=r.message,
                        latency_ms=round(
                            (time.perf_counter() - start) * 1000, 2
                        ),
                        details={"blocked_by": r.guard_name},
                    )

            return GuardResult(
                guard_name=name,
                passed=True,
                action="allow",
                override_text=current if current != text else None,
                latency_ms=round(
                    (time.perf_counter() - start) * 1000, 2
                ),
            )

    return ComposedGuard()


def when(
    condition: Callable[[str], bool],
    guard: Guard,
) -> Guard:
    class ConditionalGuard:
        def __init__(self) -> None:
            self.name = f"when({guard.name})"

        def check(self, text: str, stage: str = "input") -> GuardResult:
            if not condition(text):
                return GuardResult(
                    guard_name=guard.name,
                    passed=True,
                    action="allow",
                    message="Condition not met - skipped",
                    latency_ms=0,
                )
            return guard.check(text, stage)

    return ConditionalGuard()


def parallel(*guards: Guard) -> Guard:
    import concurrent.futures

    class ParallelGuard:
        def __init__(self) -> None:
            self.name = f"parallel({len(guards)})"

        def check(self, text: str, stage: str = "input") -> GuardResult:
            start = time.perf_counter()

            with concurrent.futures.ThreadPoolExecutor() as executor:
                futures = {
                    executor.submit(g.check, text, stage): g
                    for g in guards
                }
                results = []
                for future in concurrent.futures.as_completed(futures):
                    try:
                        results.append(future.result())
                    except Exception as e:
                        g = futures[future]
                        results.append(
                            GuardResult(
                                guard_name=g.name,
                                passed=False,
                                action="block",
                                message=str(e),
                            )
                        )

            blocked = [r for r in results if not r.passed]
            elapsed = (time.perf_counter() - start) * 1000

            if blocked:
                return GuardResult(
                    guard_name=self.name,
                    passed=False,
                    action="block",
                    message=f"Blocked by: {', '.join(r.guard_name for r in blocked)}",
                    latency_ms=round(elapsed, 2),
                    details={
                        "blocked_by": [r.guard_name for r in blocked]
                    },
                )

            return GuardResult(
                guard_name=self.name,
                passed=True,
                action="allow",
                latency_ms=round(elapsed, 2),
            )

    return ParallelGuard()
