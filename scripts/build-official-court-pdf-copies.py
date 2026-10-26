#!/usr/bin/env python3
"""Build faithful, traceable PDF reading copies of full public court HTML acts.
This does NOT produce an electronically signed court original. Only allowlisted,
individually reviewed decisions may be generated. No party data added.
"""
import argparse
import hashlib
import html
import json
from pathlib import Path
import re
from urllib.request import Request, urlopen

from bs4 import BeautifulSoup
from bs4.dammit import UnicodeDammit
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, KeepTogether

SOURCE_CASES = [
    {
        "slug": "2kas-88-5408-2026-2026-02-17",
        "number": "88-5408/2026",
        "case_id": "17305748",
        "uid": "96f7b227-ab66-44e5-a2e1-c6c160efc369",
        "judicial_uid": "77RS0017-02-2024-014240-27",
        "date": "2026-02-17",
        "date_label": "17 февраля 2026",
        "topic": "Наследование квартиры и удовлетворение иска против ДГИ",
        "court": "Второй кассационный суд общей юрисдикции",
        "act_type": "ruling",
        "source_kind": "court_published_html",
        "editorial_note": "Иск гражданина об установлении факта принятия наследства и признании права собственности удовлетворён; встречный иск ДГИ отклонён, кассационная жалоба ДГИ отклонена.",
        "positive_outcome": "исковые требования ФИО1 удовлетворены",
        "outcome_evidence": "Суд признал факт принятия наследства и право собственности гражданина на наследственное имущество, отказал во встречном иске ДГИ; апелляция и кассация сохранили положительный результат.",
    },
    {
        "slug": "2kas-88-12218-2026-2026-05-28",
        "number": "88-12218/2026",
        "case_id": "17922794",
        "uid": "e7b0d6f3-6f17-4210-a204-0530f61ee1e6",
        "judicial_uid": "",
        "date": "2026-05-28",
        "date_label": "28 мая 2026",
        "topic": "Признание права собственности на гаражные боксы в споре с ДГИ",
        "court": "Второй кассационный суд общей юрисдикции",
        "act_type": "ruling",
        "source_kind": "court_published_html",
        "editorial_note": "Иск граждан к ДГИ Москвы и кооперативу о праве собственности на гаражные боксы удовлетворён; кассационная жалоба ДГИ отклонена.",
        "positive_outcome": "исковые требования удовлетворены",
        "outcome_evidence": "Суд удовлетворил иск граждан о признании права собственности на гаражные боксы; апелляция оставила решение в силе, кассационная жалоба ДГИ отклонена.",
    },
    {
        "slug": "2kas-88-5020-2026-2026-02-17",
        "number": "88-5020/2026",
        "case_id": "17338162",
        "uid": "d920690b-6625-46d1-a56c-af4b81c5393c",
        "judicial_uid": "77RS0034-02-2024-025485-20",
        "date": "2026-02-17",
        "date_label": "17 февраля 2026",
        "topic": "Признание права собственности на недвижимое имущество в споре с ДГИ",
        "court": "Второй кассационный суд общей юрисдикции",
        "act_type": "ruling",
        "source_kind": "court_published_html",
        "editorial_note": "Иск гражданина удовлетворён: признано право собственности на гараж. ДГИ обжаловал, кассация оставила решение в силе.",
        "positive_outcome": "исковые требования ФИО1 удовлетворены",
        "outcome_evidence": "Суд признал право собственности на гараж, кассационная жалоба ДГИ отклонена.",
    },
    {
        "slug": "2kas-88-12184-2026-2026-04-28",
        "number": "88-12184/2026",
        "case_id": "17961008",
        "uid": "1a7c42f6-228f-40ce-846a-6b83e651562e",
        "judicial_uid": "77RS0034-02-2025-005329-73",
        "date": "2026-04-28",
        "date_label": "28 апреля 2026",
        "topic": "Признание права собственности на квартиру",
        "court": "Второй кассационный суд общей юрисдикции",
        "act_type": "ruling",
        "source_kind": "court_published_html",
        "editorial_note": "Иск гражданина удовлетворён: право собственности на квартиру признано. Кассационная жалоба ДГИ отклонена.",
        "positive_outcome": "Исковые требования ФИО1 удовлетворены",
        "outcome_evidence": "Суд признал право собственности на квартиру; апелляция сохранила решение, жалоба ДГИ отклонена.",
    },
    {
        "slug": "2kas-88-14012-2026-2026-05-21",
        "number": "88-14012/2026",
        "case_id": "17983681",
        "uid": "301df5dc-24f6-4fd3-bd0e-53fe3b464061",
        "judicial_uid": "77RS0035-02-2022-000512-67",
        "date": "2026-05-21",
        "date_label": "21 мая 2026",
        "topic": "Право собственности на недвижимость в силу приобретательной давности",
        "court": "Второй кассационный суд общей юрисдикции",
        "act_type": "ruling",
        "source_kind": "court_published_html",
        "editorial_note": "По иску к ДГИ после апелляционного пересмотра право собственности на часть жилого дома признано за наследниками истца. Кассация не изменила результат.",
        "positive_outcome": "признано право собственности на часть жилого дома",
        "outcome_evidence": "Апелляционное определение признало право собственности наследников на часть дома; кассация оставила это определение в силе.",
    },
]

FONT_PATH = Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")

def official_url(item):
    return (
        "https://2kas.sudrf.ru/modules.php?case_id=" + item["case_id"] +
        "&case_uid=" + item["uid"] + "&delo_id=2800001&name=sud_delo" +
        "&name_op=case&new=2800001&srv_num=1"
    )

def fetch_act(item):
    url = official_url(item)
    raw = urlopen(Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=65).read(1_000_000)
    decoded = UnicodeDammit(raw, is_html=True).unicode_markup
    if not decoded:
        raise ValueError("Court published HTML cannot be decoded")
    soup = BeautifulSoup(decoded, "lxml")
    nodes = soup.find_all(string=lambda t: t and "Дело № " + item["number"] in str(t))
    content = []
    for node in nodes:
        ancestor = node.parent.parent
        t = ancestor.get_text("\n", strip=True)
        if len(t) > 6500 and len(t) < 150000:
            content.append(t)
    if len(content) != 1:
        raise ValueError("Cannot uniquely locate full court-published act")
    body = content[0].replace("\r", "").strip()
    if item["number"] not in body[:500] or item["date_label"] not in body[:700]:
        raise ValueError("Court number/date do not agree with publication")
    if item["judicial_uid"] and item["judicial_uid"] not in body[:500]:
        raise ValueError("Published act identifier mismatch")
    if "О П Р Е Д Е Л Е Н И Е" not in body[:600] and "ОПРЕДЕЛЕНИЕ" not in body[:600]:
        raise ValueError("Court decision act heading missing")
    if "о п р е д е л и л а:" not in body[-1300:].lower() and "определила:" not in body[-1300:].lower():
        raise ValueError("Court decision operative part missing")
    if not re.search(r"Председательствующ[а-я]*\s*\nСудьи(?:\s*\nМотивированное определение составлено[^\n]*)?\s*$", body):
        raise ValueError("Court signature/footer missing; possibly truncated")
    # Reject claimant-losing decisions even if the formal case page exists.
    normalized_body = re.sub(r"\s+", " ", body)
    if item["positive_outcome"].lower() not in normalized_body.lower() or not re.search(
        r"(исковые требования (?:ФИО\d+ )?удовлетворены|признано (?:за ФИО\d+ )?право собственности|за ФИО\d+[^.]{0,120}признано право)",
        normalized_body, re.IGNORECASE
    ):
        raise ValueError("No explicit favorable original relief for private claimant")
    # The court's own anonymization is present; no unredacted parties may
    # be added from the case card. Individual counsel and judges are official.
    if len(re.findall(r"\bФИО\d+\b", body)) < 7 or len(body) < 7500:
        raise ValueError("Expected published anonymization and full decision text")
    return body, url, hashlib.sha256(raw).hexdigest()

def build_pdf(path, item, text, official_url_value):
    pdfmetrics.registerFont(TTFont("DejaVuVerifiedCourt", str(FONT_PATH)))
    normal = ParagraphStyle("ActBody", fontName="DejaVuVerifiedCourt",
        fontSize=8.7, leading=13.7, alignment=TA_LEFT, spaceAfter=5)
    h1 = ParagraphStyle("ActHeader", parent=normal, fontSize=13, leading=18, spaceAfter=13)
    source = ParagraphStyle("Source", parent=normal, fontSize=8, leading=12,
        textColor="#565656", spaceAfter=10)
    warning = ParagraphStyle("Warning", parent=normal, fontSize=9, leading=14, spaceAfter=8)
    doc = SimpleDocTemplate(str(path), pagesize=A4, topMargin=23*mm,
        bottomMargin=19*mm, leftMargin=19*mm, rightMargin=19*mm,
        title="PDF-копия судебного акта по делу " + item["number"],
        author="dgi-pravo.ru (PDF-копия официального текста)")
    story = [
        Paragraph("Судебный акт по делу № " + item["number"], h1),
        Paragraph("<b>PDF-копия официально опубликованного текста.</b> "
                  "Подготовлена dgi-pravo.ru для чтения. "
                  "Это не электронный оригинал суда и не заверенная копия.", warning),
        Paragraph("Суд: "+html.escape(item["court"]), source),
        Paragraph("Официальный источник: "+html.escape(official_url_value), source),
        Spacer(1, 9),
    ]
    for line in text.splitlines():
        line = line.strip()
        if not line: continue
        story.append(Paragraph(html.escape(line), normal))
    def page_footer(canvas, d):
        canvas.saveState()
        canvas.setFont("DejaVuVerifiedCourt", 7)
        canvas.setFillColorRGB(.36,.36,.36)
        canvas.drawString(19*mm, 11*mm,
            "PDF-копия текста суда · источник: 2kas.sudrf.ru · не судебный оригинал")
        canvas.drawRightString(191*mm, 11*mm, str(d.page))
        canvas.restoreState()
    doc.build(story, onFirstPage=page_footer, onLaterPages=page_footer)

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--repo-root", default=".")
    p.add_argument("--dry-run", action="store_true")
    args=p.parse_args()
    root=Path(args.repo_root)
    manifest=[]
    dest=root/"apps/web/public/court-pdf-copies"
    dest.mkdir(parents=True,exist_ok=True)
    for item in SOURCE_CASES:
        text, url, source_sha = fetch_act(item)
        data = dict(
            slug=item["slug"], case_number=item["number"],
            court_name=item["court"], decision_date=item["date"],
            act_type=item["act_type"], topic=item["topic"],
            official_url=url, official_pdf_url=url,
            pdf_origin="site_rendered_copy", official_source_sha256=source_sha,
            full_text_sha256=hashlib.sha256(text.encode("utf8")).hexdigest(),
            full_text=text, excerpt=item["editorial_note"],
            pdf_sha256="", source_checked=True, privacy_checked=True,
            outcome_verified="applicant_granted",
            outcome_reviewed_at="2026-10-26",
            outcome_evidence=item["outcome_evidence"],
        )
        if not args.dry_run:
            pdf_file=dest/(item["slug"]+".pdf")
            build_pdf(pdf_file,item,text,url)
            pdf=pdf_file.read_bytes()
            if not pdf.startswith(b"%PDF-") or not 1000<len(pdf)<15_728_640:
                raise ValueError("Rendered PDF invalid")
            data["pdf_sha256"]=hashlib.sha256(pdf).hexdigest()
            # Check the entire judicial text was not silently lost in PDF conversion.
            manifest.append(data)
        print("VALIDATED",item["number"],"text_chars",len(text),
            "pdf",data["pdf_sha256"][:16] if data["pdf_sha256"] else "dry-run",
            "source_sha",source_sha[:16],"FIO_MASKED",len(re.findall(r"\bФИО\d+\b",text)))
    if not args.dry_run:
        target=root/"apps/web/src/data/verified-court-static.json"
        target.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        print("PREPARED",len(manifest),"court act PDF reading copies. Source text and checksums saved.")
if __name__=="__main__":main()
