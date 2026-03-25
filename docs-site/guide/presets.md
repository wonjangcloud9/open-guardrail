# Presets

Pre-configured guard combinations for common use cases.

## Available Presets

| Preset | Guards | Use Case |
|--------|--------|----------|
| `default` | promptInjection, keyword, wordCount | Basic protection |
| `strict` | promptInjection, pii (mask), keyword, toxicity, wordCount | Full blocking + masking |
| `korean` | piiKr, profanityKr, residentId, creditInfo, ismsP, pipa | Korean regulatory compliance |
| `security` | promptInjection, pii, dataLeakage, regex, keyword | Security-focused |
| `content` | toxicity, bias, language, sentiment | Content moderation |
| `ai-basic-act-kr` | bias, pii, piiKr, toxicity, profanityKr | 한국 AI 기본법 |
| `eu-ai-act` | bias, pii, toxicity, watermarkDetect, copyright | EU AI Act |

## Using Presets

### YAML

```yaml
version: "1"
preset: korean
```

### Preset Files

Presets are defined in the `presets/` directory:

```
presets/
├── default.yaml
├── strict.yaml
├── korean.yaml
├── security.yaml
├── content.yaml
├── ai-basic-act-kr.yaml
└── eu-ai-act.yaml
```

You can use these as starting points and customize them for your needs.
