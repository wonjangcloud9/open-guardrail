# YAML 설정

코드 변경 없이 YAML로 가드레일을 정의합니다.

## 기본 설정

`guardrail.yaml` 파일을 생성합니다:

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
```

## 코드에서 로드

```typescript
import { OpenGuardrail } from 'open-guardrail';

const engine = await OpenGuardrail.fromConfig('./guardrail.yaml');
const result = await engine.run(text);
```

## CLI 검증

```bash
npx open-guardrail-cli init       # guardrail.yaml 생성
npx open-guardrail-cli validate   # 설정 파일 검증
```

## 프리셋 사용

```yaml
version: "1"
preset: korean    # ISMS-P + PIPA + 주민등록번호 검증
```

사용 가능한 프리셋: `default`, `strict`, `korean`, `security`, `content`, `ai-basic-act-kr`, `eu-ai-act`

## 가드 설정 옵션

각 가드는 `config` 블록으로 세부 설정이 가능합니다:

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

## 플러그인과 함께 사용

```typescript
import { OpenGuardrail } from 'open-guardrail';
import { myPlugin } from 'my-guardrail-plugin';

const engine = await OpenGuardrail.fromConfig('./guardrail.yaml');
engine.use(myPlugin);  // YAML에서 플러그인 가드 타입 사용 가능
```
