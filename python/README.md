# open-guardrail (Python)

**259 guards. Zero dependencies. Pure Python. <0.1ms latency.**

[![PyPI](https://img.shields.io/pypi/v/open-guardrail)](https://pypi.org/project/open-guardrail/)
[![Python](https://img.shields.io/pypi/pyversions/open-guardrail)](https://pypi.org/project/open-guardrail/)
[![License](https://img.shields.io/github/license/wonjangcloud9/open-guardrail)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-509_passing-green)](https://github.com/wonjangcloud9/open-guardrail)

## Install

```bash
pip install open-guardrail
```

## Quick Start

```python
from open_guardrail import pipe, prompt_injection, pii, keyword

pipeline = pipe(
    prompt_injection(action="block"),
    pii(entities=["email", "phone"], action="mask"),
    keyword(denied=["hack", "exploit"], action="block"),
)

result = pipeline.run("user input text here")
if not result.passed:
    print(f"Blocked: {result.action}")
# result.output contains masked text when PII is detected
```

## 259 Built-in Guards

### Security
`prompt_injection` `indirect_injection` `sql_injection` `xss_guard` `secret_pattern` `invisible_text` `canary_token` `encoding_attack` `data_leakage` `data_exfiltration` `path_traversal` `command_injection` `ssrf_detect` `jailbreak_pattern` `api_key_detect` `social_engineering` `unicode_confusable` `ascii_art` `data_poisoning` `prompt_leak` `semantic_firewall` `multimodal_safety` `rag_safety` `token_smuggling` `prompt_chaining` `output_filter_bypass` `model_denial` `agent_permission` `supply_chain_detect` `instruction_hierarchy` `context_window_abuse`

### Privacy — 26 PII Regions
`pii` `pii_kr` `pii_jp` `pii_cn` `pii_th` `pii_ar` `pii_in` `pii_eu` `pii_de` `pii_fr` `pii_br` `pii_au` `pii_ca` `pii_mx` `pii_sg` `pii_id` `pii_ru` `pii_pl` `pii_es` `pii_it` `pii_tr` `pii_vn` `pii_ng` `pii_za` `pii_ke` `pii_eg`

### Compliance
`gdpr_compliance` `eu_ai_act` `ai_basic_act_kr` `isms_p` `pipa` `appi` `pipl` `hipaa_detect` `pci_dss_detect` `sox_compliance` `ferpa_detect` `privacy_policy`

### AI / LLM Safety
`hallucination_url` `reasoning_trace_leak` `persona_consistency` `confidence_score` `content_watermark` `rate_limit_semantic`

### Content Safety
`toxicity` `bias` `hate_speech` `violence_detect` `sexual_content` `self_harm_detect` `profanity_en` `profanity_kr` `profanity_jp` `profanity_cn`

### Agent Safety
`agent_loop_detect` `tool_abuse` `escalation_detect` `rag_poisoning`

[Full guard list →](https://github.com/wonjangcloud9/open-guardrail#241-built-in-guards)

## Guard Composition

```python
from open_guardrail import compose, when, parallel

# Bundle guards
security = compose("security",
    prompt_injection(action="block"),
    sql_injection(action="block"),
)

# Conditional execution
long_text_check = when(lambda t: len(t) > 200, toxicity(action="block"))

# Parallel execution
fast = parallel(prompt_injection(action="block"), toxicity(action="block"))
```

## License

MIT
