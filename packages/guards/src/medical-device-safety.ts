import type { Guard, GuardResult, GuardContext } from 'open-guardrail-core';

interface MedicalDeviceSafetyOptions { action: 'block' | 'warn'; }

const DEVICE_CONTEXT: RegExp[] = [
  /\bmedical\s+device\b/gi,
  /\bSaMD\b/g,
  /\bsoftware\s+as\s+a\s+medical\s+device\b/gi,
  /\b(?:diagnostic|therapeutic|implantable|life[\s-]sustaining)\s+(?:device|system|software|output)\b/gi,
  /\bFDA\s+(?:cleared|approved|submission|classification)\b/gi,
  /\bdevice\s+(?:output|decision|recommendation|classification)\b/gi,
];

const COMPLIANCE_MARKERS: RegExp[] = [
  /\blog_id\b/gi,
  /\btimestamp\b/gi,
  /\bversion\b/gi,
  /\boperator\b/gi,
  /\bvalidated\b/gi,
  /\bverified\b/gi,
  /\bcalibrated\b/gi,
  /\b21\s*CFR\s*Part\s*11\b/gi,
  /\belectronic\s+records?\b/gi,
  /\baudit\s+trail\b/gi,
  /\belectronic\s+signature\b/gi,
  /\bauthenticat(?:ed|ion)\b/gi,
];

const MIN_COMPLIANCE_MARKERS = 3;

export function medicalDeviceSafety(options: MedicalDeviceSafetyOptions): Guard {
  return { name: 'medical-device-safety', version: '0.1.0', description: 'SaMD output validation for FDA 21 CFR Part 11 compliance', category: 'compliance',
    supportedStages: ['input', 'output'],
    async check(text: string, _ctx: GuardContext): Promise<GuardResult> {
      const start = performance.now(); let deviceContext = false;
      for (const p of DEVICE_CONTEXT) { const re = new RegExp(p.source, p.flags); if (re.test(text)) { deviceContext = true; break; } }
      if (!deviceContext) {
        return { guardName: 'medical-device-safety', passed: true, action: 'allow', latencyMs: Math.round(performance.now() - start) };
      }
      let markerCount = 0; const missing: string[] = [];
      const labels = ['log_id', 'timestamp', 'version', 'operator', 'validated', 'verified', 'calibrated', '21 CFR Part 11', 'electronic records', 'audit trail', 'electronic signature', 'authentication'];
      for (let i = 0; i < COMPLIANCE_MARKERS.length; i++) { const re = new RegExp(COMPLIANCE_MARKERS[i].source, COMPLIANCE_MARKERS[i].flags); if (re.test(text)) markerCount++; else missing.push(labels[i]); }
      const triggered = markerCount < MIN_COMPLIANCE_MARKERS;
      return { guardName: 'medical-device-safety', passed: !triggered, action: triggered ? options.action : 'allow',
        message: triggered ? `Medical device context detected with insufficient compliance markers (${markerCount}/${MIN_COMPLIANCE_MARKERS})` : undefined,
        latencyMs: Math.round(performance.now() - start),
        details: triggered ? { markerCount, minRequired: MIN_COMPLIANCE_MARKERS, missingMarkers: missing.slice(0, 5), reason: 'Medical device output lacks FDA 21 CFR Part 11 compliance markers' } : undefined,
      };
    },
  };
}
