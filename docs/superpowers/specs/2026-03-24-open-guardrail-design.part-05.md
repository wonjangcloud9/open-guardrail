## Korea / ISMS Locale Guards

| Guard | Description | Input | Output |
|-------|------------|:-----:|:------:|
| `pii-kr` | 주민등록번호, 여권, 면허, 사업자등록번호 등 | ✅ | ✅ |
| `isms-p` | ISMS-P 인증 기준 프리셋 | ✅ | ✅ |
| `pipa` | 개인정보보호법 준수 체크 | ✅ | ✅ |
| `profanity-kr` | 한국어 욕설/비속어 (초성, 변형 포함) | ✅ | ✅ |
| `resident-id` | 주민등록번호 체크섬 검증 + 마스킹 | ✅ | ✅ |
| `credit-info` | 신용정보법 기반 금융 민감정보 유출 방지 | ✅ | ✅ |
| `ai-basic-act` | 2026 AI 기본법 대응 | ✅ | ✅ |

## Future Extension Guards

| Guard | Why Hot | Phase |
|-------|---------|-------|
| `copyright` | AI 생성 저작권 침해 감지, EU AI Act | 3 |
| `watermark-detect` | AI 콘텐츠 식별 의무화 | 3 |
| `cost-guard` | 토큰 사용량/비용 제한 | 2 |
| `rate-limit` | 사용자별 호출 빈도 제한 | 2 |
| `groundedness` | RAG 소스 기반 응답 검증 | 2 |
| `code-safety` | 생성 코드 보안 취약점 감지 | 3 |
| `multi-turn-context` | 점진적 탈옥 시도 감지 | 3 |
| `sentiment` | 감정 톤 제어 | 2 |
| `data-leakage` | 시스템 프롬프트 유출 방지 | 2 |
| `compliance` | GDPR, HIPAA, SOC2 프리셋 | 3 |

## Locale Extension Pattern

```
guards/locale/
  kr/    ← pii-kr, profanity-kr, isms-p, pipa, ...
  eu/    ← gdpr, eu-ai-act, ...
  us/    ← hipaa, ccpa, soc2, ...
  jp/    ← appi, my-number, ...
```
