"""LangChain Python adapter for open-guardrail."""

from __future__ import annotations

from typing import Any, Optional, Sequence

from open_guardrail.core import Guard, Pipeline
from open_guardrail.decorators import GuardrailBlocked


class GuardrailRunnable:
    """LangChain-compatible Runnable that guards input/output.

    Usage with LCEL:
        from langchain_openai import ChatOpenAI
        from open_guardrail.adapters.langchain_adapter import GuardrailRunnable
        from open_guardrail.guards import prompt_injection, toxicity

        guardrail = GuardrailRunnable(
            guards=[prompt_injection(action="block"), toxicity(action="block")]
        )

        # Use as input guard
        chain = guardrail | ChatOpenAI(model="gpt-4o") | guardrail
    """

    def __init__(
        self,
        guards: Sequence[Guard],
        stage: str = "input",
        on_block: str = "raise",
    ):
        self.pipeline = Pipeline(guards)
        self.stage = stage
        self.on_block = on_block

    def invoke(self, input: Any, config: Optional[dict] = None) -> Any:
        """Process input through guardrail pipeline."""
        text = self._extract_text(input)
        result = self.pipeline.run(text, self.stage)

        if not result.passed:
            if self.on_block == "raise":
                raise GuardrailBlocked(result)
            return self.on_block

        # Return guarded text or original input
        if result.output:
            return result.output
        return input

    def _extract_text(self, input: Any) -> str:
        """Extract text from various LangChain input types."""
        if isinstance(input, str):
            return input
        if isinstance(input, dict):
            return str(
                input.get(
                    "content",
                    input.get("text", input.get("input", str(input))),
                )
            )
        if isinstance(input, list):
            texts = []
            for item in input:
                if isinstance(item, dict):
                    texts.append(str(item.get("content", "")))
                elif hasattr(item, "content"):
                    texts.append(str(item.content))
                else:
                    texts.append(str(item))
            return " ".join(texts)
        if hasattr(input, "content"):
            return str(input.content)
        return str(input)

    def __or__(self, other):
        """Support pipe operator for LCEL: guardrail | llm"""
        return _PipedChain(self, other)

    def __ror__(self, other):
        """Support pipe operator: llm | guardrail"""
        return _PipedChain(other, self)


class _PipedChain:
    """Minimal chain for pipe operator support."""

    def __init__(self, first, second):
        self.first = first
        self.second = second

    def invoke(self, input, config=None):
        intermediate = self.first.invoke(input, config)
        return self.second.invoke(intermediate, config)

    def __or__(self, other):
        return _PipedChain(self, other)
