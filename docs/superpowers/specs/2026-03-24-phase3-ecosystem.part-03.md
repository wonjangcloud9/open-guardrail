## Feature 3: Tool Call Validator Guard

### Problem
에이전트가 할루시네이션된 고객 ID로 API 호출하는 걸 기존 가드가 못 잡음.
도구 호출 인자에 대한 시맨틱 검증 필요.

### Design
```typescript
import { toolCallValidator } from 'open-guardrail';

const guard = toolCallValidator({
  action: 'block',
  rules: [
    { tool: 'sendEmail', arg: 'to', validate: 'email' },
    { tool: 'queryDB', arg: 'userId', validate: 'uuid' },
    { tool: '*', arg: '*', denyPatterns: [/DROP\s+TABLE/i, /;\s*DELETE/i] },
  ],
});
```

Guard가 tool_call JSON을 파싱하여:
- 인자 타입 검증 (email, uuid, url, number range)
- SQL injection / command injection 패턴 탐지
- 허용된 도구 목록 외 호출 차단

### Files
- Create: `packages/guards/src/tool-call-validator.ts`
- Create: `packages/guards/tests/tool-call-validator.test.ts`
- Modify: `packages/guards/src/index.ts` (export 추가)

## Feature 4: Audit Logger

### Problem
EU AI Act(2026.8) + 한국 AI 기본법(2026.1) 모두 감사 로그 의무.
가드 트리거 이벤트를 자동 기록 + 내보내기 기능 필요.

### Design
```typescript
import { AuditLogger } from 'open-guardrail';

const logger = new AuditLogger({
  store: 'memory', // or 'file', 'custom'
  retention: '30d',
});

pipeline.on('guard:after', logger.handler);
pipeline.on('guard:blocked', logger.handler);

// 내보내기
const logs = await logger.export({ from: '2026-03-01', format: 'json' });
```

AuditLog 레코드:
```typescript
interface AuditRecord {
  timestamp: string;
  guardName: string;
  action: GuardAction;
  passed: boolean;
  input: string; // truncated
  score?: number;
  metadata?: Record<string, unknown>;
}
```

### Files
- Create: `packages/core/src/audit-logger.ts`
- Create: `packages/core/tests/audit-logger.test.ts`
- Modify: `packages/core/src/index.ts` (export 추가)
