# 프리셋

일반적인 사용 사례를 위한 사전 구성된 가드 조합입니다.

## 사용 가능한 프리셋

| 프리셋 | 포함 가드 | 용도 |
|--------|----------|------|
| `default` | promptInjection, keyword, wordCount | 기본 보호 |
| `strict` | promptInjection, pii, keyword, toxicity, wordCount | 전체 차단 + 마스킹 |
| `korean` | piiKr, profanityKr, residentId, creditInfo, ismsP, pipa | 한국 규제 준수 |
| `security` | promptInjection, pii, dataLeakage, regex, keyword | 보안 중심 |
| `content` | toxicity, bias, language, sentiment | 콘텐츠 관리 |
| `ai-basic-act-kr` | bias, pii, piiKr, toxicity, profanityKr | 한국 AI 기본법 |
| `eu-ai-act` | bias, pii, toxicity, watermarkDetect, copyright | EU AI Act |

## YAML에서 사용

```yaml
version: "1"
preset: korean
```

## 한국 규제 프리셋 상세

### `korean` 프리셋
ISMS-P 인증과 개인정보보호법 준수에 필요한 가드를 묶어 제공합니다:
- **piiKr** — 주민등록번호, 여권번호, 면허번호 등 한국 개인정보 탐지/마스킹
- **profanityKr** — 한국어 욕설 (초성, 변형 포함)
- **residentId** — 주민등록번호 체크섬 검증
- **creditInfo** — 계좌번호, 카드번호, 신용등급
- **ismsP** — ISMS-P 인증 기준 적용
- **pipa** — 개인정보보호법 준수

### `ai-basic-act-kr` 프리셋
2026년 시행 예정인 AI 기본법의 주요 요구사항을 반영합니다:
- 편향 방지 (bias)
- 개인정보 보호 (pii, piiKr)
- 유해 콘텐츠 차단 (toxicity, profanityKr)

## 프리셋 파일 위치

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

이 파일들을 기반으로 커스터마이즈할 수 있습니다.
