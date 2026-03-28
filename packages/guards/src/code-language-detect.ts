import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface CodeLanguageDetectOptions {
  action: 'block' | 'warn';
  requireLanguageTag?: boolean;
}

const LANG_PATTERNS: Record<string, RegExp> = {
  python: /\b(def |import |from \w+ import|class \w+:|if __name__)/,
  javascript: /\b(const |let |var |function |=>|require\(|module\.exports)/,
  typescript: /\b(interface |type |enum |: string|: number|: boolean)/,
  java: /\b(public class |private |protected |System\.out|void main)/,
  go: /\b(func |package |import \(|fmt\.|go |chan )/,
  rust: /\b(fn |let mut |impl |pub fn |use std|match \w+ \{)/,
  cpp: /\b(#include|std::|cout|cin|nullptr|template<)/,
  c: /\b(#include <stdio|printf\(|malloc\(|int main\()/,
  ruby: /\b(def |end$|puts |require |attr_accessor|class \w+ < )/m,
  php: /(<\?php|\$\w+\s*=|function \w+\(.*\$)/,
};

export function codeLanguageDetect(options: CodeLanguageDetectOptions): Guard {
  const requireTag = options.requireLanguageTag ?? false;

  return {
    name: 'code-language-detect',
    version: '0.1.0',
    description: 'Detects programming language in code blocks',
    category: 'format',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];
      const blockPattern = /```(\w*)\n([\s\S]*?)```/g;
      let match: RegExpExecArray | null;
      const detected: Record<string, string[]> = {};

      while ((match = blockPattern.exec(text)) !== null) {
        const tag = match[1];
        const code = match[2];

        if (requireTag && !tag) {
          issues.push('Code block missing language tag');
        }

        for (const [lang, pattern] of Object.entries(LANG_PATTERNS)) {
          if (pattern.test(code)) {
            if (!detected[lang]) detected[lang] = [];
            detected[lang].push(code.slice(0, 40));
          }
        }
      }

      const triggered = issues.length > 0;
      const score = triggered ? Math.min(issues.length / 3, 1.0) : 0;

      return {
        guardName: 'code-language-detect',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: { detectedLanguages: Object.keys(detected), issues },
      };
    },
  };
}
