# Content Guards

## toxicity

Profanity, hate speech, threats, and harassment detection.

```typescript
toxicity({
  action: 'block' | 'warn',
  categories?: ('profanity' | 'hate' | 'threat' | 'harassment')[],
  threshold?: number,  // 0-1, default: 0.5
})
```

## bias

Gender, racial, religious, and age bias detection.

```typescript
bias({ action: 'block' | 'warn' })
```

## language

Restrict text to specific languages.

```typescript
language({
  allowed: string[],  // e.g. ['en', 'ko']
  action: 'block' | 'warn',
})
```

## sentiment

Emotional tone control.

```typescript
sentiment({ action: 'warn' })
```

## copyright

Detect copyright notices, trademarks, and verbatim reproduction.

```typescript
copyright({ action: 'block' | 'warn' })
```

## urlGuard

URL validation and filtering.

```typescript
urlGuard({ action: 'block' | 'warn' })
```

## repetitionDetect

Detect repetitive patterns in LLM output (stuck loops, degenerate text).

```typescript
repetitionDetect({ action: 'warn' })
```
