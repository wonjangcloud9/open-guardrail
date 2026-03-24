## Task 2: New presets (korean, security, content)

**Files:**
- Create: `presets/korean.yaml`
- Create: `presets/security.yaml`
- Create: `presets/content.yaml`

- [ ] **Step 1: Create presets/korean.yaml**

```yaml
version: "1"
pipelines:
  input:
    mode: fail-fast
    onError: block
    timeoutMs: 3000
    guards:
      - type: prompt-injection
        action: block
      - type: pii-kr
        action: mask
        config:
          entities: [resident-id, phone, email, passport, driver-license, business-number]
      - type: resident-id
        action: mask
      - type: keyword
        action: block
        config:
          denied: []
  output:
    mode: run-all
    onError: block
    guards:
      - type: pii-kr
        action: mask
        config:
          entities: [resident-id, phone, email]
      - type: credit-info
        action: block
      - type: profanity-kr
        action: block
      - type: word-count
        action: warn
        config:
          max: 4000
```

- [ ] **Step 2: Create presets/security.yaml**

```yaml
version: "1"
pipelines:
  input:
    mode: fail-fast
    onError: block
    timeoutMs: 3000
    guards:
      - type: prompt-injection
        action: block
      - type: pii
        action: mask
        config:
          entities: [email, phone, credit-card, ssn]
      - type: data-leakage
        action: block
      - type: keyword
        action: block
        config:
          denied: []
  output:
    mode: run-all
    onError: block
    guards:
      - type: pii
        action: mask
        config:
          entities: [email, phone, credit-card, ssn]
      - type: data-leakage
        action: block
```

- [ ] **Step 3: Create presets/content.yaml**

```yaml
version: "1"
pipelines:
  input:
    mode: run-all
    onError: warn
    guards:
      - type: toxicity
        action: block
        config:
          categories: [profanity, hate, threat, harassment]
      - type: bias
        action: warn
        config:
          categories: [gender, racial, religious, age]
      - type: language
        action: block
        config:
          allowed: [ko, en]
  output:
    mode: run-all
    guards:
      - type: toxicity
        action: block
      - type: sentiment
        action: warn
      - type: word-count
        action: warn
        config:
          max: 4000
```

- [ ] **Step 4: Commit**

```bash
git add presets/
git commit -m "feat(presets): 한국 규제, 보안, 콘텐츠 프리셋 추가"
```
