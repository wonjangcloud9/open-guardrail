import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface AsciiArtOptions { action: 'block' | 'warn'; }

const ASCII_PATTERNS: RegExp[] = [
  /[|\\\/\-_=+*#@]{10,}/g,
  /(?:[^\w\s]{3,}\n){3,}/g,
  /(?:[-=_]{5,}\n){2,}/g,
  /(?:\s*[/\\|]{2,}\s*\n){3,}/g,
  /(?:[┌┐└┘├┤┬┴┼│─═║╔╗╚╝╠╣╦╩╬]){3,}/g,
  /(?:[█▓▒░▀▄▌▐]{3,})/g,
  /(?:[╭╮╯╰│─]{3,})/g,
];

export function asciiArt(options: AsciiArtOptions): Guard {
  return { name: 'ascii-art', version: '0.1.0', description: 'Detect ASCII art that may bypass text filters', category: 'security', supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); let detected = false;
      for (const p of ASCII_PATTERNS) { if (new RegExp(p.source, p.flags).test(text)) { detected = true; break; } }
      const specialRatio = [...text].filter(c => !/[\w\s.,!?;:'"()\-]/.test(c)).length / (text.length || 1);
      if (specialRatio > 0.4 && text.length > 20) detected = true;
      return { guardName: 'ascii-art', passed: !detected, action: detected ? options.action : 'allow',
        message: detected ? 'ASCII art or special character pattern detected' : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: detected ? { specialCharRatio: Math.round(specialRatio * 100) / 100, reason: 'ASCII art can be used to bypass text-based content filters' } : undefined,
      };
    },
  };
}
