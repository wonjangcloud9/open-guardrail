"""Tests for 20 Industry + Structured Output + LLMOps guards."""
import pytest

from open_guardrail.guards import (
    investment_advice_disclaimer,
    aml_pattern_detect,
    market_manipulation,
    kyc_data_minimization,
    credit_decision_explain,
    clinical_advice_disclaimer,
    drug_interaction_safety,
    clinical_trial_bias,
    medical_device_safety,
    mental_health_crisis,
    legal_disclaimer_enforce,
    attorney_client_privilege,
    contract_clause_risk,
    json_schema_validate,
    sql_generation_safety,
    api_response_contract,
    hallucinated_url,
    model_drift_detect,
    latency_degradation,
    output_distribution_anomaly,
)


class TestInvestmentAdviceDisclaimer:
    def test_passes_no_advice(self):
        g = investment_advice_disclaimer(action="block")
        r = g.check(
            "Stock markets showed mixed results"
            " today. This is not financial advice."
        )
        assert r.passed

    def test_fails_advice_no_disclaimer(self):
        g = investment_advice_disclaimer(action="block")
        r = g.check(
            "You should invest in AAPL stock,"
            " it's guaranteed to go up."
        )
        assert not r.passed


class TestAmlPatternDetect:
    def test_passes_standard_banking(self):
        g = aml_pattern_detect(action="block")
        r = g.check(
            "The transaction was processed through"
            " standard banking channels."
        )
        assert r.passed

    def test_fails_structuring(self):
        g = aml_pattern_detect(action="block")
        r = g.check(
            "Split the deposit into amounts under"
            " $10,000 to avoid CTR reporting."
        )
        assert not r.passed


class TestMarketManipulation:
    def test_passes_neutral_report(self):
        g = market_manipulation(action="block")
        r = g.check(
            "The company reported strong"
            " Q3 earnings."
        )
        assert r.passed

    def test_fails_pump_and_dump(self):
        g = market_manipulation(action="block")
        r = g.check(
            "Everyone buy this stock now,"
            " pump and dump before they catch on."
        )
        assert not r.passed


class TestKycDataMinimization:
    def test_passes_standard_fields(self):
        g = kyc_data_minimization(action="block")
        r = g.check(
            "KYC verification requires name,"
            " date of birth, and ID number."
        )
        assert r.passed

    def test_fails_excessive_data(self):
        g = kyc_data_minimization(action="block")
        r = g.check(
            "For KYC verification, please provide"
            " your religion and"
            " political affiliation."
        )
        assert not r.passed


class TestCreditDecisionExplain:
    def test_passes_with_explanation(self):
        g = credit_decision_explain(action="block")
        r = g.check(
            "Loan denied. Reason for denial:"
            " insufficient income and high"
            " debt-to-income ratio."
        )
        assert r.passed

    def test_fails_no_explanation(self):
        g = credit_decision_explain(action="block")
        r = g.check("Loan denied.")
        assert not r.passed


class TestClinicalAdviceDisclaimer:
    def test_passes_with_disclaimer(self):
        g = clinical_advice_disclaimer(action="block")
        r = g.check(
            "Headaches can have many causes."
            " Please consult your doctor"
            " for proper diagnosis."
        )
        assert r.passed

    def test_fails_advice_no_disclaimer(self):
        g = clinical_advice_disclaimer(action="block")
        r = g.check(
            "You should take ibuprofen 800mg"
            " three times daily"
            " for your condition."
        )
        assert not r.passed


class TestDrugInteractionSafety:
    def test_passes_general_info(self):
        g = drug_interaction_safety(action="block")
        r = g.check(
            "Aspirin is commonly used as an"
            " anti-inflammatory medication."
        )
        assert r.passed

    def test_fails_dangerous_combo(self):
        g = drug_interaction_safety(action="block")
        r = g.check(
            "You can safely combine warfarin"
            " with aspirin for better results."
        )
        assert not r.passed


class TestClinicalTrialBias:
    def test_passes_inclusive(self):
        g = clinical_trial_bias(action="block")
        r = g.check(
            "Eligibility: Adults 18-65,"
            " diagnosis of Type 2 diabetes."
        )
        assert r.passed

    def test_fails_discriminatory(self):
        g = clinical_trial_bias(action="block")
        r = g.check(
            "Eligibility: Caucasian males only,"
            " must have private insurance,"
            " English-speaking only."
        )
        assert not r.passed


class TestMedicalDeviceSafety:
    def test_passes_with_markers(self):
        g = medical_device_safety(action="block")
        r = g.check(
            "Diagnostic device output: normal."
            " timestamp: 2024-01-01,"
            " version: 3.0,"
            " operator: Dr. Smith,"
            " validated: true"
        )
        assert r.passed

    def test_fails_no_markers(self):
        g = medical_device_safety(action="block")
        r = g.check(
            "Diagnostic device output:"
            " abnormal cardiac rhythm detected."
        )
        assert not r.passed


class TestMentalHealthCrisis:
    def test_passes_mild_stress(self):
        g = mental_health_crisis(action="block")
        r = g.check(
            "I've been feeling a bit stressed"
            " about work lately."
        )
        assert r.passed

    def test_fails_crisis_language(self):
        g = mental_health_crisis(action="block")
        r = g.check(
            "I want to end my life,"
            " there's no hope left."
        )
        assert not r.passed


class TestLegalDisclaimerEnforce:
    def test_passes_with_disclaimer(self):
        g = legal_disclaimer_enforce(action="block")
        r = g.check(
            "Contract law covers agreements"
            " between parties."
            " This is not legal advice."
        )
        assert r.passed

    def test_fails_advice_no_disclaimer(self):
        g = legal_disclaimer_enforce(action="block")
        r = g.check(
            "You should sue your employer for"
            " wrongful termination,"
            " you have a strong case."
        )
        assert not r.passed


class TestAttorneyClientPrivilege:
    def test_passes_privilege_no_sharing(self):
        g = attorney_client_privilege(action="block")
        r = g.check(
            "This document is protected by"
            " attorney-client privilege."
        )
        assert r.passed

    def test_fails_privilege_with_sharing(self):
        g = attorney_client_privilege(action="block")
        r = g.check(
            "This is privileged and confidential"
            " communication. Please forward this"
            " to the press."
        )
        assert not r.passed


class TestContractClauseRisk:
    def test_passes_standard_terms(self):
        g = contract_clause_risk(action="warn")
        r = g.check(
            "The contract includes standard"
            " indemnification with a"
            " liability cap of $1M."
        )
        assert r.passed

    def test_fails_risky_clauses(self):
        g = contract_clause_risk(action="warn")
        r = g.check(
            "The vendor shall have unlimited"
            " liability and the contract includes"
            " auto-renewal with perpetual"
            " non-compete worldwide."
        )
        assert not r.passed


class TestJsonSchemaValidate:
    def test_passes_all_fields(self):
        g = json_schema_validate(
            action="block",
            expected_fields=["name", "age"],
        )
        r = g.check('{"name": "test", "age": 25}')
        assert r.passed

    def test_fails_missing_fields(self):
        g = json_schema_validate(
            action="block",
            expected_fields=["name", "age", "email"],
        )
        r = g.check('{"name": "test"}')
        assert not r.passed


class TestSqlGenerationSafety:
    def test_passes_safe_query(self):
        g = sql_generation_safety(action="block")
        r = g.check(
            "SELECT name, email"
            " FROM users WHERE id = 1"
        )
        assert r.passed

    def test_fails_injection(self):
        g = sql_generation_safety(action="block")
        r = g.check(
            "SELECT * FROM users;"
            " DROP TABLE users;--"
        )
        assert not r.passed


class TestApiResponseContract:
    def test_passes_valid_response(self):
        g = api_response_contract(action="block")
        r = g.check(
            '{"status": "ok", "data": [1,2,3]}'
        )
        assert r.passed

    def test_fails_sensitive_keys(self):
        g = api_response_contract(action="block")
        r = g.check(
            '{"password": "secret123",'
            ' "token": "abc"}'
        )
        assert not r.passed


class TestHallucinatedUrl:
    def test_passes_valid_url(self):
        g = hallucinated_url(action="block")
        r = g.check(
            "Visit https://en.wikipedia.org"
            "/wiki/AI for more information."
        )
        assert r.passed

    def test_fails_internal_url(self):
        g = hallucinated_url(action="block")
        r = g.check(
            "See http://localhost:3000"
            "/admin/secret and"
            " https://fake.invalid/data"
        )
        assert not r.passed


class TestModelDriftDetect:
    def test_passes_consistent(self):
        g = model_drift_detect(
            action="warn", window_size=20
        )
        for _ in range(24):
            g.check(
                "This is a normal ten word"
                " response about technology topics."
            )
        r = g.check(
            "This is a normal ten word"
            " response about general topics."
        )
        assert r.passed

    def test_fails_length_spike(self):
        g = model_drift_detect(
            action="warn", window_size=20
        )
        for _ in range(25):
            g.check("short response")
        long_text = " ".join(["word"] * 500)
        r = g.check(long_text)
        assert not r.passed


class TestLatencyDegradation:
    def test_passes_normal(self):
        g = latency_degradation(action="warn")
        r = g.check("A simple test response.")
        assert r.passed


class TestOutputDistributionAnomaly:
    def test_passes_consistent(self):
        g = output_distribution_anomaly(
            action="warn", window_size=10
        )
        for _ in range(14):
            g.check(
                "Normal English response"
                " about technology."
            )
        r = g.check(
            "Normal English response"
            " about technology."
        )
        assert r.passed

    def test_fails_language_switch(self):
        g = output_distribution_anomaly(
            action="warn", window_size=10
        )
        for _ in range(15):
            g.check(
                "Normal English response"
                " about technology."
            )
        r = g.check("\u3053\u3093\u306b\u3061\u306f\u4e16\u754c")
        assert not r.passed
