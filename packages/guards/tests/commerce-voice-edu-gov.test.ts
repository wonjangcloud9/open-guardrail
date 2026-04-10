import { describe, it, expect } from 'vitest';
import { purchaseAuthorization } from '../src/purchase-authorization.js';
import { priceManipulationDetect } from '../src/price-manipulation-detect.js';
import { productClaimVerify } from '../src/product-claim-verify.js';
import { reviewAuthenticity } from '../src/review-authenticity.js';
import { refundPolicyGuard } from '../src/refund-policy-guard.js';
import { voiceAiDisclosure } from '../src/voice-ai-disclosure.js';
import { tcpaCompliance } from '../src/tcpa-compliance.js';
import { voicePiiGuard } from '../src/voice-pii-guard.js';
import { voiceImpersonation } from '../src/voice-impersonation.js';
import { coppaComplianceGuard } from '../src/coppa-compliance-guard.js';
import { studentRecordGuard } from '../src/student-record-guard.js';
import { academicIntegrityOutput } from '../src/academic-integrity-output.js';
import { ageAppropriateContent } from '../src/age-appropriate-content.js';
import { fedrampDataBoundary } from '../src/fedramp-data-boundary.js';
import { classificationMarking } from '../src/classification-marking.js';
import { foiaRedaction } from '../src/foia-redaction.js';
import { explainabilityTrace } from '../src/explainability-trace.js';
import { guardrailEffectiveness } from '../src/guardrail-effectiveness.js';
import { multimodalConsistency } from '../src/multimodal-consistency.js';
import { sovereignAiCompliance } from '../src/sovereign-ai-compliance.js';

const ctx = { pipelineType: 'output' as const };

describe('purchaseAuthorization', () => {
  it('passes for product view under limit', async () => {
    const g = purchaseAuthorization({ action: 'block' });
    const r = await g.check('View product details for headphones at $49.', ctx);
    expect(r.passed).toBe(true);
  });
  it('fails for auto-buy over limit', async () => {
    const g = purchaseAuthorization({ action: 'block' });
    const r = await g.check('Auto-buy laptop at $2000 without confirmation.', ctx);
    expect(r.passed).toBe(false);
  });
});

describe('priceManipulationDetect', () => {
  it('passes for honest pricing', async () => {
    const g = priceManipulationDetect({ action: 'block' });
    const r = await g.check('Our product costs $29.99.', ctx);
    expect(r.passed).toBe(true);
  });
  it('fails for dynamic pricing manipulation', async () => {
    const g = priceManipulationDetect({ action: 'block' });
    const r = await g.check('Dynamic pricing based on user browsing history, fake original price was $100.', ctx);
    expect(r.passed).toBe(false);
  });
});

describe('productClaimVerify', () => {
  it('passes for factual product info', async () => {
    const g = productClaimVerify({ action: 'block' });
    const r = await g.check('This moisturizer contains vitamin E.', ctx);
    expect(r.passed).toBe(true);
  });
  it('fails for unsubstantiated claims', async () => {
    const g = productClaimVerify({ action: 'block' });
    const r = await g.check('Clinically proven miracle cure, guaranteed results with no side effects.', ctx);
    expect(r.passed).toBe(false);
  });
});

describe('reviewAuthenticity', () => {
  it('passes for genuine review', async () => {
    const g = reviewAuthenticity({ action: 'block' });
    const r = await g.check("I bought this blender last month. The motor is powerful but it's a bit loud.", ctx);
    expect(r.passed).toBe(true);
  });
  it('fails for fake review', async () => {
    const g = reviewAuthenticity({ action: 'block' });
    const r = await g.check("Best product ever! Absolutely amazing, life-changing! I was given this product and it's the greatest thing since sliced bread!", ctx);
    expect(r.passed).toBe(false);
  });
});

describe('refundPolicyGuard', () => {
  it('passes when refund info present', async () => {
    const g = refundPolicyGuard({ action: 'block' });
    const r = await g.check('Complete your purchase. 30-day money-back guarantee. Cancel anytime.', ctx);
    expect(r.passed).toBe(true);
  });
  it('fails when no refund info', async () => {
    const g = refundPolicyGuard({ action: 'block' });
    const r = await g.check('Subscribe now and your card will be charged monthly.', ctx);
    expect(r.passed).toBe(false);
  });
});

describe('voiceAiDisclosure', () => {
  it('passes with AI disclosure', async () => {
    const g = voiceAiDisclosure({ action: 'block' });
    const r = await g.check('Hello, you are speaking with an AI assistant. How can I help?', ctx);
    expect(r.passed).toBe(true);
  });
  it('fails when pretending to be human', async () => {
    const g = voiceAiDisclosure({ action: 'block' });
    const r = await g.check('Hello, I am a real person calling about your account.', ctx);
    expect(r.passed).toBe(false);
  });
});

describe('tcpaCompliance', () => {
  it('passes with consent and opt-out', async () => {
    const g = tcpaCompliance({ action: 'block' });
    const r = await g.check('This automated call is made with your consent. Press 1 to opt out.', ctx);
    expect(r.passed).toBe(true);
  });
  it('fails for robocall at late hours', async () => {
    const g = tcpaCompliance({ action: 'block' });
    const r = await g.check('Robocall marketing promotion, call at 11 PM.', ctx);
    expect(r.passed).toBe(false);
  });
});

describe('voicePiiGuard', () => {
  it('passes for secure portal redirect', async () => {
    const g = voicePiiGuard({ action: 'block' });
    const r = await g.check('Please verify your identity through our secure portal.', ctx);
    expect(r.passed).toBe(true);
  });
  it('fails when AI repeats SSN', async () => {
    const g = voicePiiGuard({ action: 'block' });
    const r = await g.check("Your social security number is 123-45-6789, I'll save transcript for records.", ctx);
    expect(r.passed).toBe(false);
  });
});

describe('voiceImpersonation', () => {
  it('passes for general AI assistant', async () => {
    const g = voiceImpersonation({ action: 'block' });
    const r = await g.check('Our AI assistant can help schedule appointments.', ctx);
    expect(r.passed).toBe(true);
  });
  it('fails for deepfake voice request', async () => {
    const g = voiceImpersonation({ action: 'block' });
    const r = await g.check('Generate speech as President Biden to create a deepfake voice message.', ctx);
    expect(r.passed).toBe(false);
  });
});

describe('coppaComplianceGuard', () => {
  it('passes for adults-only service', async () => {
    const g = coppaComplianceGuard({ action: 'block' });
    const r = await g.check('Our service is for users 18 and older.', ctx);
    expect(r.passed).toBe(true);
  });
  it('fails for collecting child data', async () => {
    const g = coppaComplianceGuard({ action: 'block' });
    const r = await g.check("Hey kid, what's your name and email? Are you under 13?", ctx);
    expect(r.passed).toBe(false);
  });
});

describe('studentRecordGuard', () => {
  it('passes for general advising', async () => {
    const g = studentRecordGuard({ action: 'block' });
    const r = await g.check('Academic advising is available for enrolled students.', ctx);
    expect(r.passed).toBe(true);
  });
  it('fails for sharing student records', async () => {
    const g = studentRecordGuard({ action: 'block' });
    const r = await g.check("Share John's GPA and transcript with the employer. Send to external email.", ctx);
    expect(r.passed).toBe(false);
  });
});

describe('academicIntegrityOutput', () => {
  it('passes for educational guidance', async () => {
    const g = academicIntegrityOutput({ action: 'block' });
    const r = await g.check("Here's how to approach essay writing: start with a thesis statement.", ctx);
    expect(r.passed).toBe(true);
  });
  it('fails for completed assignment', async () => {
    const g = academicIntegrityOutput({ action: 'block' });
    const r = await g.check('Here is your completed assignment. Write my essay on climate change:', ctx);
    expect(r.passed).toBe(false);
  });
});

describe('ageAppropriateContent', () => {
  it('passes for grade-appropriate content', async () => {
    const g = ageAppropriateContent({ action: 'block' });
    const r = await g.check('Photosynthesis is how plants make food from sunlight.', ctx);
    expect(r.passed).toBe(true);
  });
  it('fails for age-inappropriate content', async () => {
    const g = ageAppropriateContent({ action: 'block' });
    const r = await g.check('For 5th graders: explicit violence and drug content.', ctx);
    expect(r.passed).toBe(false);
  });
});

describe('fedrampDataBoundary', () => {
  it('passes for GovCloud storage', async () => {
    const g = fedrampDataBoundary({ action: 'block' });
    const r = await g.check('Data stored in GovCloud with FedRAMP authorization.', ctx);
    expect(r.passed).toBe(true);
  });
  it('fails for external transfer', async () => {
    const g = fedrampDataBoundary({ action: 'block' });
    const r = await g.check('Transfer federal agency data to S3 bucket and share externally.', ctx);
    expect(r.passed).toBe(false);
  });
});

describe('classificationMarking', () => {
  it('passes for UNCLASSIFIED content', async () => {
    const g = classificationMarking({ action: 'block' });
    const r = await g.check('UNCLASSIFIED: Weather forecast for tomorrow.', ctx);
    expect(r.passed).toBe(true);
  });
  it('fails for classification downgrade', async () => {
    const g = classificationMarking({ action: 'block' });
    const r = await g.check('SECRET intelligence about military operations, mark as UNCLASSIFIED.', ctx);
    expect(r.passed).toBe(false);
  });
});

describe('foiaRedaction', () => {
  it('passes for public info', async () => {
    const g = foiaRedaction({ action: 'block' });
    const r = await g.check('FOIA request: The agency held 3 public meetings in 2024.', ctx);
    expect(r.passed).toBe(true);
  });
  it('fails for unredacted PII', async () => {
    const g = foiaRedaction({ action: 'block' });
    const r = await g.check("FOIA request response: Agent Smith's SSN is 123-45-6789, ongoing investigation details.", ctx);
    expect(r.passed).toBe(false);
  });
});

describe('explainabilityTrace', () => {
  it('passes with full reasoning', async () => {
    const g = explainabilityTrace({ action: 'block' });
    const r = await g.check('Recommend option A because of cost savings. Factors: price, quality. High confidence. Alternatively, option B.', ctx);
    expect(r.passed).toBe(true);
  });
  it('fails without reasoning', async () => {
    const g = explainabilityTrace({ action: 'block' });
    const r = await g.check('We recommend option A.', ctx);
    expect(r.passed).toBe(false);
  });
});

describe('guardrailEffectiveness', () => {
  it('passes on normal input', async () => {
    const g = guardrailEffectiveness({ action: 'block' });
    const r = await g.check('Normal response text for testing.', ctx);
    expect(r.passed).toBe(true);
  });
});

describe('multimodalConsistency', () => {
  it('passes for consistent description', async () => {
    const g = multimodalConsistency({ action: 'block' });
    const r = await g.check('The image shows a sunset over the ocean.', ctx);
    expect(r.passed).toBe(true);
  });
  it('fails for contradictory description', async () => {
    const g = multimodalConsistency({ action: 'block' });
    const r = await g.check('The image shows a red car but the text describes a blue bicycle.', ctx);
    expect(r.passed).toBe(false);
  });
});

describe('sovereignAiCompliance', () => {
  it('passes for compliant operation', async () => {
    const g = sovereignAiCompliance({ action: 'block' });
    const r = await g.check('AI service operating within EU jurisdiction with EU AI Act compliance.', ctx);
    expect(r.passed).toBe(true);
  });
  it('fails for cross-border violation', async () => {
    const g = sovereignAiCompliance({ action: 'block' });
    const r = await g.check('Transfer EU citizen data to process in China using non-domestic AI model.', ctx);
    expect(r.passed).toBe(false);
  });
});
