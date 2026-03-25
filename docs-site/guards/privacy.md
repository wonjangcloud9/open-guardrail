# Privacy Guards

## pii

Detect and mask PII (Personally Identifiable Information).

```typescript
pii({
  entities: ('email' | 'phone' | 'credit-card' | 'ssn')[],
  action: 'block' | 'warn' | 'mask',
})
```

When `action` is `'mask'`, detected PII is replaced:
- Email → `[EMAIL]`
- Phone → `[PHONE]`
- Credit card → `[CREDIT_CARD]`
- SSN → `[SSN]`

### Example

```typescript
const guard = pii({ entities: ['email', 'phone'], action: 'mask' });
const result = await guard.check('Email me at john@test.com', ctx);
// result.overrideText === 'Email me at [EMAIL]'
```
