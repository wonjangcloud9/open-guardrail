# Korean / ISMS-P Guards

한국 규제 준수를 위한 가드 모음입니다.

## piiKr

한국 개인정보 탐지 및 마스킹.

```typescript
piiKr({
  entities: ('resident-id' | 'passport' | 'driver-license' | 'business-id' | 'health-insurance' | 'foreigner-id')[],
  action: 'block' | 'warn' | 'mask',
})
```

마스킹 시: `901201-1234567` → `901201-*******`

## profanityKr

한국어 욕설 탐지 (초성, 변형 표현 포함).

```typescript
profanityKr({ action: 'block' | 'warn' })
```

## residentId

주민등록번호 체크섬 검증 + 마스킹.

```typescript
residentId({ action: 'block' | 'warn' | 'mask' })
```

실제 유효한 주민등록번호만 탐지합니다 (13자리 체크섬 검증).

## creditInfo

금융정보 보호 (계좌번호, 카드번호, 신용등급).

```typescript
creditInfo({ action: 'block' | 'warn' })
```

## ismsP

ISMS-P 인증 기준 준수 프리셋.

```typescript
ismsP({ action: 'block' })
```

ISMS-P (정보보호 및 개인정보보호 관리체계 인증)에 필요한 가드를 묶어서 실행합니다.

## pipa

개인정보보호법 (PIPA) 준수.

```typescript
pipa({ action: 'block' })
```

개인정보보호법에서 요구하는 개인정보 처리 기준을 검증합니다.

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
```

### YAML 프리셋

```yaml
version: "1"
preset: korean
```
