"""Ready-to-use preset pipelines. One line to protect your LLM."""

from open_guardrail.core import Pipeline
from open_guardrail.guards import (
    prompt_injection, pii, pii_kr, pii_jp, pii_cn,
    keyword, toxicity, sql_injection, xss_guard,
    secret_pattern, invisible_text, no_refusal,
    profanity_kr, profanity_jp, profanity_cn,
    word_count,
)


def default() -> Pipeline:
    """Basic protection — prompt injection + keyword blocking."""
    return Pipeline([
        prompt_injection(action="block"),
        keyword(denied=[], action="block"),
        word_count(max_count=4000, action="warn"),
    ])


def strict() -> Pipeline:
    """Full blocking + PII masking."""
    return Pipeline([
        prompt_injection(action="block"),
        pii(entities=["email", "phone", "credit-card", "ssn"], action="mask"),
        keyword(denied=[], action="block"),
        toxicity(action="block"),
        word_count(max_count=4000, action="block"),
    ])


def security() -> Pipeline:
    """Comprehensive security — injection, XSS, secrets, invisible text."""
    return Pipeline([
        prompt_injection(action="block"),
        sql_injection(action="block", sensitivity="high"),
        xss_guard(action="block"),
        invisible_text(action="block"),
        secret_pattern(action="block"),
    ])


def korean() -> Pipeline:
    """Korean compliance — ISMS-P, PIPA style."""
    return Pipeline([
        prompt_injection(action="block"),
        pii_kr(entities=["resident-id", "passport", "driver-license", "business-id"], action="mask"),
        profanity_kr(action="block"),
    ])


def japanese() -> Pipeline:
    """Japanese compliance — APPI style."""
    return Pipeline([
        prompt_injection(action="block"),
        pii_jp(entities=["my-number", "passport"], action="mask"),
        profanity_jp(action="block"),
    ])


def chinese() -> Pipeline:
    """Chinese compliance — PIPL style."""
    return Pipeline([
        prompt_injection(action="block"),
        pii_cn(entities=["id-card", "passport", "phone"], action="mask"),
        profanity_cn(action="block"),
    ])


def multilingual() -> Pipeline:
    """All-language PII + profanity protection."""
    return Pipeline([
        prompt_injection(action="block"),
        pii(entities=["email", "phone", "credit-card", "ssn"], action="mask"),
        pii_kr(entities=["resident-id", "passport"], action="mask"),
        pii_jp(entities=["my-number", "passport"], action="mask"),
        pii_cn(entities=["id-card", "passport", "phone"], action="mask"),
        toxicity(action="block"),
        profanity_kr(action="block"),
        profanity_jp(action="block"),
        profanity_cn(action="block"),
    ])
