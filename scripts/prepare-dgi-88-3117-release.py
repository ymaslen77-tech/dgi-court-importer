#!/usr/bin/env python3
"""Prepare ONE verified court PDF and curated record on an unprotected automation branch.

Fail closed. Never modifies CMS/DB approvals, and never writes to the production
branch. An accompanying protected PR must pass required checks before release.
"""
import hashlib, importlib.util, json, pathlib, re, subprocess
from datetime import date
from urllib.parse import urlsplit

ROOT = pathlib.Path(__file__).resolve().parents[1]
DRAFT = ROOT / "research/dgi-court-drafts/88-3117-2026.json"
MANIFEST = ROOT / "apps/web/src/data/verified-court-static.json"
PDF_DIR = ROOT / "apps/web/public/court-pdf-copies"
EXPECTED_TEXT_SHA = "62b4e58c71656f34c32e8b75790b76afb9c78514cd8f5fc235b3da41b6b0361a"
SLUG = "2kas-88-3117-2026-2026-02-19"

def load_module(path):
    spec = importlib.util.spec_from_file_location("dgi_court_helper", str(path))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod

def main():
    record=json.loads(DRAFT.read_text(encoding="utf-8"))
    assert record["case_number"] == "88-3117/2026"
    assert record["uid"] == "77RS0024-01-2019-007189-21"
    assert record["court"] == "Второй кассационный суд общей юрисдикции"
    assert record["official_source_url"].startswith("https://2kas.sudrf.ru/modules.php?")
    assert urlsplit(record["official_source_url"]).hostname == "2kas.sudrf.ru"

    probe=load_module(ROOT/"scripts/probe-dgi-88-3117-official.py")
    raw,body=probe.get_official_act(record["official_source_url"])
    evidence=probe.inspect(body,record)
    assert evidence["source_text_sha256"]==EXPECTED_TEXT_SHA, "Court text differs from independently inspected and anonymized source"
    assert evidence["full_text_characters"]==10572
    assert evidence["anonymization_marker_count"]>=20
    # The exact source text associated with this hash was separately inspected
    # on 28 Oct 2026, including names, phone/email, identifying numbers, and
    # court operative part. Only judicial officials remain named in that text.
    assert not re.search(r"(?<!\w)(?:\+7|8)\s*[\(\s-]*\d{3}[\)\s-]*\d{3}[\s-]*\d{2}[\s-]*\d{2}(?!\w)",body)
    assert not re.search(r"[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}",body)
    assert "<адрес>" in body and "<данные изъяты>" in body

    cases=json.loads(MANIFEST.read_text(encoding="utf-8"))
    assert isinstance(cases,list) and len(cases)>=5
    assert all(x["slug"]!=SLUG and x["case_number"]!=record["case_number"] and x["official_url"]!=record["official_source_url"] for x in cases)
    assert all(x["outcome_verified"]=="applicant_granted" and x["source_checked"] is True and x["privacy_checked"] is True for x in cases)
    assert all(x.get("pdf_sha256") for x in cases)
    assert len({x["slug"] for x in cases})==len(cases)

    builder=load_module(ROOT/"scripts/build-official-court-pdf-copies.py")
    PDF_DIR.mkdir(parents=True,exist_ok=True)
    pdf_path=PDF_DIR/(SLUG+".pdf")
    builder.build_pdf(pdf_path,{"number":record["case_number"],"court":record["court"]},body,record["official_source_url"])
    pdf=pdf_path.read_bytes()
    assert pdf[:5]==b"%PDF-" and len(pdf)>12000
    extracted=subprocess.run(["pdftotext","-layout",str(pdf_path),"-"],capture_output=True,text=True,check=True).stdout
    assert "Это не" in extracted and "оригинал" in extracted[:2000]
    assert "88-3117/2026" in extracted
    assert "без удовлетворения" in extracted[-1800:].lower()
    assert len(probe.compact(extracted))>0.88*len(probe.compact(body))
    psha=hashlib.sha256(pdf).hexdigest()
    item={
      "slug":SLUG,"case_number":record["case_number"],
      "court_name":record["court"],"decision_date":record["decision_date"],
      "act_type":"ruling",
      "topic":"Признание договора аренды земельного участка незаключённым в отношении гражданина",
      "official_url":record["official_source_url"],
      "official_pdf_url":record["official_source_url"],
      "pdf_origin":"site_rendered_copy",
      "official_source_sha256":hashlib.sha256(raw).hexdigest(),
      "full_text_sha256":EXPECTED_TEXT_SHA,
      "full_text":body,
      "excerpt":"Гражданин добился признания договора аренды земельного участка незаключённым в отношении него; кассационная жалоба ДГИ оставлена без удовлетворения.",
      "pdf_sha256":psha,
      "source_checked":True,
      "privacy_checked":True,
      "outcome_verified":"applicant_granted",
      "outcome_reviewed_at":"2026-10-28",
      "outcome_evidence":"Решением Симоновского районного суда Москвы от 24.08.2023 договор аренды признан незаключённым в отношении гражданина. Апелляционное определение Мосгорсуда от 26.06.2025 и кассационное определение Второго кассационного суда от 19.02.2026 оставили это решение без изменения; кассационная жалоба ДГИ отклонена."
    }
    cases.append(item)
    cases.sort(key=lambda x:x["decision_date"],reverse=True)
    MANIFEST.write_text(json.dumps(cases,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("PREPARED_CASE",record["case_number"],"total",len(cases),"official_text_sha",EXPECTED_TEXT_SHA,"pdf_sha",psha)

if __name__=="__main__":
    main()
