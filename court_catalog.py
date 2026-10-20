#!/usr/bin/env python3
"""Accumulate PUBLIC case metadata from official Moscow court open-data exports.

No names, addresses, parties, pleadings, judicial outcomes, or unverified verdicts
are stored. This index is NOT a database of verified judicial acts.
"""
import argparse
import hashlib
import json
import os
import re
import sys
import urllib.parse
import zipfile
from pathlib import Path

import ijson

OFFICIAL_HOSTS = ("mos-gorsud.ru", "sudrf.ru", "vsrf.ru", "kad.arbitr.ru")
DGI = re.compile(r"департамент\w*\s+городск\w*\s+имуществ\w*\s+(?:(?:города|г\.)\s*)?москв\w*|\bдги\s+(?:г\.?\s*)?москв\w*", re.I)
TOPICS = (
    ("Приватизация",r"приватизац"),
    ("Выселение",r"выселен|вселени|утрат[аыу].{0,25}прав[ао].{0,30}пользован"),
    ("Социальный наём",r"социальн.{0,15}на[её]м|договор.{0,18}найма жил"),
    ("Жилищный учёт",r"жилищн.{0,20}(уч[её]т|очеред|нуждаем|субсид)|улучшени.{0,20}жилищн"),
    ("Реновация",r"реновац|переселен"),
    ("Наследование жилья",r"выморочн|наследств.{0,45}(квартир|жил|помещен)"),
    ("ЖКУ и управление МКД",r"жилищно.коммунальн|коммунальн.{0,20}услуг|управлени.{0,20}многоквартирн|плат[аыу].{0,28}жил.{0,15}помещен|капитальн.{0,12}ремонт"),
    ("Аварийное жильё",r"аварийн.{0,35}(дом|жил)|непригодн.{0,25}проживан"),
    ("Перепланировка",r"перепланиров|переустройств.{0,25}(квартир|жил|помещен)"),
    ("Право собственности на жильё",r"(прав[ао].{0,18}собственност|приобретательн.{0,15}давност).{0,55}(квартир|жил|помещен)|(квартир|жил|помещен).{0,55}прав[ао].{0,20}собственност"),
    ("Жилищные споры",r"жилищн.{0,35}спор|споры.{0,35}жилищн|спор.{0,30}жил.{0,15}помещен"),
    ("Общее имущество",r"общ[её]е.{0,15}имущество.{0,25}многоквартирн|собрани[ея].{0,25}собственник"),
)
TOPIC_RE = [(label,re.compile(pattern,re.I)) for label,pattern in TOPICS]
COURT_KEYS=("Наименование суда","courtName","Суд","court")
NUMBER_KEYS=("Номер дела","Номер судебного дела","caseNumber","number")
UID_KEYS=("Уникальный идентификатор дела","УИД","uid","caseUid")
CATEGORY_KEYS=("Категория дела","Категория судебного дела","Категория судебного дела, материала, жалобы или производства","category","categoryName","Наименование категории судебного дела")
URL_KEYS=("Ссылка на карточку дела","Ссылка на карточку дела, материала, жалобы или производства","url","caseUrl","href")
PARTY_KEYS=("Стороны","Участники","participants","parties")

def value(row, keys):
    for k in keys:
        v=row.get(k)
        if v not in (None,"",[],{}): return v
    return ""

def court_url(u):
    if not isinstance(u,str) or len(u)>1800: return ""
    p=urllib.parse.urlsplit(u.strip())
    host=(p.hostname or "").lower()
    if p.scheme!="https" or p.username or p.password or (p.port not in (None,443)): return ""
    if not any(host==h or host.endswith("."+h) for h in OFFICIAL_HOSTS): return ""
    return urllib.parse.urlunsplit((p.scheme,host,p.path,p.query,""))

def text_item(val):
    if isinstance(val,str): return val
    if isinstance(val,(int,float)): return str(val)
    return ""

def party_text(obj):
    if isinstance(obj,list): return " ".join(party_text(x) for x in obj)
    if isinstance(obj,str): return obj
    if isinstance(obj,dict):
        return " ".join(str(v) for k,v in obj.items()
            if isinstance(v,str) and re.search(r"наименован|участник|ФИО|name|display",k,re.I))
    return ""

def normalize(row,source):
    if not isinstance(row,dict): return None
    court=text_item(value(row,COURT_KEYS)).strip()
    number=text_item(value(row,NUMBER_KEYS)).strip()
    category=text_item(value(row,CATEGORY_KEYS)).strip()
    url=court_url(value(row,URL_KEYS))
    if not court or not number or not url or len(number)>100: return None
    parties=party_text(value(row,PARTY_KEYS))
    dgi=bool(DGI.search(parties))
    matches=[name for name,pat in TOPIC_RE if pat.search(category)]
    if not matches and not dgi: return None
    # DGI records outside housing remain candidates, not relevant court decisions.
    if dgi and not matches: matches=["ДГИ — предмет требует классификации"]
    uid=text_item(value(row,UID_KEYS)).strip()
    if uid and (len(uid)>150 or not re.fullmatch(r"[\w\-\s/]+",uid,re.U)):
        uid=""
    # Court, number and official URL identify an INSTANCE. A common UID
    # groups related records tentatively, without claiming verified identity.
    stable="|".join((court.casefold(),number.casefold(),url))
    rec_id=hashlib.sha256(stable.encode("utf-8")).hexdigest()[:28]
    return {
        "id":rec_id,"court":court[:200],"number":number,
        "uid":uid,"instance_group":("uid:"+uid.lower() if uid else "candidate:"+rec_id),
        "category":category[:250],"topics":matches,"dgi_party":dgi,
        "official_case_url":url,"dataset":source,
        "verification":"case_metadata_only","act_reviewed":False,
    }

# Court open-data API URLs ending in /json/ can return a ZIP archive. Do not
# infer the response format from the URL or load hundreds of MB into RAM.
MAX_JSON_MEMBER_BYTES = 20 * 1024 * 1024 * 1024
MAX_ARCHIVE_RATIO = 200
JSON_SUFFIXES = (".json", ".jsonl", ".ndjson")

def _stream_array(open_file):
    with open_file() as stream:
        try:
            root = next((prefix for prefix, event, _ in ijson.parse(stream)
                         if event == "start_array" and prefix in
                         ("", "data", "items", "records", "result", "Data", "Items")), None)
        except ijson.JSONError as exc:
            raise ValueError("Dataset content is not valid JSON; inspect official export format") from exc
    if root is None:
        raise ValueError("Unexpected official dataset JSON root (no supported case array)")
    with open_file() as stream:
        yield from ijson.items(stream, (root + ".item") if root else "item")

def stream_json(path):
    path = Path(path)
    with path.open("rb") as source:
        signature = source.read(4)
    if signature != b"PK\x03\x04":
        yield from _stream_array(lambda: path.open("rb"))
        return
    try:
        with zipfile.ZipFile(path) as archive:
            # Open members directly; never extract filenames to disk.
            members = [member for member in archive.infolist()
                       if not member.is_dir() and
                       member.filename.lower().endswith(JSON_SUFFIXES)]
            if not members:
                suffixes = sorted(set(Path(m.filename).suffix.lower()
                                      for m in archive.infolist() if not m.is_dir()))
                raise ValueError("Official ZIP contains no JSON members; file types: " +
                                 ", ".join(suffixes[:10]))
            # One logical official export per URL. Multiple JSON members may
            # represent different datasets: fail closed rather than mix them.
            if len(members) != 1:
                raise ValueError(f"Expected one official dataset JSON member; found {len(members)}")
            member = members[0]
            if member.file_size > MAX_JSON_MEMBER_BYTES or (
                member.file_size > 0 and
                member.file_size > max(1, member.compress_size) * MAX_ARCHIVE_RATIO
            ):
                raise ValueError("Official ZIP member exceeds uncompressed-size or ratio limit")
            yield from _stream_array(lambda: archive.open(member, "r"))
    except zipfile.BadZipFile as exc:
        raise ValueError("Official dataset ZIP is malformed or truncated") from exc

def merge_records(path,items,max_new):
    old={}
    if path.is_file():
        for line in path.read_text(encoding="utf-8").splitlines():
            if not line.strip(): continue
            val=json.loads(line)
            if not isinstance(val,dict) or not isinstance(val.get("id"),str): raise ValueError("Damaged existing catalog")
            old[val["id"]]=val
    initial=len(old)
    scanned=relevant=0
    for row in items:
        scanned+=1
        item=row
        if item is None: continue
        relevant+=1
        if item["id"] in old: continue
        if len(old)-initial>=max_new: break
        old[item["id"]]=item
    return old,{"scanned":scanned,"relevant":relevant,"new":len(old)-initial,"total":len(old)}

def write_index(path,data):
    path.parent.mkdir(parents=True,exist_ok=True)
    tmp=path.with_name(path.name+".tmp")
    with open(tmp,"w",encoding="utf-8") as out:
        for k in sorted(data):
            out.write(json.dumps(data[k],ensure_ascii=False,sort_keys=True,separators=(",",":"))+"\n")
    os.replace(tmp,path)

def main():
    a=argparse.ArgumentParser()
    a.add_argument("--input",required=True)
    a.add_argument("--source-url",required=True)
    a.add_argument("--output",default="data/court-catalog.jsonl")
    a.add_argument("--max-new",type=int,default=2500)
    a.add_argument("--write",action="store_true")
    args=a.parse_args()
    if not 1<=args.max_new<=20000: a.error("max-new must be 1..20000")
    p=urllib.parse.urlsplit(args.source_url)
    if (p.hostname or "").lower()!="data.mos-gorsud.ru" or p.scheme!="https" or "/opendata/" not in p.path:
        a.error("Only official specific Moscow open-data dataset URLs are accepted")
    path=Path(args.output)
    data,stats=merge_records(path,(normalize(r,args.source_url) for r in stream_json(args.input)),args.max_new)
    if stats["scanned"] and not stats["relevant"]: raise RuntimeError("No target cases; validate real dataset schema before writing")
    if args.write: write_index(path,data)
    stats.update({"dry_run":not args.write,"outcome_claims":0,"personal_data_stored":False})
    print(json.dumps(stats,ensure_ascii=False))
if __name__=="__main__":
    try: main()
    except Exception as exc:
        print("CATALOG ERROR:",str(exc),file=sys.stderr)
        sys.exit(1)
