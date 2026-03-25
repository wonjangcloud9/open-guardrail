# YAML Config

Define your guardrails in YAML — no code changes needed.

## Basic Config

Create `guardrail.yaml`:

```yaml
version: "1"
pipelines:
  input:
    mode: fail-fast
    guards:
      - type: prompt-injection
        action: block
      - type: pii
        action: mask
        config:
          entities: [email, phone]
  output:
    mode: run-all
    guards:
      - type: toxicity
        action: warn
      - type: hallucination
        action: block
```

## Loading Config

```typescript
import { OpenGuardrail } from 'open-guardrail';

const engine = await OpenGuardrail.fromConfig('./guardrail.yaml');
const result = await engine.run(text);
```

## CLI Validation

```bash
npx open-guardrail-cli init       # generate guardrail.yaml
npx open-guardrail-cli validate   # validate config
```

## Using Presets

```yaml
version: "1"
preset: korean    # loads ISMS-P + PIPA + resident ID guards
```

Available presets: `default`, `strict`, `korean`, `security`, `content`, `ai-basic-act-kr`, `eu-ai-act`

## Guard Config Options

Each guard supports a `config` block for guard-specific options:

```yaml
guards:
  - type: keyword
    action: block
    config:
      denied: [hack, exploit, jailbreak]
      caseSensitive: false
  - type: word-count
    action: warn
    config:
      max: 500
      unit: words
```
