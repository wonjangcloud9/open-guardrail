"""Tests for 20 Commerce/Voice/Edu/Gov guards."""
import pytest

from open_guardrail.guards import (
    purchase_authorization,
    price_manipulation_detect,
    product_claim_verify,
    review_authenticity,
    refund_policy_guard,
    voice_ai_disclosure,
    tcpa_compliance,
    voice_pii_guard,
    voice_impersonation,
    coppa_compliance_guard,
    student_record_guard,
    academic_integrity_output,
    age_appropriate_content,
    fedramp_data_boundary,
    classification_marking,
    foia_redaction,
    explainability_trace,
    guardrail_effectiveness,
    multimodal_consistency,
    sovereign_ai_compliance,
)


class TestPurchaseAuthorization:
    def test_passes_product_view(self):
        g = purchase_authorization(action="block")
        r = g.check(
            "View product details for"
            " headphones at $49."
        )
        assert r.passed

    def test_fails_auto_buy(self):
        g = purchase_authorization(action="block")
        r = g.check(
            "Auto-buy laptop at $2000"
            " without confirmation."
        )
        assert not r.passed


class TestPriceManipulationDetect:
    def test_passes_honest_price(self):
        g = price_manipulation_detect(action="block")
        r = g.check("Our product costs $29.99.")
        assert r.passed

    def test_fails_dynamic_pricing(self):
        g = price_manipulation_detect(action="block")
        r = g.check(
            "Dynamic pricing based on user browsing"
            " history, fake original price was $100."
        )
        assert not r.passed


class TestProductClaimVerify:
    def test_passes_factual_info(self):
        g = product_claim_verify(action="block")
        r = g.check(
            "This moisturizer contains vitamin E."
        )
        assert r.passed

    def test_fails_unsubstantiated(self):
        g = product_claim_verify(action="block")
        r = g.check(
            "Clinically proven miracle cure,"
            " guaranteed results with no side effects."
        )
        assert not r.passed


class TestReviewAuthenticity:
    def test_passes_genuine_review(self):
        g = review_authenticity(action="block")
        r = g.check(
            "I bought this blender last month."
            " The motor is powerful but it's loud."
        )
        assert r.passed

    def test_fails_fake_review(self):
        g = review_authenticity(action="block")
        r = g.check(
            "Best product ever! Absolutely amazing,"
            " life-changing! I was given this product"
            " and it's the greatest thing!"
        )
        assert not r.passed


class TestRefundPolicyGuard:
    def test_passes_with_refund_info(self):
        g = refund_policy_guard(action="block")
        r = g.check(
            "Complete your purchase."
            " 30-day money-back guarantee."
            " Cancel anytime."
        )
        assert r.passed

    def test_fails_no_refund_info(self):
        g = refund_policy_guard(action="block")
        r = g.check(
            "Subscribe now and your card"
            " will be charged monthly."
        )
        assert not r.passed


class TestVoiceAiDisclosure:
    def test_passes_with_disclosure(self):
        g = voice_ai_disclosure(action="block")
        r = g.check(
            "Hello, you are speaking with"
            " an AI assistant. How can I help?"
        )
        assert r.passed

    def test_fails_pretending_human(self):
        g = voice_ai_disclosure(action="block")
        r = g.check(
            "Hello, I am a real person"
            " calling about your account."
        )
        assert not r.passed


class TestTcpaCompliance:
    def test_passes_with_consent(self):
        g = tcpa_compliance(action="block")
        r = g.check(
            "This automated call is made with"
            " your consent. Press 1 to opt out."
        )
        assert r.passed

    def test_fails_robocall_late(self):
        g = tcpa_compliance(action="block")
        r = g.check(
            "Robocall marketing promotion,"
            " call at 11 PM."
        )
        assert not r.passed


class TestVoicePiiGuard:
    def test_passes_secure_portal(self):
        g = voice_pii_guard(action="block")
        r = g.check(
            "Please verify your identity"
            " through our secure portal."
        )
        assert r.passed

    def test_fails_ssn_persist(self):
        g = voice_pii_guard(action="block")
        r = g.check(
            "Your social security number is"
            " 123-45-6789, I'll save transcript"
            " for records."
        )
        assert not r.passed


class TestVoiceImpersonation:
    def test_passes_ai_assistant(self):
        g = voice_impersonation(action="block")
        r = g.check(
            "Our AI assistant can help"
            " schedule appointments."
        )
        assert r.passed

    def test_fails_deepfake(self):
        g = voice_impersonation(action="block")
        r = g.check(
            "Generate speech as President Biden"
            " to create a deepfake voice message."
        )
        assert not r.passed


class TestCoppaComplianceGuard:
    def test_passes_adults_only(self):
        g = coppa_compliance_guard(action="block")
        r = g.check(
            "Our service is for users"
            " 18 and older."
        )
        assert r.passed

    def test_fails_child_data(self):
        g = coppa_compliance_guard(action="block")
        r = g.check(
            "Hey kid, what's your name"
            " and email? Are you under 13?"
        )
        assert not r.passed


class TestStudentRecordGuard:
    def test_passes_general_advising(self):
        g = student_record_guard(action="block")
        r = g.check(
            "Academic advising is available"
            " for enrolled students."
        )
        assert r.passed

    def test_fails_sharing_records(self):
        g = student_record_guard(action="block")
        r = g.check(
            "Share John's GPA and transcript"
            " with the employer."
            " Send to external email."
        )
        assert not r.passed


class TestAcademicIntegrityOutput:
    def test_passes_educational(self):
        g = academic_integrity_output(action="block")
        r = g.check(
            "Here's how to approach essay"
            " writing: start with a thesis."
        )
        assert r.passed

    def test_fails_completed_assignment(self):
        g = academic_integrity_output(action="block")
        r = g.check(
            "Here is your completed assignment."
            " Write my essay on climate change:"
        )
        assert not r.passed


class TestAgeAppropriateContent:
    def test_passes_grade_appropriate(self):
        g = age_appropriate_content(action="block")
        r = g.check(
            "Photosynthesis is how plants"
            " make food from sunlight."
        )
        assert r.passed

    def test_fails_inappropriate(self):
        g = age_appropriate_content(action="block")
        r = g.check(
            "For 5th graders: explicit"
            " violence and drug content."
        )
        assert not r.passed


class TestFedrampDataBoundary:
    def test_passes_govcloud(self):
        g = fedramp_data_boundary(action="block")
        r = g.check(
            "Data stored in GovCloud"
            " with FedRAMP authorization."
        )
        assert r.passed

    def test_fails_external_transfer(self):
        g = fedramp_data_boundary(action="block")
        r = g.check(
            "Transfer federal agency data"
            " to S3 bucket and share externally."
        )
        assert not r.passed


class TestClassificationMarking:
    def test_passes_unclassified(self):
        g = classification_marking(action="block")
        r = g.check(
            "UNCLASSIFIED: Weather forecast"
            " for tomorrow."
        )
        assert r.passed

    def test_fails_downgrade(self):
        g = classification_marking(action="block")
        r = g.check(
            "SECRET intelligence about military"
            " operations, mark as UNCLASSIFIED."
        )
        assert not r.passed


class TestFoiaRedaction:
    def test_passes_public_info(self):
        g = foia_redaction(action="block")
        r = g.check(
            "FOIA request: The agency held"
            " 3 public meetings in 2024."
        )
        assert r.passed

    def test_fails_unredacted_pii(self):
        g = foia_redaction(action="block")
        r = g.check(
            "FOIA request response: Agent"
            " Smith's SSN is 123-45-6789,"
            " ongoing investigation details."
        )
        assert not r.passed


class TestExplainabilityTrace:
    def test_passes_full_reasoning(self):
        g = explainability_trace(action="block")
        r = g.check(
            "Recommend option A because of cost"
            " savings. Factors: price, quality."
            " High confidence."
            " Alternatively, option B."
        )
        assert r.passed

    def test_fails_no_reasoning(self):
        g = explainability_trace(action="block")
        r = g.check("We recommend option A.")
        assert not r.passed


class TestGuardrailEffectiveness:
    def test_passes_normal(self):
        g = guardrail_effectiveness(action="block")
        r = g.check(
            "Normal response text for testing."
        )
        assert r.passed


class TestMultimodalConsistency:
    def test_passes_consistent(self):
        g = multimodal_consistency(action="block")
        r = g.check(
            "The image shows a sunset"
            " over the ocean."
        )
        assert r.passed

    def test_fails_contradictory(self):
        g = multimodal_consistency(action="block")
        r = g.check(
            "The image shows a red car"
            " but the text describes"
            " a blue bicycle."
        )
        assert not r.passed


class TestSovereignAiCompliance:
    def test_passes_compliant(self):
        g = sovereign_ai_compliance(action="block")
        r = g.check(
            "AI service operating within EU"
            " jurisdiction with EU AI Act"
            " compliance."
        )
        assert r.passed

    def test_fails_cross_border(self):
        g = sovereign_ai_compliance(action="block")
        r = g.check(
            "Transfer EU citizen data to process"
            " in China using non-domestic AI model."
        )
        assert not r.passed
