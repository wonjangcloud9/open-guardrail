import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface ModalityMismatchOptions {
  action: 'block' | 'warn';
}

const CROSS_MODALITY_CONFUSION: RegExp[] = [
  /as\s+you\s+can\s+see\s+in\s+the\s+audio/i,
  /listen\s+to\s+this\s+image/i,
  /the\s+sound\s+in\s+this\s+picture/i,
  /hear\s+(?:the|this)\s+(?:image|photo|picture)/i,
  /see\s+(?:the|this)\s+(?:audio|sound|recording)/i,
  /visible\s+in\s+the\s+(?:audio|sound|recording)/i,
  /audible\s+in\s+the\s+(?:image|photo|picture)/i,
  /watch\s+(?:the|this)\s+(?:audio|sound)/i,
  /the\s+sound\s+(?:shows?|displays?|depicts?)/i,
  /the\s+(?:image|photo|picture)\s+(?:sounds?|plays?)\b/i,
];

const IMPOSSIBLE_MODALITY: RegExp[] = [
  /the\s+color\s+of\s+the\s+sound/i,
  /the\s+melody\s+in\s+the\s+image/i,
  /the\s+pitch\s+of\s+(?:the|this)\s+(?:photo|picture|image)/i,
  /the\s+brightness\s+of\s+(?:the|this)\s+(?:audio|sound|music)/i,
  /the\s+volume\s+of\s+(?:the|this)\s+(?:image|photo|picture)/i,
  /the\s+rhythm\s+(?:shown|displayed|depicted)\s+in\s+the\s+(?:image|photo)/i,
  /the\s+texture\s+of\s+(?:the|this)\s+(?:sound|audio|music)/i,
];

const IMAGE_INPUT = /you\s+(?:asked|inquired)\s+about\s+the\s+(?:image|photo|picture)/i;
const AUDIO_INPUT = /you\s+(?:asked|inquired)\s+about\s+the\s+(?:audio|sound|recording|video)/i;
const IMAGE_RESPONSE = /(?:in\s+(?:the|this)\s+(?:image|photo|picture)|the\s+(?:image|photo|picture)\s+(?:shows?|displays?))/i;
const AUDIO_RESPONSE = /(?:in\s+(?:the|this)\s+(?:audio|sound|recording)|the\s+(?:audio|sound|recording)\s+(?:contains?|plays?))/i;

export function modalityMismatch(options: ModalityMismatchOptions): Guard {
  return {
    name: 'modality-mismatch',
    version: '0.1.0',
    description: 'Detects when response describes wrong modality',
    category: 'content',
    supportedStages: ['output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now();
      const issues: string[] = [];

      for (const p of CROSS_MODALITY_CONFUSION) {
        if (p.test(text)) issues.push('Cross-modality confusion detected');
      }

      for (const p of IMPOSSIBLE_MODALITY) {
        if (p.test(text)) issues.push('Impossible modality description detected');
      }

      const askedImage = IMAGE_INPUT.test(text);
      const askedAudio = AUDIO_INPUT.test(text);
      const answersImage = IMAGE_RESPONSE.test(text);
      const answersAudio = AUDIO_RESPONSE.test(text);

      if (askedImage && answersAudio && !answersImage) {
        issues.push('Asked about image but responded about audio');
      }
      if (askedAudio && answersImage && !answersAudio) {
        issues.push('Asked about audio but responded about image');
      }

      const triggered = issues.length > 0;
      const score = triggered ? Math.min(issues.length / 3, 1.0) : 0;

      return {
        guardName: 'modality-mismatch',
        passed: !triggered,
        action: triggered ? options.action : 'allow',
        score,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { issues } : undefined,
      };
    },
  };
}
