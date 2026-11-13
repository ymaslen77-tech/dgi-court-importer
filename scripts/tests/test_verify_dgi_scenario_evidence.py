"""Adversarial synthetic tests for structured claim-level DGI publication.

Test quotes and domains are fixtures, NEVER a legal verification of real law.
"""
import copy
import datetime as dt
import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from verify_dgi_scenario_evidence import (
    PUBLIC, KNOWN_SCENARIOS, _validate_public_structure,
    validate, validate_research_matrix
)


def research_fixture():
    return json.loads(Path("research/dgi-scenario-evidence-v1.json").read_text("utf-8"))


def public_fixture():
    return {"version":1,"scenarios":[{
        "id":"dgi-no-response",
        "procedure":"59-fz-general-correspondence",
        "jurisdiction":"Москва",
        "title":"Тестовая ситуация по обычному обращению",
        "summary":"Вымышленное пояснение о порядке рассмотрения тестового обращения.",
        "seoTitle":"Тестовый заголовок для проверяемого исследования",
        "seoDescription":"Описание тестового сценария, не предназначенное для публикации.",
        "questions":[{
            "id":"request-type",
            "prompt":"Какой именно документ был зарегистрирован?",
            "options":["Обычное обращение","Заявление на госуслугу"],
        }],
        "rules":[{
            "id":"test-rule",
            "text":"Тестовое правило в фиктивном деле, только для проверки CI.",
            "scopeNote":"Тест применяется исключительно к условным материалам.",
            "exceptionNote":"Из этого теста нельзя выводить реальные сроки.",
            "procedure":"59-fz-general-correspondence",
            "requiredAnswers":{"request-type":"Обычное обращение"},
        }],
        "generator":{
            "kind":"request",
            "title":"Тестовый проект обращения по фиктивному случаю",
            "scopeNote":"Это не правовая рекомендация и не реальный бланк.",
            "clauses":[{
                "ruleId":"test-rule",
                "text":"Условная формулировка, предназначенная только для тестирования в CI."
            }]
        }
    }]}


def evidence_fixture(public):
    now=dt.datetime.now(dt.timezone.utc).isoformat()
    quote="Вымышленная выдержка из несуществующего источника, используемая только в автоматизированных тестах, не является нормой права."
    sources=[
        {"official_source_url":"https://publication.pravo.gov.ru/document/TEST-ONLY",
         "official_source_excerpt":quote,"source_checked_at":now},
        {"official_source_url":"https://www.nalog.gov.ru/rn77/TEST-ONLY",
         "official_source_excerpt":quote,"source_checked_at":now},
        {"official_source_url":"https://epp.genproc.gov.ru/ru/TEST-ONLY",
         "official_source_excerpt":quote,"source_checked_at":now}
    ]
    claims=[]
    for field in _validate_public_structure(public):
        claims.append({
            "file":PUBLIC,"record_id":field["record_id"],
            "field":field["field"],"exact_text":field["exact_text"],
            "procedure":field["procedure"],"jurisdiction":"Москва",
            "act_number_and_date":"Условный нормативный акт 01.01.2020",
            "legal_reason_and_scope":"Условная проверка применимости исключительно к искусственному тексту.",
            "effective_date":"2020-01-01",
            "amendment_history_checked":True,"transitional_rules_checked":True,
            "special_public_services_excluded":True,
            "same_legal_conclusion_checked":True,
            "same_period_and_scope_checked":True,
            "contradictions_checked":True,
            "unresolved_contradictions":[],
            "source_comparison_notes":"Искусственные одинаковые строки в трёх разных органах для проверки целостности процесса. Не подтверждают реальные нормы.",
            "sources":copy.deepcopy(sources)
        })
    return {"version":1,"claims":claims}


def observed(url,excerpt):
    return True,"synthetic fixture (no network)"


class ScenarioEvidenceTests(unittest.TestCase):
    def setUp(self):
        self.research=research_fixture()
        self.public=public_fixture()
        self.manifest=evidence_fixture(self.public)

    def run_check(self):
        return validate(self.public,self.research,self.manifest,fetcher=observed)

    def test_five_research_scopes_are_complete(self):
        self.assertEqual(validate_research_matrix(self.research),set(KNOWN_SCENARIOS))

    def test_empty_publication_is_research_only_not_approved(self):
        report=validate({"version":1,"scenarios":[]},self.research,
                        {"version":1,"claims":[]},fetcher=observed)
        self.assertEqual(report["status"],"research_only_no_public_claims")
        self.assertEqual(report["published_scenarios"],0)

    def test_complete_exact_evidence_can_pass_provenance_without_legal_opinion(self):
        report=self.run_check()
        self.assertEqual(report["status"],"publication_evidence_passed")
        self.assertEqual(report["public_text_fields_checked"],len(self.manifest["claims"]))

    def test_one_missing_seo_claim_fails(self):
        self.manifest["claims"]=[c for c in self.manifest["claims"] if c["field"]!="seoDescription"]
        with self.assertRaisesRegex(ValueError,"exact and complete"):
            self.run_check()

    def test_changed_sentence_requires_new_matching_evidence(self):
        self.public["scenarios"][0]["rules"][0]["text"]="Не подтверждённое новое требование суда следует исполнить немедленно."
        with self.assertRaisesRegex(ValueError,"exact and complete"):
            self.run_check()

    def test_generated_document_clause_requires_exact_citation(self):
        self.public["scenarios"][0]["generator"]["clauses"][0]["text"]="Непроверенная новая просительная часть документа и ходатайство."
        with self.assertRaisesRegex(ValueError,"exact and complete"):
            self.run_check()

    def test_source_procedure_must_match_rendered_field(self):
        self.manifest["claims"][0]["procedure"]="210-fz-public-service"
        with self.assertRaisesRegex(ValueError,"procedure/jurisdiction"):
            self.run_check()

    def test_general_59fz_cannot_include_special_service_deadline(self):
        self.manifest["claims"][0]["special_public_services_excluded"]=False
        with self.assertRaisesRegex(ValueError,"cannot assert"):
            self.run_check()

    def test_unknown_public_route_scenario_fails(self):
        self.public["scenarios"][0]["id"]="invented-situation"
        with self.assertRaisesRegex(ValueError,"Unknown or duplicate"):
            self.run_check()

    def test_rule_cannot_fire_without_answer(self):
        self.public["scenarios"][0]["rules"][0]["requiredAnswers"]={}
        with self.assertRaisesRegex(ValueError,"cannot fire unconditionally"):
            self.run_check()

    def test_rule_cannot_fire_on_unknown_answer(self):
        self.public["scenarios"][0]["rules"][0]["requiredAnswers"]={"request-type":"All cases"}
        with self.assertRaisesRegex(ValueError,"Unknown question answer"):
            self.run_check()

    def test_general_appeal_cannot_be_reinterpreted_as_unrelated_procedure(self):
        self.public["scenarios"][0]["procedure"]="renovation-relocation"
        with self.assertRaisesRegex(ValueError,"general-vs-service"):
            self.run_check()

    def test_generator_kind_must_be_existing_supported_form(self):
        self.public["scenarios"][0]["generator"]["kind"]="automatic-court-win"
        with self.assertRaisesRegex(ValueError,"Unknown existing document"):
            self.run_check()

    def test_injected_html_or_template_interpolation_rejected(self):
        self.public["scenarios"][0]["summary"]="Тестовое содержание <script>alert(1)</script> в месте описания."
        with self.assertRaisesRegex(ValueError,"HTML-like"):
            self.run_check()

    def test_stale_official_quotes_fail(self):
        for claim in self.manifest["claims"]:
            for item in claim["sources"]:
                item["source_checked_at"]="2021-01-01T00:00:00+00:00"
        with self.assertRaisesRegex(ValueError,"stale"):
            self.run_check()

    def test_duplicate_authority_is_not_independent(self):
        row=self.manifest["claims"][0]
        row["sources"][2]["official_source_url"]="https://service.nalog.gov.ru/extra/TEST-ONLY"
        with self.assertRaisesRegex(ValueError,"independence"):
            self.run_check()

    def test_official_quote_must_be_observed_live(self):
        with self.assertRaisesRegex(ValueError,"Source"):
            validate(self.public,self.research,self.manifest,
                     fetcher=lambda url,excerpt:(False,"Quote not present"))

    def test_evidence_cannot_be_self_certified_with_unresolved_conflict(self):
        self.manifest["claims"][0]["unresolved_contradictions"]=["Test disagreement"]
        with self.assertRaisesRegex(ValueError,"contradictions"):
            self.run_check()

    def test_research_status_cannot_be_silently_promoted(self):
        self.research["scenarios"][0]["publication_status"]="approved"
        with self.assertRaisesRegex(ValueError,"may not grant"):
            self.run_check()

    def test_unknown_document_field_is_blocked(self):
        self.public["scenarios"][0]["generator"]["freeText"]="No evidence here"
        with self.assertRaisesRegex(ValueError,"Unknown generator structure"):
            self.run_check()


if __name__=="__main__":
    unittest.main()
