# 한국 규제 준수 예제

ISMS-P, PIPA 기반 한국 개인정보 보호 가드 사용법.

## 실행

```bash
pnpm install
pnpm start
```

## 포함 가드

- `piiKr` — 주민등록번호, 전화번호, 이메일 등 한국 PII 탐지/마스킹
- `residentId` — 주민등록번호 체크섬 검증 + 마스킹
- `profanityKr` — 한국어 비속어 (초성, 변형 포함)
- `creditInfo` — 계좌, 카드, 신용등급 등 금융정보 보호
