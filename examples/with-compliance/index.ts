import {
  defineGuardrail,
  gdprCompliance,
  euAiAct,
  aiBasicActKr,
  pciDssDetect,
  hipaaDetect,
  pii,
  piiKr,
  dataMinimization,
  consentWithdrawal,
} from 'open-guardrail';

// Full compliance guardrail — GDPR + EU AI Act + Korean AI Basic Act
const complianceGuard = defineGuardrail({
  guards: [
    gdprCompliance({ action: 'warn' }),
    euAiAct({ action: 'warn', riskLevel: 'high' }),
    aiBasicActKr({ action: 'warn', highImpact: true }),
    pciDssDetect({ action: 'block', maskCards: true }),
    hipaaDetect({ action: 'block' }),
    pii({ entities: ['email', 'phone', 'credit-card'], action: 'mask' }),
    piiKr({ entities: ['resident-id', 'passport'], action: 'mask' }),
    dataMinimization({ action: 'warn' }),
    consentWithdrawal({ action: 'warn' }),
  ],
});

// Test GDPR violation
const gdpr = await complianceGuard('We store user data indefinitely without consent');
console.log('GDPR check:', gdpr.passed ? 'PASS' : 'VIOLATION');
for (const r of gdpr.results) {
  if (r.action !== 'allow') console.log(`  → ${r.guardName}: ${r.action}`);
}

// Test PCI DSS violation
const pci = await complianceGuard('Card: 4111111111111111, CVV: 123');
console.log('\nPCI check:', pci.passed ? 'PASS' : 'VIOLATION');
console.log('Masked output:', pci.output);

// Test EU AI Act
const euai = await complianceGuard('Deploy real-time biometric identification in public');
console.log('\nEU AI Act check:', euai.passed ? 'PASS' : 'VIOLATION');

// Test Korean AI Basic Act
const krai = await complianceGuard('AI 기반 채용 결정 시스템을 도입합니다');
console.log('\n한국 AI 기본법:', krai.passed ? 'PASS' : '위반 감지');

// Clean input — should pass all
const clean = await complianceGuard('The quarterly report shows 15% growth');
console.log('\nClean input:', clean.passed ? 'ALL PASS' : 'BLOCKED');
