## Task 5: Examples — with-nextjs + korean-compliance

**Files:**
- Create: `examples/with-nextjs/package.json`
- Create: `examples/with-nextjs/app/api/chat/route.ts`
- Create: `examples/with-nextjs/README.md`
- Create: `examples/korean-compliance/package.json`
- Create: `examples/korean-compliance/guardrail.yaml`
- Create: `examples/korean-compliance/index.ts`
- Create: `examples/korean-compliance/README.md`

- [ ] **Step 1: Create examples/with-nextjs/package.json**

```json
{
  "name": "example-with-nextjs",
  "private": true,
  "type": "module",
  "scripts": { "dev": "next dev" },
  "dependencies": {
    "open-guardrail": "workspace:*",
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": { "typescript": "^5.7.0", "@types/react": "^19.0.0" }
}
```

- [ ] **Step 2: Create examples/with-nextjs/app/api/chat/route.ts**

```typescript
import { NextResponse } from 'next/server';
import { pipe, promptInjection, pii, keyword } from 'open-guardrail';

const inputGuard = pipe(
  promptInjection({ action: 'block' }),
  pii({ entities: ['email', 'phone'], action: 'mask' }),
  keyword({ denied: ['hack', 'exploit'], action: 'block' }),
);

export async function POST(request: Request) {
  const { message } = await request.json();

  const result = await inputGuard.run(message);
  if (!result.passed) {
    return NextResponse.json(
      { error: 'Input blocked', action: result.action },
      { status: 400 },
    );
  }

  const safeMessage = result.output ?? message;
  return NextResponse.json({ reply: `Echo: ${safeMessage}` });
}
```

- [ ] **Step 3: Create examples/with-nextjs/README.md**

```markdown
# Next.js API Route

Next.js App Router with open-guardrail in API route.

## Run

```bash
pnpm install
pnpm dev
# Test: curl -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d '{"message":"hello"}'
```
```

- [ ] **Step 4: Create examples/korean-compliance/package.json**

```json
{
  "name": "example-korean-compliance",
  "private": true,
  "type": "module",
  "scripts": { "start": "npx tsx index.ts" },
  "dependencies": { "open-guardrail": "workspace:*" },
  "devDependencies": { "tsx": "^4.0.0" }
}
```

- [ ] **Step 5: Create examples/korean-compliance/guardrail.yaml**

Use `presets/korean.yaml` content (copy).

- [ ] **Step 6: Create examples/korean-compliance/index.ts**

```typescript
import { pipe, piiKr, residentId, profanityKr, creditInfo, promptInjection } from 'open-guardrail';

async function main() {
  const pipeline = pipe(
    promptInjection({ action: 'block' }),
    piiKr({ entities: ['resident-id', 'phone', 'email'], action: 'mask' }),
    residentId({ action: 'mask' }),
    profanityKr({ action: 'block' }),
  );

  // 주민등록번호 마스킹
  const r1 = await pipeline.run('고객 주민번호는 900101-1234567 입니다');
  console.log('주민번호:', r1.passed, r1.output);

  // 욕설 차단
  const r2 = await pipeline.run('이 ㅅㅂ 뭐야');
  console.log('욕설:', r2.passed, r2.action);

  // 정상 입력
  const r3 = await pipeline.run('안녕하세요, 문의드립니다');
  console.log('정상:', r3.passed);
}

main();
```

- [ ] **Step 7: Create examples/korean-compliance/README.md**

```markdown
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
```

- [ ] **Step 8: Commit**

```bash
git add examples/with-nextjs/ examples/korean-compliance/
git commit -m "feat(examples): Next.js API route 예제 및 한국 규제 준수 예제 추가"
```
