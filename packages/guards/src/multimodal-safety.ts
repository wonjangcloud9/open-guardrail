import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface MultimodalSafetyOptions {
  action: 'block' | 'warn';
  /** Check image-related prompts */
  checkImagePrompts?: boolean;
  /** Check for steganography hints */
  checkSteganography?: boolean;
}

const IMAGE_ABUSE_PATTERNS: RegExp[] = [
  /\b(generate|create|make)\s+(nude|naked|explicit|nsfw|pornographic)\s+(image|photo|picture|content)\b/i,
  /\b(deepfake|face[\s-]?swap)\s+(of|with|featuring)\b/i,
  /\b(undress|remove\s+cloth)/i,
  /\b(child|minor|underage)\s+(image|photo|picture|pornograph)/i,
  /\b(revenge\s+porn|non[\s-]?consensual\s+intima)/i,
  /\b(fake\s+id|forge|counterfeit)\s+(document|passport|license|certificate)\b/i,
];

const STEGO_PATTERNS: RegExp[] = [
  /\b(hide|embed|encode)\s+(data|message|payload)\s+(in|into|within)\s+(image|photo|audio|video)\b/i,
  /\bsteganograph/i,
  /\b(LSB|least\s+significant\s+bit)\s+(embed|encod)/i,
  /\bexif\s+(inject|manipulat)/i,
];

const PROMPT_INJECTION_VIA_IMAGE: RegExp[] = [
  /\b(OCR|extract\s+text)\s+.*\b(execute|run|ignore|override)\b/i,
  /\bimage\s+contains?\s+(hidden|embedded)\s+(instructions?|commands?|prompts?)\b/i,
  /\b(read|scan)\s+.*\bQR\s+code\b.*\b(execute|open|visit)\b/i,
  /\bcontains?\s+hidden\s+instructions?\s+to\s+(execute|run|override)\b/i,
];

export function multimodalSafety(options: MultimodalSafetyOptions): Guard {
  const checkImage = options.checkImagePrompts ?? true;
  const checkStego = options.checkSteganography ?? true;

  return {
    name: 'multimodal-safety',
    version: '0.1.0',
    description: 'Safety for multimodal AI: image abuse, deepfakes, steganography, visual prompt injection',
    category: 'security',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const violations: string[] = [];

      if (checkImage) {
        for (const p of IMAGE_ABUSE_PATTERNS) {
          if (p.test(text)) { violations.push('image-abuse'); break; }
        }
      }

      if (checkStego) {
        for (const p of STEGO_PATTERNS) {
          if (p.test(text)) { violations.push('steganography'); break; }
        }
      }

      for (const p of PROMPT_INJECTION_VIA_IMAGE) {
        if (p.test(text)) { violations.push('visual-prompt-injection'); break; }
      }

      const triggered = violations.length > 0;

      return {
        guardName: 'multimodal-safety',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score: triggered ? Math.min(violations.length / 2, 1.0) : 0,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { violations } : undefined,
      };
    },
  };
}
