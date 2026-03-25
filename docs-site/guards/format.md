# Format Guards

## wordCount

Enforce min/max word or character limits.

```typescript
wordCount({
  min?: number,
  max?: number,
  unit?: 'words' | 'chars',  // default: 'words'
  action: 'block' | 'warn',
})
```

## schemaGuard

Validate LLM output against a JSON schema.

```typescript
schemaGuard({
  schema: object,  // JSON Schema object
  action: 'block' | 'warn',
})
```

### Example

```typescript
const guard = schemaGuard({
  schema: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      age: { type: 'number' },
    },
    required: ['name', 'age'],
  },
  action: 'block',
});
```
