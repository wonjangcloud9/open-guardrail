interface GuardInfo {
  name: string;
  category: string;
  description: string;
  languages: string[];
}

const GUARD_CATALOG: GuardInfo[] = [
  // Security
  { name: 'prompt-injection', category: 'security', description: 'Detect prompt injection and jailbreak attempts', languages: ['*'] },
  { name: 'sql-injection', category: 'security', description: 'SQL injection detection (3 sensitivity levels)', languages: ['*'] },
  { name: 'xss-guard', category: 'security', description: 'Cross-site scripting detection and sanitization', languages: ['*'] },
  { name: 'code-safety', category: 'security', description: 'Dangerous code pattern detection (eval, shell, SQL)', languages: ['*'] },
  { name: 'encoding-attack', category: 'security', description: 'Base64/hex/unicode encoded injection detection', languages: ['*'] },
  { name: 'data-leakage', category: 'security', description: 'System prompt and data leakage detection', languages: ['*'] },
  { name: 'markdown-sanitize', category: 'security', description: 'Dangerous markdown/HTML sanitization', languages: ['*'] },
  { name: 'multi-turn-context', category: 'security', description: 'Multi-turn manipulation and jailbreak detection', languages: ['*'] },
  { name: 'url-guard', category: 'security', description: 'URL validation, phishing, private IP detection', languages: ['*'] },
  { name: 'ip-guard', category: 'security', description: 'IP address detection with allow/deny lists', languages: ['*'] },
  { name: 'api-key-detect', category: 'security', description: 'Leaked API keys and tokens detection', languages: ['*'] },
  { name: 'secret-pattern', category: 'security', description: 'Credentials, connection strings, private keys', languages: ['*'] },
  { name: 'keyword', category: 'security', description: 'Keyword deny/allow list', languages: ['*'] },
  { name: 'regex', category: 'security', description: 'Custom regex with ReDoS protection', languages: ['*'] },
  { name: 'rate-limit', category: 'security', description: 'Sliding window rate limiter', languages: ['*'] },
  { name: 'tool-call-validator', category: 'security', description: 'Agent tool call argument validation', languages: ['*'] },
  // Privacy
  { name: 'pii', category: 'privacy', description: 'PII detection: email, phone, SSN, passport, ITIN, Medicare', languages: ['en'] },
  { name: 'pii-kr', category: 'privacy', description: 'Korean PII: resident-id, passport, driver license, business-id', languages: ['ko'] },
  { name: 'pii-jp', category: 'privacy', description: 'Japanese PII: My Number, passport, corporate number', languages: ['ja'] },
  { name: 'pii-cn', category: 'privacy', description: 'Chinese PII: ID card (checksum), passport, bank card, phone', languages: ['zh'] },
  { name: 'resident-id', category: 'privacy', description: 'Korean resident registration number (checksum)', languages: ['ko'] },
  { name: 'credit-info', category: 'privacy', description: 'Korean financial info: accounts, cards, credit scores', languages: ['ko'] },
  { name: 'phone-format', category: 'privacy', description: 'International phone detection (US/KR/JP/CN/UK)', languages: ['*'] },
  // Content
  { name: 'toxicity', category: 'content', description: 'Profanity, hate, threat, harassment detection', languages: ['en'] },
  { name: 'profanity-kr', category: 'content', description: 'Korean profanity with choseong variants', languages: ['ko'] },
  { name: 'profanity-jp', category: 'content', description: 'Japanese profanity: hiragana/katakana/kanji + variants', languages: ['ja'] },
  { name: 'profanity-cn', category: 'content', description: 'Chinese profanity with pinyin abbreviations', languages: ['zh'] },
  { name: 'bias', category: 'content', description: 'Gender, racial, religious, age bias detection', languages: ['en'] },
  { name: 'sentiment', category: 'content', description: 'Negative, aggressive, fearful sentiment analysis', languages: ['en'] },
  { name: 'copyright', category: 'content', description: 'Copyright notices and trademark detection', languages: ['*'] },
  { name: 'watermark-detect', category: 'content', description: 'AI-generated text markers detection', languages: ['en'] },
  { name: 'topic-deny', category: 'content', description: 'Block text matching denied topics', languages: ['*'] },
  { name: 'topic-allow', category: 'content', description: 'Only allow text matching allowed topics', languages: ['*'] },
  { name: 'cost-guard', category: 'content', description: 'Token usage and cost limit guard', languages: ['*'] },
  { name: 'response-quality', category: 'content', description: 'Check response quality (too short, repetitive)', languages: ['en'] },
  { name: 'gibberish-detect', category: 'content', description: 'Detect nonsensical/random input', languages: ['*'] },
  { name: 'email-validator', category: 'content', description: 'Email validation with disposable domain detection', languages: ['*'] },
  { name: 'competitor-mention', category: 'content', description: 'Detect competitor brand mentions', languages: ['*'] },
  { name: 'language-consistency', category: 'content', description: 'Verify response language matches expected', languages: ['*'] },
  // Locale/Regulatory
  { name: 'language', category: 'locale', description: 'Language detection and filtering (11+ languages)', languages: ['*'] },
  { name: 'isms-p', category: 'locale', description: 'ISMS-P compliance (Korean infosec certification)', languages: ['ko'] },
  { name: 'pipa', category: 'locale', description: 'PIPA compliance (Korean Personal Information Protection)', languages: ['ko'] },
  { name: 'appi', category: 'locale', description: 'APPI compliance (Japanese Personal Information Protection)', languages: ['ja'] },
  { name: 'pipl', category: 'locale', description: 'PIPL compliance (Chinese Personal Information Protection)', languages: ['zh'] },
  // AI
  { name: 'llm-judge', category: 'ai', description: 'Custom LLM evaluation with configurable parsing', languages: ['*'] },
  { name: 'hallucination', category: 'ai', description: 'Source verification for hallucinated content', languages: ['*'] },
  { name: 'relevance', category: 'ai', description: 'Response relevance checking via LLM', languages: ['*'] },
  { name: 'groundedness', category: 'ai', description: 'RAG groundedness evaluation', languages: ['*'] },
  // Format
  { name: 'json-repair', category: 'format', description: 'Validate and repair malformed JSON', languages: ['*'] },
  { name: 'schema-guard', category: 'format', description: 'JSON Schema validation for structured output', languages: ['*'] },
  { name: 'word-count', category: 'format', description: 'Word/character count limits', languages: ['*'] },
  { name: 'repetition-detect', category: 'format', description: 'Detect repetitive LLM output', languages: ['*'] },
];

export function runList(options: {
  category?: string;
  language?: string;
  format?: 'table' | 'json';
}): void {
  let guards = GUARD_CATALOG;

  if (options.category) {
    guards = guards.filter((g) => g.category === options.category);
  }
  if (options.language) {
    guards = guards.filter(
      (g) => g.languages.includes('*') || g.languages.includes(options.language!),
    );
  }

  if (options.format === 'json') {
    console.log(JSON.stringify(guards, null, 2));
    return;
  }

  const categories = [...new Set(guards.map((g) => g.category))];
  for (const cat of categories) {
    const catGuards = guards.filter((g) => g.category === cat);
    console.log(`\n  ${cat.toUpperCase()} (${catGuards.length})`);
    console.log('  ' + '-'.repeat(60));
    for (const g of catGuards) {
      const lang = g.languages.includes('*') ? '' : ` [${g.languages.join(',')}]`;
      console.log(`  ${g.name.padEnd(24)} ${g.description}${lang}`);
    }
  }
  console.log(`\n  Total: ${guards.length} guards`);
}
