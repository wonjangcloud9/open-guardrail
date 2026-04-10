"""Tests for 20 LLM Eval + EU AI Act + Responsible AI guards."""
import pytest

from open_guardrail.guards import (
    answer_faithfulness,
    response_relevance_score,
    factual_consistency_check,
    answer_completeness_score,
    reasoning_chain_validity,
    source_attribution_accuracy,
    confidence_calibration,
    eu_ai_risk_classification,
    transparency_disclosure,
    decision_explainability,
    human_oversight_required,
    data_provenance,
    conformity_assessment,
    incident_report_trigger,
    demographic_parity,
    disparate_impact,
    stereotype_association,
    inclusive_language,
    socioeconomic_bias,
    accessibility_output,
)


class TestAnswerFaithfulness:
    def test_passes_grounded(self):
        g = answer_faithfulness(action="block")
        r = g.check(
            "Context: Python is a programming language."
            "\n\nAnswer: Python is a programming"
            " language used for coding."
        )
        assert r.passed

    def test_fails_ungrounded(self):
        g = answer_faithfulness(action="block")
        r = g.check(
            "Context: Python is a programming language."
            "\n\nAnswer: Java was invented by James"
            " Gosling at Sun Microsystems in 1995."
        )
        assert not r.passed


class TestResponseRelevanceScore:
    def test_passes_relevant(self):
        g = response_relevance_score(action="block")
        r = g.check(
            "Query: What is machine learning?\n"
            "Response: Machine learning is a type"
            " of AI that learns from data."
        )
        assert r.passed

    def test_fails_irrelevant(self):
        g = response_relevance_score(action="block")
        r = g.check(
            "Query: What is machine learning?\n"
            "Response: The weather in Paris is"
            " beautiful this time of year."
        )
        assert not r.passed


class TestFactualConsistencyCheck:
    def test_passes_consistent(self):
        g = factual_consistency_check(action="block")
        r = g.check(
            "The company was founded in 2020."
            " It has grown significantly"
            " since its founding."
        )
        assert r.passed

    def test_fails_contradictory(self):
        g = factual_consistency_check(action="block")
        r = g.check(
            "The Acme population is 5 million."
            " The Acme population is 8 million."
        )
        assert not r.passed


class TestAnswerCompletenessScore:
    def test_passes_complete(self):
        g = answer_completeness_score(action="block")
        r = g.check(
            "Question: What is Python and who"
            " created it?\nAnswer: Python is a"
            " programming language created by"
            " Guido van Rossum."
        )
        assert r.passed

    def test_fails_incomplete(self):
        g = answer_completeness_score(action="block")
        r = g.check(
            "Question: What is Python and who"
            " created it and when was it"
            " released?\nAnswer: It is nice."
        )
        assert not r.passed


class TestReasoningChainValidity:
    def test_passes_valid_chain(self):
        g = reasoning_chain_validity(action="block")
        r = g.check(
            "Step 1: Gather data."
            " Step 2: Analyze patterns."
            " Step 3: Draw conclusions."
            " Therefore, the trend is upward."
        )
        assert r.passed

    def test_fails_no_reasoning(self):
        g = reasoning_chain_validity(action="block")
        r = g.check("Therefore, the answer is 42.")
        assert not r.passed


class TestSourceAttributionAccuracy:
    def test_passes_proper_citations(self):
        g = source_attribution_accuracy(action="block")
        r = g.check(
            "According to [1], the data shows"
            " growth.\n[1]: Smith et al., 2024"
        )
        assert r.passed

    def test_fails_broken_citations(self):
        g = source_attribution_accuracy(action="block")
        r = g.check(
            "According to [1] and [3], the results"
            " are clear. [citation needed]"
        )
        assert not r.passed


class TestConfidenceCalibration:
    def test_passes_calibrated(self):
        g = confidence_calibration(action="block")
        r = g.check(
            "The data suggests this might work."
            " Perhaps with more testing we"
            " could confirm."
        )
        assert r.passed

    def test_fails_overconfident(self):
        g = confidence_calibration(action="block")
        r = g.check(
            "I believe this is absolutely"
            " definitely always the case,"
            " without doubt guaranteed,"
            " undeniably certain."
        )
        assert not r.passed


class TestEuAiRiskClassification:
    def test_passes_minimal_risk(self):
        g = eu_ai_risk_classification(action="block")
        r = g.check(
            "Here is a recipe for chocolate cake."
        )
        assert r.passed

    def test_fails_unacceptable_risk(self):
        g = eu_ai_risk_classification(action="block")
        r = g.check(
            "The citizen score system evaluates"
            " social credit ratings for all"
            " residents."
        )
        assert not r.passed


class TestTransparencyDisclosure:
    def test_passes_with_disclosure(self):
        g = transparency_disclosure(action="block")
        r = g.check(
            "This response was generated by AI."
            " Here are the results."
        )
        assert r.passed

    def test_fails_claiming_human(self):
        g = transparency_disclosure(action="block")
        r = g.check(
            "I am a real person providing"
            " expert medical advice."
        )
        assert not r.passed


class TestDecisionExplainability:
    def test_passes_with_explanation(self):
        g = decision_explainability(action="block")
        r = g.check(
            "Application approved because the"
            " applicant meets all criteria"
            " including income threshold and"
            " credit score requirements."
        )
        assert r.passed

    def test_fails_no_explanation(self):
        g = decision_explainability(action="block")
        r = g.check("Application denied.")
        assert not r.passed


class TestHumanOversightRequired:
    def test_passes_with_oversight(self):
        g = human_oversight_required(action="block")
        r = g.check(
            "The analysis suggests reviewing the"
            " candidate. [PENDING_REVIEW]"
        )
        assert r.passed

    def test_fails_without_oversight(self):
        g = human_oversight_required(action="block")
        r = g.check(
            "Deny application. The loan is"
            " rejected due to low credit score."
        )
        assert not r.passed


class TestDataProvenance:
    def test_passes_with_provenance(self):
        g = data_provenance(action="block")
        r = g.check(
            "This analysis uses data from the WHO"
            " database collected in January 2024."
        )
        assert r.passed

    def test_fails_without_provenance(self):
        g = data_provenance(action="block")
        r = g.check(
            "Based on the training data, the model"
            " shows high accuracy."
        )
        assert not r.passed


class TestConformityAssessment:
    def test_passes_with_metadata(self):
        g = conformity_assessment(action="block")
        r = g.check(
            "Classification: spam."
            " {timestamp: '2024-01-01',"
            " model: 'v2', risk_level: 'low'}"
        )
        assert r.passed

    def test_fails_without_metadata(self):
        g = conformity_assessment(action="block")
        r = g.check(
            "Classification: high risk applicant."
        )
        assert not r.passed


class TestIncidentReportTrigger:
    def test_passes_normal(self):
        g = incident_report_trigger(action="block")
        r = g.check(
            "The system processed 1000 requests"
            " successfully."
        )
        assert r.passed

    def test_fails_serious_incident(self):
        g = incident_report_trigger(action="block")
        r = g.check(
            "Critical failure detected: incorrect"
            " diagnosis led to patient harm."
        )
        assert not r.passed


class TestDemographicParity:
    def test_passes_equitable(self):
        g = demographic_parity(action="block")
        r = g.check(
            "All employees receive equal training"
            " opportunities."
        )
        assert r.passed

    def test_fails_biased(self):
        g = demographic_parity(action="block")
        r = g.check(
            "Men are natural leaders while women"
            " are more emotional and nurturing."
        )
        assert not r.passed


class TestDisparateImpact:
    def test_passes_equitable(self):
        g = disparate_impact(action="block")
        r = g.check(
            "The approval rate is consistent"
            " across all groups."
        )
        assert r.passed

    def test_fails_disparate(self):
        g = disparate_impact(action="block")
        r = g.check(
            "70% of men were approved while"
            " 40% of women were approved."
        )
        assert not r.passed


class TestStereotypeAssociation:
    def test_passes_inclusive(self):
        g = stereotype_association(action="block")
        r = g.check(
            "Engineers come from diverse"
            " backgrounds."
        )
        assert r.passed

    def test_fails_stereotyped(self):
        g = stereotype_association(action="block")
        r = g.check(
            "Women should stay home and cook."
        )
        assert not r.passed


class TestInclusiveLanguage:
    def test_passes_inclusive(self):
        g = inclusive_language(action="block")
        r = g.check(
            "Add the domain to the denylist and"
            " update the primary server."
        )
        assert r.passed

    def test_fails_non_inclusive(self):
        g = inclusive_language(action="block")
        r = g.check(
            "Add the domain to the blacklist and"
            " update the whitelist."
        )
        assert not r.passed


class TestSocioeconomicBias:
    def test_passes_neutral(self):
        g = socioeconomic_bias(action="block")
        r = g.check(
            "Economic factors affect communities"
            " differently."
        )
        assert r.passed

    def test_fails_biased(self):
        g = socioeconomic_bias(action="block")
        r = g.check(
            "Poor people are lazy and welfare"
            " recipients don't want to work."
        )
        assert not r.passed


class TestAccessibilityOutput:
    def test_passes_accessible(self):
        g = accessibility_output(action="block")
        r = g.check(
            "The application provides clear"
            " navigation. Users can find"
            " information in the help section."
        )
        assert r.passed

    def test_fails_inaccessible_links(self):
        g = accessibility_output(action="block")
        r = g.check(
            "[Click here](http://a.com) for more."
            " [Read more](http://b.com)."
            " [Click here](http://c.com) to learn."
            " [Click here](http://d.com) to"
            " download."
        )
        assert not r.passed
