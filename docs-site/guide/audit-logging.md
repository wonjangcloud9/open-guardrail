# Audit Logging

`AuditLogger` records every guard execution for compliance and debugging.

## Usage

```typescript
import { AuditLogger, pipe, promptInjection, pii } from 'open-guardrail';

const logger = new AuditLogger();
const pipeline = pipe(
  promptInjection({ action: 'block' }),
  pii({ entities: ['email'], action: 'mask' }),
);

pipeline.on('guard:after', ({ guardName, text, result }) => {
  logger.log({ guardName, text, result });
});

pipeline.on('guard:blocked', ({ guardName, text, result }) => {
  logger.log({ guardName, text, result, blocked: true });
});
```

## Compliance

Audit logging supports:

- **EU AI Act** — transparency and record-keeping requirements
- **한국 AI 기본법** — AI system decision logging
- **ISMS-P** — information security management audit trail
