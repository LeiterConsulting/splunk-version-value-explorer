"""Read the official public articles from a GitHub runner. No editorial or delivery writes."""
import concurrent.futures
import datetime
import hashlib
import json
import os
from html.parser import HTMLParser
from pathlib import Path
import subprocess
import tempfile
from urllib.parse import urlsplit

HERE = Path(__file__).resolve().parents[2]
EVIDENCE = HERE / "docs/audits/2026-11-21-release-source-support.json"
ALLOWED = {"help.splunk.com", "www.splunk.com", "github.com", "opentelemetry.io"}
def clock():
    return datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")

class Article(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_main = False
        self.in_title = False
        self.title = []
        self.body = []
    def handle_starttag(self, tag, attrs):
        if tag == "main":
            self.in_main = True
        if self.in_main and tag == "h1":
            self.in_title = True
    def handle_endtag(self, tag):
        if tag == "h1":
            self.in_title = False
        if tag == "main":
            self.in_main = False
    def handle_data(self, text):
        if self.in_title:
            self.title.append(text)
        if self.in_main:
            self.body.append(text)

def probe(item):
    address = item["finalUrl"]
    url = urlsplit(address)
    record = {"sourceId":item["id"], "url":address, "observedAt":clock()}
    if url.scheme != "https" or url.hostname not in ALLOWED or url.username or url.password or url.port:
        return {**record, "outcome":"outside-probe"}
    with tempfile.TemporaryDirectory() as tmp:
        response = Path(tmp) / "body"
        result = subprocess.run(["curl", "--silent", "--show-error", "--proto", "=https",
            "--max-time", "20", "--max-filesize", "8000000", "--output", str(response),
            "--write-out", "%{http_code}", address], capture_output=True, text=True)
        if result.returncode:
            return {**record, "outcome":"transport-unavailable", "curlExit": result.returncode}
        raw=response.read_bytes()
    article=Article()
    article.feed(raw.decode("utf-8", errors="replace"))
    title=" ".join("".join(article.title).split())
    text=" ".join(" ".join(article.body).split())
    expected=item["heading"].removeprefix("# ")
    opened=result.stdout=="200" and title.casefold()==expected.casefold() and len(text)>100
    return {**record, "status":result.stdout, "bodySha256":hashlib.sha256(raw).hexdigest(),
        "articleCharacters":len(text), "expectedTitle":expected, "title":title[:160],
        "outcome":"article-retrieved" if opened else "not-established"}

def main():
    records=json.loads(EVIDENCE.read_text())["retrievals"]
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        findings=list(pool.map(probe, records))
    result={"kind":"independent-origin-access-probe","startedBy":"github-actions","commit":os.environ["GITHUB_SHA"],
        "runId":os.environ["GITHUB_RUN_ID"],"runAttempt":os.environ["GITHUB_RUN_ATTEMPT"],"finishedAt":clock(),
        "qualification":"Access and article identity only. No source assessment, owner coverage or publication credit.",
        "observations":findings}
    Path("source-access.json").write_text(json.dumps(result,indent=2)+"\n")
    print(f"Retrieved {sum(f['outcome']=='article-retrieved' for f in findings)}/{len(findings)} expected official articles.")
if __name__=="__main__":
    main()
