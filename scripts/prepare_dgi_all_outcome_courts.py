#!/usr/bin/env python3
"""Stage DGI court acts of EVERY outcome, copied only from official published texts.

Run ONLY on an unprotected automation branch. Unavailable/mismatched sources,
duplicate cases and obviously unredacted sensitive identifiers are skipped.
No claims of judicial success, finality, independent legal/privacy review,
CMS/DB approval or completed Coolify deployment are made.
"""
import datetime, hashlib, importlib.util, json, re
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from bs4 import BeautifulSoup
from bs4.dammit import UnicodeDammit

ROOT=Path(__file__).resolve().parents[1]
QUEUE=ROOT/"research/dgi-court-publication-queue-2026-10-28.json"
CATALOG=ROOT/"apps/web/src/data/verified-court-static.json"
PDFDIR=ROOT/"apps/web/public/court-pdf-copies"
REPORT=ROOT/"research/dgi-court-import-report-2026-10-28.json"
MONTHS={"января":1,"февраля":2,"марта":3,"апреля":4,"мая":5,"июня":6,
        "июля":7,"августа":8,"сентября":9,"октября":10,"ноября":11,"декабря":12}
CASE_NUMBER=re.compile(r"^88-\d{1,6}/20\d{2}$")
PHONE=re.compile(r"(?:\+7|8)[\s(.-]*\d{3}[\s).\-]*\d{3}[\s.\-]*\d{2}[\s.\-]*\d{2}")
EMAIL=re.compile(r"[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}")
SNILS=re.compile(r"\b\d{3}[-\s]\d{3}[-\s]\d{3}\s?\d{2}\b")
PASSPORT=re.compile(r"(?i)паспорт(?:\s+\w+){0,3}\s+\d{4}\s?\d{6}")
def module(path):
    spec=importlib.util.spec_from_file_location("court_pdf_builder",str(path))
    m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
    return m

def full_official_court_act(url,case_number):
    p=urlsplit(url)
    if (p.scheme!="https" or p.hostname!="2kas.sudrf.ru" or p.path!="/modules.php" or
        not any(part in p.query for part in ("name_op=case", "name_op=doc"))):
        raise ValueError("Official court URL not allowed")
    with urlopen(Request(url,headers={"User-Agent":"Mozilla/5.0 (DGI public court act index)"}),timeout=40) as r:
        if r.status!=200 or urlsplit(r.url).hostname!="2kas.sudrf.ru":
            raise ValueError("Official court source did not return HTTP 200")
        raw=r.read(1_500_001)
    if not 12_000<len(raw)<=1_500_000:
        raise ValueError("Official HTML unavailable, incomplete or oversized")
    decoded=UnicodeDammit(raw,is_html=True).unicode_markup
    node=BeautifulSoup(decoded or "","lxml").find(id="cont_doc1")
    if node is None:raise ValueError("Official full judgment section missing")
    body=node.get_text("\n",strip=True).replace("\r","")
    if not 4_000<len(body)<140_000:
        raise ValueError("Judicial text missing or incomplete")
    normalized=re.sub(r"\s+"," ",body[:1800])
    if not re.search(re.escape(case_number).replace(r"\-",r"[-–]"),normalized):
        raise ValueError("Official case number mismatch")
    if not re.search(r"департамент[а-я]*\s+городского\s+имущества",body,re.I):
        raise ValueError("DGI not named in the published act")
    if "ОПРЕДЕЛЕНИЕ" not in re.sub(r"\s+","",body[:1500]).upper():
        raise ValueError("Judicial act header missing")
    date_pattern=r"\b(\d{1,2})\s+("+"|".join(MONTHS)+r")\s+(20\d{2})\s*года\b"
    dates=list(re.finditer(date_pattern,normalized[:1800],re.I))
    if not dates:raise ValueError("Court judgment date not observed in header")
    expected_year=int(case_number.split("/")[1])
    matches=[match for match in dates if int(match.group(3))==expected_year]
    if not matches:raise ValueError("Judicial act date not confirmed in same year as cassation case number")
    d=matches[0]
    day,month,year=int(d.group(1)),MONTHS[d.group(2).lower()],int(d.group(3))
    date=datetime.date(year,month,day)
    if date>datetime.datetime.now(datetime.timezone.utc).date():
        raise ValueError("Court act appears dated in the future")
    if not (re.search(r"\bФИО\d+\b",body) or "<адрес>" in body.lower() or
            "<данные изъяты>" in body.lower()):
        raise ValueError("No court anonymization markers: requires separate privacy clearance")
    if PHONE.search(body) or EMAIL.search(body) or SNILS.search(body) or PASSPORT.search(body):
        raise ValueError("Potential unredacted personal identifier in official act")
    return raw,body,date.isoformat()

def run():
    q=json.loads(QUEUE.read_text(encoding="utf-8"))
    assert q["schema_version"]==2 and q["auto_publish_from_this_file"] is False
    entries=json.loads(CATALOG.read_text(encoding="utf-8"))
    existing_num={x["case_number"] for x in entries}
    existing_urls={x["official_url"] for x in entries}
    used_slugs={x["slug"] for x in entries}
    pdf=module(ROOT/"scripts/build-official-court-pdf-copies.py")
    PDFDIR.mkdir(parents=True,exist_ok=True)
    successes=[];skipped=[]
    pending=[x for x in q["items"] if x["status"]=="ready_for_source_import"]
    for row in pending:
        number=row["case_number"];url=row["official_url"]
        rec={"case_number":number,"official_url":url}
        if not CASE_NUMBER.fullmatch(number) or number in existing_num or url in existing_urls:
            skipped.append(dict(rec,reason="invalid_or_duplicate_case_or_source"));continue
        try:
            raw,body,date=full_official_court_act(url,number)
            slug="2kas-"+number.replace("/","-").lower()+"-"+date
            if slug in used_slugs:raise ValueError("Duplicate case slug")
            path=PDFDIR/(slug+".pdf")
            pdf.build_pdf(path,{"number":number,"court":"Второй кассационный суд общей юрисдикции"},body,url)
            data=path.read_bytes()
            if not (data.startswith(b"%PDF-") and 12000<len(data)<15_728_640):
                path.unlink(missing_ok=True)
                raise ValueError("Generated PDF incomplete")
            psha=hashlib.sha256(data).hexdigest()
            sha=hashlib.sha256(body.encode("utf-8")).hexdigest()
            entries.append({
                "slug":slug,"case_number":number,
                "court_name":"Второй кассационный суд общей юрисдикции",
                "decision_date":date,"act_type":"ruling",
                "topic":"Судебный акт по спору с Департаментом городского имущества Москвы",
                "official_url":url,"official_pdf_url":url,
                "pdf_origin":"site_rendered_copy",
                "official_source_sha256":hashlib.sha256(raw).hexdigest(),
                "full_text_sha256":sha,"full_text":body,
                "excerpt":"Опубликован судебный акт с участием ДГИ Москвы; исход и мотивировка указаны в полном тексте.",
                "pdf_sha256":psha,"source_checked":True,
                "privacy_screen_passed":True,
                "outcome_verified":"not_classified",
                "outcome_evidence":"Исход не классифицирован редакцией. Для оценки результата ознакомьтесь с резолютивной частью судебного акта."
            })
            existing_num.add(number);existing_urls.add(url);used_slugs.add(slug)
            successes.append(dict(rec,slug=slug,date=date,pdf_sha256=psha,text_sha256=sha))
            print("PREPARED_OFFICIAL_COURT_ACT",number,slug,"PDF_SHA256",psha)
        except (HTTPError,URLError,TimeoutError,OSError,ValueError,AssertionError) as err:
            skipped.append(dict(rec,reason=type(err).__name__+": "+str(err)[:160]))
            print("SKIPPED_COURT_ACT",number,type(err).__name__)
    if successes:
        entries.sort(key=lambda e:(e["decision_date"],e["case_number"]),reverse=True)
        CATALOG.write_text(json.dumps(entries,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        imported={entry["case_number"] for entry in successes}
        for item in q["items"]:
            if item["case_number"] in imported:
                item["status"]="already_curated"
                item["reason"]="Official full judicial act and PDF prepared; protected PR and owner deploy are still required"
                item["already_curated"]=True
                item["needs_full_act_and_history_review"]=False
                item["needs_official_source_and_privacy_screen"]=False
        q["current_curated_count"]=len(entries)
        q["counts"]={
          "total":len(q["items"]),
          "curated":sum(x["status"]=="already_curated" for x in q["items"]),
          "out_of_scope":sum(x["status"]=="out_of_scope" for x in q["items"]),
          "ready_for_source_import":sum(x["status"]=="ready_for_source_import" for x in q["items"]),
        }
        QUEUE.write_text(json.dumps(q,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    elif REPORT.exists():
        print("NO_NEW_ACTS; preserve latest successful import report")
        return
    report={"as_of":datetime.datetime.now(datetime.timezone.utc).isoformat(),
       "source_queue":str(QUEUE.relative_to(ROOT)),
       "publication_stage":"prepared_automation_branch_not_merged_or_deployed",
       "source_checks":"official HTML full-text, case, date, DGI, basic privacy identifiers, duplicate, PDF hash",
       "outcome_policy":"ALL court outcomes allowed; undisclosed result honestly labeled not_classified",
       "new_prepared_count":len(successes),
       "skipped_count":len(skipped),"prepared":successes,"skipped":skipped,
       "owner_must_deploy_after_protected_PR_CI":True}
    REPORT.parent.mkdir(parents=True,exist_ok=True)
    REPORT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("PREPARATION_COMPLETE",len(successes),"skipped",len(skipped),
          "LIVE_PUBLICATIONS_NOT_ASSERTED")
if __name__=="__main__":
    run()
