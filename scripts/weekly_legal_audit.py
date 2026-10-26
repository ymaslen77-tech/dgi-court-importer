#!/usr/bin/env python3
"""Evidence inventory, NOT an automated legal opinion. Never alters published content.

Run from repo root:
  python3 scripts/weekly_legal_audit.py --config config/weekly-legal-audit.json --output audit-report.json
Official amendment and legal-effect checks are performed in the separate weekly
editorial review, which uses this report as leads, not as proof of legal change.
"""
from __future__ import annotations

import argparse
import concurrent.futures
import datetime as dt
import glob
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import sys
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit, urljoin
from urllib.request import Request, urlopen
from xml.etree import ElementTree

UTC = dt.timezone.utc
LEGAL_HINT = re.compile(
    r"(закон|постановлен|распоряжен|регламент|приказ|кодекс|статья|ст\.\s*\d|"
    r"срок|штраф|госпошлин|согласован|прав[оа]|пода[чт]|суд|квартир|жилищ|"
    r"дги|приватиза|реновац|кадастр|соц[^\s]{0,12}\s+найм)", re.I
)
TEMPORAL = re.compile(
    r"(?:с\s+\d{1,2}\s+[а-яё]+\s+20\d{2}\s+года|до\s+\d{1,2}\s+[а-яё]+\s+20\d{2}|"
    r"(?:20[12]\d)\s*(?:году|года|год)|"
    r"(?:в\s+течение|не\s+позднее)\s+\d{1,3}\s+(?:календарных|рабочих)?\s*(?:дн|месяц|год)|"
    r"\b\d{1,2}\s+(?:рабочих|календарных)\s+дн)", re.I
)
ACT_REF = re.compile(
    r"(?:№\s*[\dА-ЯA-Z/-]+|стать[яеию]\s*\d+(?:\.\d+)?|"
    r"\b\d+(?:\.\d+)?\s*(?:ФЗ|ПП|ОЗ)\b)", re.I
)
USER_AGENT = "DGI-public-legal-evidence-audit/1.0 (weekly; read-only)"


class WebsiteHTML(HTMLParser):
    def __init__(self, base_url):
        super().__init__(convert_charrefs=True)
        self.base = base_url
        self.stack = []
        self.skip = 0
        self.h1 = []
        self.heading_buffer = None
        self.all_text = []
        self.links = set()

    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        self.stack.append(tag)
        if tag in ("script", "style", "noscript"):
            self.skip += 1
        if tag == "h1":
            self.heading_buffer = []
        if tag == "a" and d.get("href"):
            self.links.add(urljoin(self.base, d["href"]))

    def handle_endtag(self, tag):
        if tag == "h1" and self.heading_buffer is not None:
            self.h1.append(" ".join(self.heading_buffer).strip())
            self.heading_buffer = None
        if tag in ("script", "style", "noscript") and self.skip:
            self.skip -= 1
        if tag in self.stack:
            # Closing tags can be malformed: never raise for a live web page.
            self.stack = self.stack[:len(self.stack) - 1 - self.stack[::-1].index(tag)]

    def handle_data(self, data):
        if self.skip:
            return
        text = " ".join(data.split())
        if not text:
            return
        if self.heading_buffer is not None:
            self.heading_buffer.append(text)
        self.all_text.append(text)


def http_check(url, timeout=10, parse_html=False):
    try:
        url_parts = urlsplit(url)
        if url_parts.scheme != "https" or not url_parts.hostname:
            return {"url": url, "status": "non_https", "http_code": 0}
        method = "GET" if parse_html else "HEAD"
        request = Request(url, headers={"User-Agent": USER_AGENT}, method=method)
        try:
            response = urlopen(request, timeout=timeout)
        except HTTPError as e:
            if not parse_html and e.code in (403, 405, 406, 429, 501):
                response = urlopen(Request(url, headers={
                    "User-Agent": USER_AGENT, "Range": "bytes=0-4095"
                }, method="GET"), timeout=timeout)
            else:
                raise
        with response as stream:
            code = stream.status
            target = stream.url
            last_modified = stream.headers.get("Last-Modified")
            mime = stream.headers.get("Content-Type", "")
            raw = stream.read(1_600_000 if parse_html else 1024)
        result = {"url": url, "status": "ok" if code == 200 else "http_error",
                  "http_code": code, "final_url": target}
        if last_modified:
            result["last_modified_header"] = last_modified
        if parse_html and ("text/html" in mime or "application/xhtml" in mime):
            parser = WebsiteHTML(target)
            parser.feed(raw.decode("utf-8", "replace"))
            text = " ".join(parser.all_text)
            result.update({
                "h1_count": len(parser.h1), "h1": parser.h1[:3],
                "text_length": len(text),
                "text_sha256": hashlib.sha256(text.encode("utf-8")).hexdigest(),
                "source_links": sorted(link for link in parser.links
                    if urlsplit(link).scheme == "https" and
                    urlsplit(link).hostname != url_parts.hostname),
                "temporal_claims": extract_claims(text, TEMPORAL, limit=16),
                "legal_references": extract_claims(text, ACT_REF, limit=16),
            })
        return result
    except HTTPError as e:
        status = "unavailable" if e.code in (401, 403, 408, 429) or e.code >= 500 else "broken"
        return {"url": url, "status": status, "http_code": e.code}
    except (TimeoutError, URLError, OSError, ValueError) as e:
        return {"url": url, "status": "unavailable", "error_class": type(e).__name__}


def extract_claims(text, expression, limit=10):
    claims = []
    for match in expression.finditer(text):
        left = max(0, match.start() - 100)
        right = min(len(text), match.end() + 140)
        excerpt = text[left:right].strip()
        if excerpt not in claims:
            claims.append(excerpt)
        if len(claims) >= limit:
            break
    return claims


def load_local_pages(config):
    root_pattern = config["inventory"]["migrated_data_glob"]
    paths = sorted(glob.glob(root_pattern))
    if not paths:
        raise RuntimeError("Migration JSON snapshot files not found; audit cannot start")
    pages, source_links = [], set()
    for filename in paths:
        with open(filename, encoding="utf8") as fp:
            entries = json.load(fp)
        if not isinstance(entries, list):
            raise ValueError("Invalid migrated pages batch: " + filename)
        for page in entries:
            if not isinstance(page, dict):
                continue
            slug = page.get("slug", "")
            if slug != "" and not re.fullmatch(r"[a-z0-9-]+", slug):
                raise ValueError("Invalid slug in " + filename)
            texts = [b.get("text", "") for b in page.get("blocks", []) if isinstance(b, dict)]
            text = " ".join(texts)
            source_links.update(
                b["href"] for b in page.get("blocks", [])
                if isinstance(b, dict) and b.get("kind") == "link" and
                isinstance(b.get("href"), str) and b["href"].startswith("https://")
            )
            pages.append({
                "slug": slug or "/", "source_batch": filename,
                "content_sha256": hashlib.sha256(text.encode("utf8")).hexdigest(),
                "temporal_claims": extract_claims(text, TEMPORAL),
                "legal_references": extract_claims(text, ACT_REF)
            })
    return pages, source_links


def sitemap_urls(config, timeout):
    root_url = config["inventory"]["site_sitemap"]
    try:
        req = Request(root_url, headers={"User-Agent": USER_AGENT})
        with urlopen(req, timeout=timeout) as r:
            data = r.read(5_000_000)
        xml_root = ElementTree.fromstring(data)
        locs = [e.text for e in xml_root.iter() if e.tag.split("}")[-1] == "loc" and e.text]
        prefix = config["service"].rstrip("/") + "/"
        urls = sorted({u for u in locs if u.startswith(prefix)})
        max_urls = config["monitoring"]["max_urls"]
        if len(urls) > max_urls:
            return [], {"status": "too_many_urls", "found": len(urls)}
        if not urls:
            return [], {"status": "no_public_entries", "found": len(locs)}
        return urls, {"status": "ok", "found": len(urls)}
    except (HTTPError, URLError, TimeoutError, ElementTree.ParseError, ValueError) as e:
        return [], {"status": "unavailable", "error_class": type(e).__name__}


def review_links(urls, timeout, workers):
    def check(url):
        return http_check(url, timeout=timeout, parse_html=False)
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as pool:
        return list(pool.map(check, sorted(urls)))


def audit(config):
    monitoring = config["monitoring"]
    base = config["service"].rstrip("/")
    timeout = monitoring["http_timeout_seconds"]
    workers = monitoring["parallel_requests"]
    snapshots, source_links = load_local_pages(config)
    sitemap, sitemap_status = sitemap_urls(config, timeout)
    explicit = {base + p for p in config["inventory"]["site_paths"]}
    # Check the canonical live inventory (including CMS pages, news and cases)
    # plus every original snapshot slug. Inactive drafts may return 404 and are
    # reported separately, not treated as regressions in public content.
    local_urls = {base + (p["slug"] if p["slug"] != "/" else "/") for p in snapshots}
    targets = sorted(set(sitemap) | explicit | local_urls)
    def inspect(url):
        return http_check(url, timeout=timeout, parse_html=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as pool:
        live_pages = list(pool.map(inspect, targets))
    public = [p for p in live_pages if p["status"] == "ok"]
    for page in public:
        source_links.update(link for link in page.get("source_links", [])
            if urlsplit(link).hostname and urlsplit(link).hostname not in
            (urlsplit(base).hostname, "localhost"))
    links = review_links(source_links, timeout=timeout, workers=workers)
    report = {
        "version": config["version"],
        "mode": "read_only_evidence_collection_never_legal_certification",
        "generated_at_utc": dt.datetime.now(UTC).isoformat(),
        "site": base,
        "source_policy": config["source_policy"],
        "sitemap": sitemap_status,
        "summary": {
            "historical_snapshot_pages": len(snapshots),
            "live_urls_tested": len(live_pages),
            "live_http_200": len(public),
            "live_unavailable": sum(p["status"] == "unavailable" for p in live_pages),
            "live_broken_or_inactive": sum(p["status"] == "broken" for p in live_pages),
            "public_unusual_h1": sum(p.get("h1_count", 1) != 1 for p in public),
            "external_urls_tested": len(links),
            "external_broken": sum(p["status"] == "broken" for p in links),
            "external_unavailable": sum(p["status"] == "unavailable" for p in links)
        },
        "snapshot_inventory": snapshots,
        "live_pages": live_pages,
        "external_links": links,
        "editorial_instructions": [
            "The output does NOT verify legal currency; independently read current official legal texts for each public legal claim.",
            "Compare the live page with the published CMS revision; never silently edit only the historical JSON snapshot.",
            "Review all legal claims across published pages, including claims not matched by automated patterns.",
            "If an external official site is blocked, mark it unverified and use another authoritative official access path.",
            "For every factual edit document exact official document, edition, date of effect and previous/new assertion.",
            "Run CI and release validation before marking any change as published."
        ]
    }
    return report


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--config", default="config/weekly-legal-audit.json")
    p.add_argument("--output", default="weekly-legal-audit-report.json")
    args = p.parse_args()
    config = json.loads(Path(args.config).read_text(encoding="utf8"))
    report = audit(config)
    destination = Path(args.output)
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
    print("LEGAL_WEEKLY_REPORT", destination)
    print("SUMMARY", json.dumps(report["summary"], ensure_ascii=False))
    print("SITEMAP", json.dumps(report["sitemap"], ensure_ascii=False))
    print("NEXT_STEP: independent legal review required; no source-only inference, no automatic changes from HTTP statuses")
    # Only structural inventory failure blocks the CI collector. Website access
    # failures are reported as inconclusive and do not trigger bogus legal edits.
    return 0


if __name__ == "__main__":
    sys.exit(main())
