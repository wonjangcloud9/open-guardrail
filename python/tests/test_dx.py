"""Tests for DX features: decorators, presets, one-liners."""
import pytest
from open_guardrail import (
    guardrail, guard_input, guard_output,
    GuardrailBlocked, presets,
    prompt_injection, pii, keyword, pipe,
)


class TestPresets:
    def test_default_preset(self):
        p = presets.default()
        r = p.run("Hello world")
        assert r.passed

    def test_strict_preset(self):
        p = presets.strict()
        r = p.run("My email is user@example.com")
        assert r.output is not None  # masked

    def test_security_preset(self):
        p = presets.security()
        r = p.run("1 UNION SELECT * FROM users")
        assert not r.passed

    def test_korean_preset(self):
        p = presets.korean()
        r = p.run("안녕하세요")
        assert r.passed

    def test_multilingual_preset(self):
        p = presets.multilingual()
        r = p.run("Hello world")
        assert r.passed


class TestDecorators:
    def test_guardrail_decorator_allows(self):
        @guardrail(keyword(denied=["hack"], action="block"))
        def my_func(text: str) -> str:
            return f"Response to: {text}"

        result = my_func("hello world")
        assert "Response to:" in result

    def test_guardrail_decorator_blocks(self):
        @guardrail(keyword(denied=["hack"], action="block"))
        def my_func(text: str) -> str:
            return f"Response: {text}"

        with pytest.raises(GuardrailBlocked):
            my_func("how to hack")

    def test_guardrail_fallback(self):
        @guardrail(keyword(denied=["hack"], action="block"), on_block="Sorry, blocked.")
        def my_func(text: str) -> str:
            return text

        result = my_func("how to hack")
        assert result == "Sorry, blocked."

    def test_guard_input_only(self):
        @guard_input(pii(entities=["email"], action="mask"))
        def my_func(text: str) -> str:
            return text

        result = my_func("email: user@example.com")
        assert "[EMAIL]" in result

    def test_guard_output_only(self):
        @guard_output(keyword(denied=["secret"], action="block"))
        def my_func(text: str) -> str:
            return "This is a secret response"

        with pytest.raises(GuardrailBlocked):
            my_func("hello")


class TestOneLiner:
    def test_pipe_one_liner(self):
        result = pipe(
            prompt_injection(action="block"),
            pii(entities=["email"], action="mask"),
        ).run("My email is user@test.com")
        assert result.passed
        assert "[EMAIL]" in (result.output or "")
