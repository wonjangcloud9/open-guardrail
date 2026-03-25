# 한국 / ISMS-P 가드

한국 규제 준수를 위한 가드 모음입니다.

## piiKr — 한국 개인정보

```typescript
piiKr({
  entities: ['resident-id', 'passport', 'driver-license', 'business-id',
             'health-insurance', 'foreigner-id'],
  action: 'block' | 'warn' | 'mask',
})
```

마스킹 시: `901201-1234567` → `901201-*******`

## profanityKr — 한국어 욕설

```typescript
profanityKr({ action: 'block' | 'warn' })
```

초성 욕설 (ㅅㅂ, ㅆㅂ), 변형 표현 포함.

## residentId — 주민등록번호

```typescript
residentId({ action: 'block' | 'warn' | 'mask' })
```

13자리 체크섬 검증으로 실제 유효한 주민등록번호만 탐지합니다.

## creditInfo — 금융정보

```typescript
creditInfo({ action: 'block' | 'warn' })
```

계좌번호, 카드번호, 신용등급 탐지.

## ismsP — ISMS-P 인증

```typescript
ismsP({ action: 'block' })
```

정보보호 및 개인정보보호 관리체계 인증 기준 준수.

## pipa — 개인정보보호법

```typescript
pipa({ action: 'block' })
```

개인정보보호법(PIPA) 준수 검증.

## 사용 예시

```typescript
import { pipe, piiKr, profanityKr, residentId, pipa } from 'open-guardrail';

const pipeline = pipe(
  piiKr({ entities: ['resident-id', 'passport'], action: 'mask' }),
  residentId({ action: 'mask' }),
  profanityKr({ action: 'block' }),
  pipa({ action: 'block' }),
);

const result = await pipeline.run('주민번호는 901201-1234567입니다');
// → 주민번호가 마스킹된 텍스트 반환
```

## YAML 프리셋

```yaml
version: "1"
preset: korean
```

## 관련 프리셋

| 프리셋 | 포함 가드 |
|--------|----------|
| `korean` | piiKr, profanityKr, residentId, creditInfo, ismsP, pipa |
| `ai-basic-act-kr` | bias, pii, piiKr, toxicity, profanityKr |
