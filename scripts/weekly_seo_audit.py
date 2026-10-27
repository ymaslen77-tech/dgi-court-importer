#!/usr/bin/env python3
"""Read-only production SEO regression audit: published HTML, sitemap and links."""
import concurrent.futures, datetime, glob, json, os, re, sys, urllib.parse, urllib.request, urllib.error
from collections import Counter
from pathlib import Path
from xml.etree import ElementTree as ET
from bs4 import BeautifulSoup

config=json.loads(Path("config/weekly-seo-audit.json").read_text())
origin=config["site"].rstrip("/")
host=urllib.parse.urlparse(origin).hostname
settings=config["discovery"]
issues=[]; warnings=[]; findings=[]; report={}
def issue(kind,url,detail):
    issues.append(dict(kind=kind,url=url,detail=str(detail)[:250]))
def warn(kind,url,detail):
    warnings.append(dict(kind=kind,url=url,detail=str(detail)[:250]))
def get(url):
    try:
        req=urllib.request.Request(url,headers={"User-Agent":"DGI-Weekly-SEO-Quality/1.0"})
        with urllib.request.urlopen(req,timeout=settings["timeout_seconds"]) as r:
            return dict(status=r.status,url=r.url,headers=dict(r.headers),body=r.read(3000000).decode("utf-8","replace"))
    except urllib.error.HTTPError as e:
        return dict(status=e.code,url=url,headers={},body="")
    except Exception as e:
        return dict(status=0,url=url,headers={},body="",error=type(e).__name__)
def normalize(url):
    p=urllib.parse.urlsplit(url)
    return urllib.parse.urlunsplit((p.scheme,p.netloc,p.path or "/",p.query,""))
def internal(url):
    return urllib.parse.urlparse(url).hostname==host
def plain_path(path):
    return origin+"/"+path.lstrip("/")
sitemap=get(origin+"/sitemap.xml")
robots=get(origin+"/robots.txt")
if sitemap["status"]!=200: issue("sitemap_http",origin+"/sitemap.xml",sitemap["status"])
if robots["status"]!=200: issue("robots_http",origin+"/robots.txt",robots["status"])
if re.search(r"(?im)^\s*disallow:\s*/\s*$",robots["body"]): issue("robots_blocks_all",origin+"/robots.txt","Disallow: /")
urls=set()
if sitemap["status"]==200:
    try:
        root=ET.fromstring(sitemap["body"])
        locations=[x.text.strip() for x in root.iter() if x.tag.split("}")[-1]=="loc" and x.text]
        for url in locations:
            if internal(url): urls.add(normalize(url))
            elif url.endswith(".xml"): warn("external_sitemap_reference",url,"review sitemap index")
    except ET.ParseError as e: issue("invalid_sitemap",origin+"/sitemap.xml",e)
if not urls: issue("empty_or_unreadable_sitemap",origin+"/sitemap.xml","No published canonical URLs found; check site release/indexability settings")
if len(urls)>settings["max_pages"]: issue("sitemap_limit",origin,len(urls))
slugs=set()
for filename in glob.glob(settings["editorial_glob"]):
    for p in json.loads(Path(filename).read_text()):
        slug=p.get("slug")
        if isinstance(slug,str): slugs.add(plain_path(slug))
if not slugs: issue("source_inventory_missing",origin,"No editorial source routes found")
for route in sorted(slugs):
    if normalize(route) not in urls: warn("editorial_route_missing_from_sitemap",route,"Check whether route is published; never add unpublished drafts automatically")
targets={normalize(x) for x in urls}|{normalize(plain_path(x)) for x in settings["seed_paths"]}|{normalize(u) for u in slugs}
targets=set(sorted(targets)[:settings["max_pages"]])
with concurrent.futures.ThreadPoolExecutor(max_workers=settings["workers"]) as pool:
    responses=dict(zip(sorted(targets),pool.map(get,sorted(targets))))
pages=[]; links=set(); external=set(); anchors={}; link_pages={}
for url,res in responses.items():
    if res["status"]!=200:
        issue("page_http",url,res["status"]);continue
    soup=BeautifulSoup(res["body"],"html.parser")
    title=soup.title.get_text(" ",strip=True) if soup.title else ""
    descriptions=[x.get("content","").strip() for x in soup.find_all("meta",attrs={"name":re.compile("^description$",re.I)})]
    canonical=[x.get("href","") for x in soup.find_all("link",rel=lambda v:v and "canonical" in v)]
    h1=[x.get_text(" ",strip=True) for x in soup.find_all("h1")]
    robots_meta=" ".join(x.get("content","") for x in soup.find_all("meta",attrs={"name":re.compile("^robots$",re.I)}))
    header_robots=next((v for k,v in res["headers"].items() if k.lower()=="x-robots-tag"),"")
    if not title:issue("missing_title",url,"")
    if len(descriptions)!=1 or not descriptions[0]:issue("description",url,descriptions)
    if len(h1)!=1 or not h1[0]:issue("h1",url,len(h1))
    if config["expect_indexable"] and re.search("noindex",robots_meta+" "+header_robots,re.I):issue("unexpected_noindex",url,robots_meta+" "+header_robots)
    if len(canonical)!=1:issue("canonical_count",url,len(canonical))
    elif normalize(urllib.parse.urljoin(url,canonical[0]))!=normalize(url):warn("canonical_mismatch",url,canonical[0])
    if not soup.html or not soup.html.get("lang"):warn("missing_html_lang",url,"")
    if not soup.find("meta",attrs={"name":"viewport"}):warn("missing_viewport",url,"")
    for image in soup.find_all("img"):
        if image.get("alt") is None:warn("missing_image_alt",url,image.get("src","")[:100])
    for schema in soup.find_all("script",attrs={"type":"application/ld+json"}):
        try:json.loads(schema.get_text())
        except ValueError:issue("invalid_jsonld",url,"")
    anchors[url]={a.get("id") for a in soup.find_all(id=True)}
    for a in soup.find_all("a",href=True):
        href=a["href"].strip()
        if not href or href.startswith(("mailto:","tel:","javascript:","data:")):continue
        resolved=urllib.parse.urljoin(url,href)
        p=urllib.parse.urlsplit(resolved)
        if p.scheme not in ("http","https"):continue
        target=normalize(resolved)
        if internal(resolved):
            links.add(target)
            link_pages.setdefault(target,set()).add(url)
            if p.fragment and target==normalize(url) and urllib.parse.unquote(p.fragment) not in anchors[url]:issue("broken_fragment",url,href)
        else:external.add(target)
    if url in urls and (not title or len(h1)!=1):issue("sitemap_low_quality",url,"Missing title or H1")
    pages.append(dict(url=url,title=title,description=descriptions[0] if descriptions else "",h1=h1,canonical=canonical))
for attr in ("title","description"):
    values={}
    for page in pages:
        v=page[attr]
        if v:values.setdefault(v,[]).append(page["url"])
    for name,paths in values.items():
        if len(paths)>1:warn("duplicate_"+attr,paths[0],paths[:10])
# Crawl internal links, not just sitemap routes. Avoid treating rate limits as broken links.
uncrawled=sorted(links-set(responses))[:settings["max_internal_links"]]
with concurrent.futures.ThreadPoolExecutor(max_workers=settings["workers"]) as pool:
    checked=list(pool.map(get,uncrawled))
for url,r in zip(uncrawled,checked):
    if r["status"] in (404,410):issue("broken_internal_link",url,r["status"])
    elif r["status"]>=400 or not r["status"]:warn("uncertain_internal_link",url,r["status"])
# External systems can reject bots; treat their responses as leads only.
external_list=sorted(external)[:settings["max_external_links"]]
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
    outside=list(pool.map(get,external_list))
for url,r in zip(external_list,outside):
    if r["status"] in (404,410):warn("external_link_not_found",url,r["status"])
    elif r["status"]>=400 or not r["status"]:warn("external_link_unavailable",url,r["status"])
for url in sorted(urls):
    if url in responses and responses[url]["status"] in (404,410):issue("dead_sitemap_url",url,responses[url]["status"])
# Only same-origin, one-hop *permanent* redirects are eligible for an autofix PR.
# The audit never edits live pages or CMS material.
class RefuseRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None
no_redirect=urllib.request.build_opener(RefuseRedirect)
def permanent_redirect(url):
    if urllib.parse.urlsplit(url).query: return None
    try:
        req=urllib.request.Request(url,method="HEAD",headers={"User-Agent":"DGI-Weekly-SEO-Quality/1.0"})
        no_redirect.open(req,timeout=settings["timeout_seconds"]).close()
    except urllib.error.HTTPError as e:
        if e.code not in (301,308): return None
        destination=urllib.parse.urljoin(url,e.headers.get("Location",""))
        src=urllib.parse.urlsplit(url);dst=urllib.parse.urlsplit(destination)
        if src.scheme!="https" or dst.scheme!="https" or src.hostname!=host or dst.hostname!=host or dst.query or dst.fragment: return None
        dst_url=normalize(destination)
        if dst_url==normalize(url) or dst_url not in urls: return None
        return dict(old=normalize(url),new=dst_url,status=e.code,observed_on=sorted(link_pages.get(normalize(url),set())))
    except Exception:
        return None
redirect_candidates=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
    for finding in pool.map(permanent_redirect, sorted(links)[:250]):
        if finding: redirect_candidates.append(finding)
result=dict(generated_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),site=origin,stats=dict(sitemap_urls=len(urls),html_pages=len(pages),internal_links=len(links),external_links=len(external),permanent_redirects=len(redirect_candidates),errors=len(issues),warnings=len(warnings)),errors=issues,warnings=warnings,sitemap_urls=sorted(urls),pages=pages,safe_redirect_candidates=redirect_candidates)
Path("test-results").mkdir(exist_ok=True)
Path("test-results/weekly-seo.json").write_text(json.dumps(result,ensure_ascii=False,indent=2))
with open(os.environ.get("GITHUB_STEP_SUMMARY","/dev/null"),"a") as f:
    f.write("## DGI weekly SEO\n"+json.dumps(result["stats"],ensure_ascii=False)+"\n")
print("SEO_SUMMARY",json.dumps(result["stats"],ensure_ascii=False))
for e in issues[:50]:print("SEO_ERROR",json.dumps(e,ensure_ascii=False))
sys.exit(1 if issues else 0)
