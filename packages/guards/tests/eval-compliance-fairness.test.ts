import { describe, it, expect } from 'vitest';
import { answerFaithfulness } from '../src/answer-faithfulness.js';
import { responseRelevanceScore } from '../src/response-relevance-score.js';
import { factualConsistencyCheck } from '../src/factual-consistency-check.js';
import { answerCompletenessScore } from '../src/answer-completeness-score.js';
import { reasoningChainValidity } from '../src/reasoning-chain-validity.js';
import { sourceAttributionAccuracy } from '../src/source-attribution-accuracy.js';
import { confidenceCalibration } from '../src/confidence-calibration.js';
import { euAiRiskClassification } from '../src/eu-ai-risk-classification.js';
import { transparencyDisclosure } from '../src/transparency-disclosure.js';
import { decisionExplainability } from '../src/decision-explainability.js';
import { humanOversightRequired } from '../src/human-oversight-required.js';
import { dataProvenance } from '../src/data-provenance.js';
import { conformityAssessment } from '../src/conformity-assessment.js';
import { incidentReportTrigger } from '../src/incident-report-trigger.js';
import { demographicParity } from '../src/demographic-parity.js';
import { disparateImpact } from '../src/disparate-impact.js';
import { stereotypeAssociation } from '../src/stereotype-association.js';
import { inclusiveLanguage } from '../src/inclusive-language.js';
import { socioeconomicBias } from '../src/socioeconomic-bias.js';
import { accessibilityOutput } from '../src/accessibility-output.js';

const ctx = { pipelineType: 'output' as const };

describe('answerFaithfulness', () => {
  it('passes when answer is grounded in context', async () => {
    const g = answerFaithfulness({ action: 'block' });
    const r = await g.check(
      'Context: Python is a programming language.\n\nAnswer: Python is a programming language used for coding.',
      ctx,
    );
    expect(r.passed).toBe(true);
  });
  it('fails when answer contradicts context', async () => {
    const g = answerFaithfulness({ action: 'block' });
    const r = await g.check(
      'Context: Python is a programming language.\n\nAnswer: Java was invented by James Gosling at Sun Microsystems in 1995.',
      ctx,
    );
    expect(r.passed).toBe(false);
  });
});

describe('responseRelevanceScore', () => {
  it('passes when response is relevant', async () => {
    const g = responseRelevanceScore({ action: 'block' });
    const r = await g.check(
      'Query: What is machine learning?\nResponse: Machine learning is a type of AI that learns from data.',
      ctx,
    );
    expect(r.passed).toBe(true);
  });
  it('fails when response is irrelevant', async () => {
    const g = responseRelevanceScore({ action: 'block' });
    const r = await g.check(
      'Query: What is machine learning?\nResponse: The weather in Paris is beautiful this time of year.',
      ctx,
    );
    expect(r.passed).toBe(false);
  });
});

describe('factualConsistencyCheck', () => {
  it('passes when facts are consistent', async () => {
    const g = factualConsistencyCheck({ action: 'block' });
    const r = await g.check(
      'The company was founded in 2020. It has grown significantly since its founding.',
      ctx,
    );
    expect(r.passed).toBe(true);
  });
  it('fails when facts contradict', async () => {
    const g = factualConsistencyCheck({ action: 'block' });
    const r = await g.check(
      'The Acme population is 5 million. The Acme population is 8 million.',
      ctx,
    );
    expect(r.passed).toBe(false);
  });
});

describe('answerCompletenessScore', () => {
  it('passes when answer addresses all parts', async () => {
    const g = answerCompletenessScore({ action: 'block' });
    const r = await g.check(
      'Question: What is Python and who created it?\nAnswer: Python is a programming language created by Guido van Rossum.',
      ctx,
    );
    expect(r.passed).toBe(true);
  });
  it('fails when answer is incomplete', async () => {
    const g = answerCompletenessScore({ action: 'block' });
    const r = await g.check(
      'Question: What is Python and who created it and when was it released?\nAnswer: It is nice.',
      ctx,
    );
    expect(r.passed).toBe(false);
  });
});

describe('reasoningChainValidity', () => {
  it('passes with valid reasoning chain', async () => {
    const g = reasoningChainValidity({ action: 'block' });
    const r = await g.check(
      'Step 1: Gather data. Step 2: Analyze patterns. Step 3: Draw conclusions. Therefore, the trend is upward.',
      ctx,
    );
    expect(r.passed).toBe(true);
  });
  it('fails with conclusion but no reasoning', async () => {
    const g = reasoningChainValidity({ action: 'block' });
    const r = await g.check('Therefore, the answer is 42.', ctx);
    expect(r.passed).toBe(false);
  });
});

describe('sourceAttributionAccuracy', () => {
  it('passes with proper citations', async () => {
    const g = sourceAttributionAccuracy({ action: 'block' });
    const r = await g.check(
      'According to [1], the data shows growth.\n[1]: Smith et al., 2024',
      ctx,
    );
    expect(r.passed).toBe(true);
  });
  it('fails with broken citations', async () => {
    const g = sourceAttributionAccuracy({ action: 'block' });
    const r = await g.check(
      'According to [1] and [3], the results are clear. [citation needed]',
      ctx,
    );
    expect(r.passed).toBe(false);
  });
});

describe('confidenceCalibration', () => {
  it('passes with calibrated confidence', async () => {
    const g = confidenceCalibration({ action: 'block' });
    const r = await g.check(
      'The data suggests this might work. Perhaps with more testing we could confirm.',
      ctx,
    );
    expect(r.passed).toBe(true);
  });
  it('fails with over-confident subjective claims', async () => {
    const g = confidenceCalibration({ action: 'block' });
    const r = await g.check(
      'I believe this is absolutely definitely always the case, without doubt guaranteed, undeniably certain.',
      ctx,
    );
    expect(r.passed).toBe(false);
  });
});

describe('euAiRiskClassification', () => {
  it('passes for minimal risk content', async () => {
    const g = euAiRiskClassification({ action: 'block' });
    const r = await g.check('Here is a recipe for chocolate cake.', ctx);
    expect(r.passed).toBe(true);
  });
  it('fails for unacceptable risk content', async () => {
    const g = euAiRiskClassification({ action: 'block' });
    const r = await g.check(
      'The citizen score system evaluates social credit ratings for all residents.',
      ctx,
    );
    expect(r.passed).toBe(false);
  });
});

describe('transparencyDisclosure', () => {
  it('passes with AI disclosure', async () => {
    const g = transparencyDisclosure({ action: 'block' });
    const r = await g.check(
      'This response was generated by AI. Here are the results.',
      ctx,
    );
    expect(r.passed).toBe(true);
  });
  it('fails when claiming to be human', async () => {
    const g = transparencyDisclosure({ action: 'block' });
    const r = await g.check(
      'I am a real person providing expert medical advice.',
      ctx,
    );
    expect(r.passed).toBe(false);
  });
});

describe('decisionExplainability', () => {
  it('passes with explained decision', async () => {
    const g = decisionExplainability({ action: 'block' });
    const r = await g.check(
      'Application approved because the applicant meets all criteria including income threshold and credit score requirements.',
      ctx,
    );
    expect(r.passed).toBe(true);
  });
  it('fails with unexplained decision', async () => {
    const g = decisionExplainability({ action: 'block' });
    const r = await g.check('Application denied.', ctx);
    expect(r.passed).toBe(false);
  });
});

describe('humanOversightRequired', () => {
  it('passes with oversight marker', async () => {
    const g = humanOversightRequired({ action: 'block' });
    const r = await g.check(
      'The analysis suggests reviewing the candidate. [PENDING_REVIEW]',
      ctx,
    );
    expect(r.passed).toBe(true);
  });
  it('fails without oversight for high-risk action', async () => {
    const g = humanOversightRequired({ action: 'block' });
    const r = await g.check(
      'Deny application. The loan is rejected due to low credit score.',
      ctx,
    );
    expect(r.passed).toBe(false);
  });
});

describe('dataProvenance', () => {
  it('passes with proper provenance', async () => {
    const g = dataProvenance({ action: 'block' });
    const r = await g.check(
      'This analysis uses data from the WHO database collected in January 2024.',
      ctx,
    );
    expect(r.passed).toBe(true);
  });
  it('fails without provenance details', async () => {
    const g = dataProvenance({ action: 'block' });
    const r = await g.check(
      'Based on the training data, the model shows high accuracy.',
      ctx,
    );
    expect(r.passed).toBe(false);
  });
});

describe('conformityAssessment', () => {
  it('passes with assessment metadata', async () => {
    const g = conformityAssessment({ action: 'block' });
    const r = await g.check(
      "Classification: spam. {timestamp: '2024-01-01', model: 'v2', risk_level: 'low'}",
      ctx,
    );
    expect(r.passed).toBe(true);
  });
  it('fails without assessment metadata', async () => {
    const g = conformityAssessment({ action: 'block' });
    const r = await g.check('Classification: high risk applicant.', ctx);
    expect(r.passed).toBe(false);
  });
});

describe('incidentReportTrigger', () => {
  it('passes with normal operation', async () => {
    const g = incidentReportTrigger({ action: 'block' });
    const r = await g.check(
      'The system processed 1000 requests successfully.',
      ctx,
    );
    expect(r.passed).toBe(true);
  });
  it('fails with serious incident', async () => {
    const g = incidentReportTrigger({ action: 'block' });
    const r = await g.check(
      'Critical failure detected: incorrect diagnosis led to patient harm.',
      ctx,
    );
    expect(r.passed).toBe(false);
  });
});

describe('demographicParity', () => {
  it('passes with equitable language', async () => {
    const g = demographicParity({ action: 'block' });
    const r = await g.check('All employees receive equal training opportunities.', ctx);
    expect(r.passed).toBe(true);
  });
  it('fails with biased language', async () => {
    const g = demographicParity({ action: 'block' });
    const r = await g.check(
      'Men are natural leaders while women are more emotional and nurturing.',
      ctx,
    );
    expect(r.passed).toBe(false);
  });
});

describe('disparateImpact', () => {
  it('passes with equitable outcomes', async () => {
    const g = disparateImpact({ action: 'block' });
    const r = await g.check('The approval rate is consistent across all groups.', ctx);
    expect(r.passed).toBe(true);
  });
  it('fails with disparate outcomes', async () => {
    const g = disparateImpact({ action: 'block' });
    const r = await g.check(
      '70% of men were approved while 40% of women were approved.',
      ctx,
    );
    expect(r.passed).toBe(false);
  });
});

describe('stereotypeAssociation', () => {
  it('passes with inclusive language', async () => {
    const g = stereotypeAssociation({ action: 'block' });
    const r = await g.check('Engineers come from diverse backgrounds.', ctx);
    expect(r.passed).toBe(true);
  });
  it('fails with stereotyped roles', async () => {
    const g = stereotypeAssociation({ action: 'block' });
    const r = await g.check('Women should stay home and cook.', ctx);
    expect(r.passed).toBe(false);
  });
});

describe('inclusiveLanguage', () => {
  it('passes with inclusive terms', async () => {
    const g = inclusiveLanguage({ action: 'block' });
    const r = await g.check(
      'Add the domain to the denylist and update the primary server.',
      ctx,
    );
    expect(r.passed).toBe(true);
  });
  it('fails with non-inclusive terms', async () => {
    const g = inclusiveLanguage({ action: 'block' });
    const r = await g.check(
      'Add the domain to the blacklist and update the whitelist.',
      ctx,
    );
    expect(r.passed).toBe(false);
  });
});

describe('socioeconomicBias', () => {
  it('passes with neutral language', async () => {
    const g = socioeconomicBias({ action: 'block' });
    const r = await g.check('Economic factors affect communities differently.', ctx);
    expect(r.passed).toBe(true);
  });
  it('fails with biased language', async () => {
    const g = socioeconomicBias({ action: 'block' });
    const r = await g.check(
      'Poor people are lazy and welfare recipients don\'t want to work.',
      ctx,
    );
    expect(r.passed).toBe(false);
  });
});

describe('accessibilityOutput', () => {
  it('passes with accessible content', async () => {
    const g = accessibilityOutput({ action: 'block' });
    const r = await g.check(
      'The application provides clear navigation. Users can find information in the help section.',
      ctx,
    );
    expect(r.passed).toBe(true);
  });
  it('fails with inaccessible link text', async () => {
    const g = accessibilityOutput({ action: 'block' });
    const r = await g.check(
      '[Click here](http://a.com) for more. [Read more](http://b.com). [Click here](http://c.com) to learn. [Click here](http://d.com) to download.',
      ctx,
    );
    expect(r.passed).toBe(false);
  });
});
