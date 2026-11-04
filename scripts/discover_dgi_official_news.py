#!/usr/bin/env python3
"""Discover NEW official Moscow-region housing-news URLs. Research ONLY.

No CMS writes, fake signoffs, legal conclusions or automatic news publication.
Source text and dates are leads: a separately verified original article must
pass the existing publication policy and protected PR before release.
"""
import argparse
import datetime as dt
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
PUBLISHED = ROOT / "apps/web/src/data/housing-news.json"
DEFAULT_OUTPUT = ROOT / "test-results/dgi-official-news-discovery.json"
LISTINGS = (
    "https://tender.mos.ru/news/",
    "https://mosreg.ru/sobytiya/novosti?tags_ids=15114",
    "https://mosreg.ru/sobytiya/novosti/organy/ministerstvo-zhilischno-kommunalnogo-hozyayst",
    "https://mosreg.ru/sobytiya/novosti/organy/ministerstvo-zhilishnoi-politiki-moskovskoi-oblasti",
    "https://mio.mosreg.ru/",
)
TOPIC = re.compile(
    r"жиль|жилищ|квартир|недвижим|реновац|земел|земл|кадастр|"
    r"собственност|квартал|новостро|дольщик|застро|многодет|"
    r"водоснабжен|водоотведен|канализац|жкх|коммунал|очистн|"
    r"подключени|субсиди|торг|помещени|домов|дома|строительств",
    re.I,
)
MONTHS = dict(zip(
    "января февраля марта апреля мая июня июля августа сентября октября ноября декабря".split(),
    range(1, 13),
))
RU_DATE = re.compile(
    r"(?<!\d)(\d{1,2})\s+(" + "|".join(MONTHS) + r")\s+(20\d{2})\s*(?:г\.?|года)?",
    re.I,
)
USER_AGENT = "DGI-Source-Discovery/1.0 (+https://dgi-pravo.ru/)"
MAX_BYTES = 2_000_000


def normalized_article(url):
    try:
        parts = urllib.parse.urlsplit(url.strip())
        host = (parts.hostname or "").lower()
        if (parts.scheme != "https" or parts.username or parts.password
                or parts.port or parts.fragment or len(url) > 1800):
            return None
        path = parts.path.rstrip("/") + "/"
        if host == "tender.mos.ru" and re.fullmatch(r"/news/[a-z0-9-]+/", path):
            return f"https://{host}{path}"
        if (host == "mosreg.ru" or host.endswith(".mosreg.ru")) and (
                path.startswith("/sobytiya/novosti/") or
                path.startswith("/sobytiya/novosti-ministerstva/")):
            if len(path.split("/")) >= 5:
                return f"https://{host}{path}"
        if host in ("mos.ru", "www.mos.ru") and re.fullmatch(
                r"/news/item/\d+/", path):
            return f"https://{host}{path}"
    except ValueError:
        pass
    return None


def fetch_html(url):
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=18) as response:
        if response.status != 200 or response.headers.get_content_type() != "text/html":
            raise ValueError("Not an official HTML 200 response")
        target = urllib.parse.urlsplit(response.url)
        src = urllib.parse.urlsplit(url)
        if target.scheme != "https" or target.hostname != src.hostname:
            raise ValueError("Cross-host or insecure redirect refused")
        raw = response.read(MAX_BYTES + 1)
    if len(raw) > MAX_BYTES:
        raise ValueError("Official HTML too large")
    return BeautifulSoup(raw, "html.parser")


def discover_listing(html, base):
    found = {}
    for a in html.find_all("a", href=True):
        title = " ".join(a.get_text(" ", strip=True).split())
        if not (20 <= len(title) <= 210 and TOPIC.search(title)):
            continue
        url = normalized_article(urllib.parse.urljoin(base, a["href"]))
        if url:
            found.setdefault(url, title)
    return found


def published_date(soup, title):
    # Treat an explicitly published full date as required, not a page crawl date.
    candidates = []
    for tag in soup.find_all(["meta", "time"], limit=150):
        date = tag.get("datetime") or tag.get("content")
        if date and ("publish" in str(tag).lower() or tag.name == "time"):
            candidates.append(str(date))
    heading = soup.find("h1")
    if heading:
        # Only nearby article content; a site's footer may contain unrelated dates.
        following = " ".join(
            x.get_text(" ", strip=True) for x in heading.find_all_next(["time", "p", "div"], limit=12)
        )
        candidates.append(following[:1400])
    for value in candidates:
        try:
            parsed = dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
            if parsed.tzinfo:
                return parsed.date()
        except ValueError:
            pass
        match = RU_DATE.search(value)
        if match:
            try:
                return dt.date(int(match.group(3)), MONTHS[match.group(2).lower()], int(match.group(1)))
            except ValueError:
                continue
    return None


def summarize_candidate(soup, url, expected_title, today, lookback):
    h1 = soup.find("h1")
    title = " ".join(h1.get_text(" ", strip=True).split()) if h1 else ""
    if len(title) < 20 or not TOPIC.search(title):
        return None
    date = published_date(soup, title)
    if date is None or not dt.timedelta(0) <= today - date <= dt.timedelta(days=lookback):
        return None
    paragraphs = []
    for p in soup.find_all("p"):
        value = " ".join(p.get_text(" ", strip=True).split())
        if 85 <= len(value) <= 1600 and value not in paragraphs:
            paragraphs.append(value)
        if len(paragraphs) >= 4:
            break
    if not paragraphs:
        return None
    return {
        "official_url": url, "official_title": title, "official_date": date.isoformat(),
        "source_excerpt_for_research_only": [x[:500] for x in paragraphs],
        "review_state": "source_candidate_only_requires_factual_editorial_verification",
        "eligible_for_publication": False,
    }


def run(limit=30, lookback=7, output=DEFAULT_OUTPUT):
    today = dt.datetime.now(dt.timezone(dt.timedelta(hours=3))).date()
    old = json.loads(PUBLISHED.read_text(encoding="utf-8"))
    seen = {normalized_article(x.get("sourceUrl", "")) for x in old}
    sources = {}
    errors = []
    for listing in LISTINGS:
        try:
            sources.update(discover_listing(fetch_html(listing), listing))
        except (OSError, ValueError, TimeoutError) as error:
            errors.append({"source": listing, "reason": type(error).__name__})
    candidates = []
    for url, title in sources.items():
        if url in seen:
            continue
        try:
            news = summarize_candidate(fetch_html(url), url, title, today, lookback)
            if news:
                candidates.append(news)
        except (OSError, ValueError, TimeoutError) as error:
            errors.append({"source": url, "reason": type(error).__name__})
        if len(candidates) >= limit:
            break
    report = {
        "checked_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "publication_allowed": False, "new_publications": 0,
        "discovered_official_links": len(sources),
        "existing_news_preserved": len(old),
        "candidate_count": len(candidates),
        "candidates": candidates, "unavailable_sources": errors,
        "note": "Official lead discovery only. No source-based editorial article or court act is auto-approved.",
    }
    output = Path(output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("DGI_OFFICIAL_NEWS_DISCOVERY", json.dumps({
        "sources": len(sources), "candidates": len(candidates), "errors": len(errors),
        "new_publications": 0,
    }))
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=30)
    parser.add_argument("--lookback-days", type=int, default=7)
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT))
    args = parser.parse_args()
    if not (1 <= args.limit <= 50 and 1 <= args.lookback_days <= 14):
        parser.error("Unsupported publication discovery bounds")
    run(args.limit, args.lookback_days, args.output)
