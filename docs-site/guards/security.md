# Security Guards

## promptInjection

Detect jailbreak and prompt injection attempts using 19 built-in patterns.

```typescript
promptInjection({
  action: 'block',
  extraPatterns?: RegExp[],  // additional patterns
})
```

**Detects:** "ignore previous instructions", "you are DAN", "system prompt", role-play manipulation, etc.

## keyword

Deny or allow specific keywords.

```typescript
keyword({
  action: 'block',
  denied?: string[],         // blocked words
  allowed?: string[],        // only allow these words
  caseSensitive?: boolean,   // default: false
})
```

## regex

Custom pattern matching with ReDoS protection via `safe-regex2`.

```typescript
regex({
  action: 'block' | 'warn',
  patterns: RegExp[],
})
```

## dataLeakage

Detect system prompt or training data leakage in LLM output.

```typescript
dataLeakage({ action: 'block' })
```

**Detects:** system prompt exposure, instruction leakage, training data regurgitation.

## codeSafety

Detect dangerous code patterns in LLM output.

```typescript
codeSafety({ action: 'warn' })
```

**Detects:** `eval()`, shell injection, SQL injection, environment variable exposure.

## encodingAttack

Detect injection attempts hidden in base64, hex, unicode, or HTML entity encoding.

```typescript
encodingAttack({
  action: 'block' | 'warn',
  detect?: {
    base64?: boolean,      // default: true
    hex?: boolean,         // default: true
    unicode?: boolean,     // default: true
    htmlEntities?: boolean, // default: true
  },
})
```

**Detects:** base64-encoded "ignore all instructions", hex-encoded `<script>` tags, unicode-escaped payloads. Decodes and analyzes content against known attack patterns.

## markdownSanitize

Sanitize dangerous markdown and HTML to prevent XSS.

```typescript
markdownSanitize({
  action: 'block' | 'warn' | 'override',
  rules?: {
    scriptLinks?: boolean,    // javascript: links
    htmlTags?: boolean,       // script, iframe, object tags
    dataUrls?: boolean,       // data: URL schemes
    eventHandlers?: boolean,  // onclick, onerror, etc.
  },
})
```

When `action` is `'override'`, dangerous content is automatically sanitized and the safe text is returned.
