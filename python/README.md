# open-guardrail (Python)

Open-source guardrail engine for LLM applications. Zero dependencies. Pure Python.

[![PyPI](https://img.shields.io/pypi/v/open-guardrail)](https://pypi.org/project/open-guardrail/)
[![Python](https://img.shields.io/pypi/pyversions/open-guardrail)](https://pypi.org/project/open-guardrail/)
[![License](https://img.shields.io/github/license/wonjangcloud9/open-guardrail)](LICENSE)

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

## 24 Built-in Guards

| Guard | Description |
|-------|-------------|
| `prompt_injection` | Jailbreak and prompt injection detection |
| `sql_injection` | SQL injection (3 sensitivity levels) |
| `xss_guard` | Cross-site scripting detection + sanitize |
| `secret_pattern` | Credentials, API keys, connection strings |
| `invisible_text` | Zero-width/bidi unicode detection |
| `canary_token` | System prompt leakage detection |
| `pii` | Email, phone, SSN, passport, ITIN, Medicare |
| `pii_kr` | Korean PII (주민등록번호, 여권, 면허 등) |
| `pii_jp` | Japanese PII (マイナンバー, パスポート 등) |
| `pii_cn` | Chinese PII (身份证, 护照, 手机号 등) |
| `keyword` | Deny/allow keyword lists |
| `toxicity` | Profanity, hate, threats, harassment |
| `profanity_kr` | Korean profanity (초성 + 변형) |
| `profanity_jp` | Japanese profanity (ひらがな/カタカナ/漢字) |
| `profanity_cn` | Chinese profanity (pinyin abbreviations) |
| `gibberish_detect` | Nonsensical input detection |
| `no_refusal` | LLM refusal response detection |
| `ban_code` | Code block detection (7 languages) |
| `ban_substring` | Substring blocking |
| `valid_range` | Number range validation |
| `valid_choice` | Valid choice validation |
| `readability` | Flesch Reading Ease score |
| `reading_time` | Reading time estimation |
| `word_count` | Word/character limits |

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
