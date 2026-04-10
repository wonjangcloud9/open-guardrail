import { describe, it, expect } from 'vitest';
import { investmentAdviceDisclaimer } from '../src/investment-advice-disclaimer.js';
import { amlPatternDetect } from '../src/aml-pattern-detect.js';
import { marketManipulation } from '../src/market-manipulation.js';
import { kycDataMinimization } from '../src/kyc-data-minimization.js';
import { creditDecisionExplain } from '../src/credit-decision-explain.js';
import { clinicalAdviceDisclaimer } from '../src/clinical-advice-disclaimer.js';
import { drugInteractionSafety } from '../src/drug-interaction-safety.js';
import { clinicalTrialBias } from '../src/clinical-trial-bias.js';
import { medicalDeviceSafety } from '../src/medical-device-safety.js';
import { mentalHealthCrisis } from '../src/mental-health-crisis.js';
import { legalDisclaimerEnforce } from '../src/legal-disclaimer-enforce.js';
import { attorneyClientPrivilege } from '../src/attorney-client-privilege.js';
import { contractClauseRisk } from '../src/contract-clause-risk.js';
import { jsonSchemaValidate } from '../src/json-schema-validate.js';
import { sqlGenerationSafety } from '../src/sql-generation-safety.js';
import { apiResponseContract } from '../src/api-response-contract.js';
import { hallucinatedUrlDetect } from '../src/index.js';
import { modelDriftDetect } from '../src/model-drift-detect.js';
import { latencyDegradation } from '../src/latency-degradation.js';
import { outputDistributionAnomaly } from '../src/output-distribution-anomaly.js';

const ctx = { pipelineType: 'output' as const };

describe('investmentAdviceDisclaimer', () => {
  it('passes when no advice given', async () => {
    const g = investmentAdviceDisclaimer({ action: 'block' });
    const r = await g.check('Stock markets showed mixed results today. This is not financial advice.', ctx);
    expect(r.passed).toBe(true);
  });
  it('fails on investment advice without disclaimer', async () => {
    const g = investmentAdviceDisclaimer({ action: 'block' });
    const r = await g.check("You should invest in AAPL stock, it's guaranteed to go up.", ctx);
    expect(r.passed).toBe(false);
  });
});

describe('amlPatternDetect', () => {
  it('passes on standard banking language', async () => {
    const g = amlPatternDetect({ action: 'block' });
    const r = await g.check('The transaction was processed through standard banking channels.', ctx);
    expect(r.passed).toBe(true);
  });
  it('fails on structuring instructions', async () => {
    const g = amlPatternDetect({ action: 'block' });
    const r = await g.check('Split the deposit into amounts under $10,000 to avoid CTR reporting.', ctx);
    expect(r.passed).toBe(false);
  });
});

describe('marketManipulation', () => {
  it('passes on neutral financial reporting', async () => {
    const g = marketManipulation({ action: 'block' });
    const r = await g.check('The company reported strong Q3 earnings.', ctx);
    expect(r.passed).toBe(true);
  });
  it('fails on pump and dump language', async () => {
    const g = marketManipulation({ action: 'block' });
    const r = await g.check('Everyone buy this stock now, pump and dump before they catch on.', ctx);
    expect(r.passed).toBe(false);
  });
});

describe('kycDataMinimization', () => {
  it('passes on standard KYC fields', async () => {
    const g = kycDataMinimization({ action: 'block' });
    const r = await g.check('KYC verification requires name, date of birth, and ID number.', ctx);
    expect(r.passed).toBe(true);
  });
  it('fails on excessive KYC data collection', async () => {
    const g = kycDataMinimization({ action: 'block' });
    const r = await g.check('For KYC verification, please provide your religion and political affiliation.', ctx);
    expect(r.passed).toBe(false);
  });
});

describe('creditDecisionExplain', () => {
  it('passes with explanation for denial', async () => {
    const g = creditDecisionExplain({ action: 'block' });
    const r = await g.check('Loan denied. Reason for denial: insufficient income and high debt-to-income ratio.', ctx);
    expect(r.passed).toBe(true);
  });
  it('fails on denial without explanation', async () => {
    const g = creditDecisionExplain({ action: 'block' });
    const r = await g.check('Loan denied.', ctx);
    expect(r.passed).toBe(false);
  });
});

describe('clinicalAdviceDisclaimer', () => {
  it('passes with disclaimer', async () => {
    const g = clinicalAdviceDisclaimer({ action: 'block' });
    const r = await g.check('Headaches can have many causes. Please consult your doctor for proper diagnosis.', ctx);
    expect(r.passed).toBe(true);
  });
  it('fails on clinical advice without disclaimer', async () => {
    const g = clinicalAdviceDisclaimer({ action: 'block' });
    const r = await g.check('You should take ibuprofen 800mg three times daily for your condition.', ctx);
    expect(r.passed).toBe(false);
  });
});

describe('drugInteractionSafety', () => {
  it('passes on general medication info', async () => {
    const g = drugInteractionSafety({ action: 'block' });
    const r = await g.check('Aspirin is commonly used as an anti-inflammatory medication.', ctx);
    expect(r.passed).toBe(true);
  });
  it('fails on dangerous drug combination', async () => {
    const g = drugInteractionSafety({ action: 'block' });
    const r = await g.check('You can safely combine warfarin with aspirin for better results.', ctx);
    expect(r.passed).toBe(false);
  });
});

describe('clinicalTrialBias', () => {
  it('passes on inclusive eligibility criteria', async () => {
    const g = clinicalTrialBias({ action: 'block' });
    const r = await g.check('Eligibility: Adults 18-65, diagnosis of Type 2 diabetes.', ctx);
    expect(r.passed).toBe(true);
  });
  it('fails on discriminatory criteria', async () => {
    const g = clinicalTrialBias({ action: 'block' });
    const r = await g.check('Eligibility: Caucasian males only, must have private insurance, English-speaking only.', ctx);
    expect(r.passed).toBe(false);
  });
});

describe('medicalDeviceSafety', () => {
  it('passes with compliance markers', async () => {
    const g = medicalDeviceSafety({ action: 'block' });
    const r = await g.check('Diagnostic device output: normal. timestamp: 2024-01-01, version: 3.0, operator: Dr. Smith, validated: true', ctx);
    expect(r.passed).toBe(true);
  });
  it('fails on device output without compliance markers', async () => {
    const g = medicalDeviceSafety({ action: 'block' });
    const r = await g.check('Diagnostic device output: abnormal cardiac rhythm detected.', ctx);
    expect(r.passed).toBe(false);
  });
});

describe('mentalHealthCrisis', () => {
  it('passes on mild stress language', async () => {
    const g = mentalHealthCrisis({ action: 'block' });
    const r = await g.check("I've been feeling a bit stressed about work lately.", ctx);
    expect(r.passed).toBe(true);
  });
  it('fails on crisis language', async () => {
    const g = mentalHealthCrisis({ action: 'block' });
    const r = await g.check("I want to end my life, there's no hope left.", ctx);
    expect(r.passed).toBe(false);
  });
});

describe('legalDisclaimerEnforce', () => {
  it('passes with disclaimer', async () => {
    const g = legalDisclaimerEnforce({ action: 'block' });
    const r = await g.check('Contract law covers agreements between parties. This is not legal advice.', ctx);
    expect(r.passed).toBe(true);
  });
  it('fails on legal advice without disclaimer', async () => {
    const g = legalDisclaimerEnforce({ action: 'block' });
    const r = await g.check('You should sue your employer for wrongful termination, you have a strong case.', ctx);
    expect(r.passed).toBe(false);
  });
});

describe('attorneyClientPrivilege', () => {
  it('passes on privilege marker without sharing', async () => {
    const g = attorneyClientPrivilege({ action: 'block' });
    const r = await g.check('This document is protected by attorney-client privilege.', ctx);
    expect(r.passed).toBe(true);
  });
  it('fails on privileged content with sharing intent', async () => {
    const g = attorneyClientPrivilege({ action: 'block' });
    const r = await g.check('This is privileged and confidential communication. Please forward this to the press.', ctx);
    expect(r.passed).toBe(false);
  });
});

describe('contractClauseRisk', () => {
  it('passes on standard contract terms', async () => {
    const g = contractClauseRisk({ action: 'warn' });
    const r = await g.check('The contract includes standard indemnification with a liability cap of $1M.', ctx);
    expect(r.passed).toBe(true);
  });
  it('fails on high-risk clauses', async () => {
    const g = contractClauseRisk({ action: 'warn' });
    const r = await g.check('The vendor shall have unlimited liability and the contract includes auto-renewal with perpetual non-compete worldwide.', ctx);
    expect(r.passed).toBe(false);
  });
});

describe('jsonSchemaValidate', () => {
  it('passes when all expected fields present', async () => {
    const g = jsonSchemaValidate({ action: 'block', expectedFields: ['name', 'age'] });
    const r = await g.check('{"name": "test", "age": 25}', ctx);
    expect(r.passed).toBe(true);
  });
  it('fails when expected fields missing', async () => {
    const g = jsonSchemaValidate({ action: 'block', expectedFields: ['name', 'age', 'email'] });
    const r = await g.check('{"name": "test"}', ctx);
    expect(r.passed).toBe(false);
  });
});

describe('sqlGenerationSafety', () => {
  it('passes on safe SELECT query', async () => {
    const g = sqlGenerationSafety({ action: 'block' });
    const r = await g.check('SELECT name, email FROM users WHERE id = 1', ctx);
    expect(r.passed).toBe(true);
  });
  it('fails on SQL injection pattern', async () => {
    const g = sqlGenerationSafety({ action: 'block' });
    const r = await g.check('SELECT * FROM users; DROP TABLE users;--', ctx);
    expect(r.passed).toBe(false);
  });
});

describe('apiResponseContract', () => {
  it('passes on valid API response', async () => {
    const g = apiResponseContract({ action: 'block' });
    const r = await g.check('{"status": "ok", "data": [1,2,3]}', ctx);
    expect(r.passed).toBe(true);
  });
  it('fails on response with sensitive keys', async () => {
    const g = apiResponseContract({ action: 'block' });
    const r = await g.check('{"password": "secret123", "token": "abc"}', ctx);
    expect(r.passed).toBe(false);
  });
});

describe('hallucinatedUrlDetect', () => {
  it('passes on valid real URL', async () => {
    const g = hallucinatedUrlDetect({ action: 'block' });
    const r = await g.check('Visit https://en.wikipedia.org/wiki/AI for more information.', ctx);
    expect(r.passed).toBe(true);
  });
  it('fails on localhost/internal URL', async () => {
    const g = hallucinatedUrlDetect({ action: 'block' });
    const r = await g.check('See http://localhost:3000/admin/secret and https://fake.invalid/data', ctx);
    expect(r.passed).toBe(false);
  });
});

describe('modelDriftDetect', () => {
  it('passes on consistent responses', async () => {
    const g = modelDriftDetect({ action: 'warn', windowSize: 20 });
    for (let i = 0; i < 24; i++) {
      await g.check('This is a normal ten word response about technology topics.', ctx);
    }
    const r = await g.check('This is a normal ten word response about general topics.', ctx);
    expect(r.passed).toBe(true);
  });
  it('fails on length spike (drift)', async () => {
    const g = modelDriftDetect({ action: 'warn', windowSize: 20 });
    for (let i = 0; i < 25; i++) {
      await g.check('short response', ctx);
    }
    const longText = Array(500).fill('word').join(' ');
    const r = await g.check(longText, ctx);
    expect(r.passed).toBe(false);
  });
});

describe('latencyDegradation', () => {
  it('passes under normal latency', async () => {
    const g = latencyDegradation({ action: 'warn' });
    const r = await g.check('A simple test response.', ctx);
    expect(r.passed).toBe(true);
  });
});

describe('outputDistributionAnomaly', () => {
  it('passes on consistent output', async () => {
    const g = outputDistributionAnomaly({ action: 'warn', windowSize: 10 });
    for (let i = 0; i < 14; i++) {
      await g.check('Normal English response about technology.', ctx);
    }
    const r = await g.check('Normal English response about technology.', ctx);
    expect(r.passed).toBe(true);
  });
  it('fails on language switch anomaly', async () => {
    const g = outputDistributionAnomaly({ action: 'warn', windowSize: 10 });
    for (let i = 0; i < 15; i++) {
      await g.check('Normal English response about technology.', ctx);
    }
    const r = await g.check('\u3053\u3093\u306b\u3061\u306f\u4e16\u754c', ctx);
    expect(r.passed).toBe(false);
  });
});
