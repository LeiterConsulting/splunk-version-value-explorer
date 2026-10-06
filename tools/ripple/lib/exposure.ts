import type { Assessment, Selection } from "./types";

export function compareVersion(a: string, b: string): number | null {
  if (!/^\d+\.\d+\.\d+$/.test(a) || !/^\d+\.\d+\.\d+$/.test(b)) return null;
  const av = a.split(".").map(Number), bv = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) if (av[i] !== bv[i]) return av[i] > bv[i] ? 1 : -1;
  return 0;
}
export function evaluate(record: Assessment, selection: Selection = {}) {
  if (record.reviewRequired) return { status: "review", label: "Source changed", detail: "The source changed after this assessment. Revalidation is required." };
  if (record.verdict === "review") return { status: "review", label: "Needs evidence", detail: record.rationale };
  if (record.verdict === "not_affected") return { status: "not_affected", label: "Vendor excludes", detail: "Vendor exclusion applies only to the documented product and advisory scope." };
  if (record.feature && selection.feature === "disabled") return { status: "conditional", label: "Feature disabled", detail: "You indicated the affected feature is disabled. Validate configuration and the vendor advisory; this is not a vendor exclusion." };
  if (selection.version?.trim()) {
    const version = selection.version.trim();
    if (!/^\d+\.\d+\.\d+$/.test(version)) return { status: "review", label: "Version unparsed", detail: "Use a numeric version such as 9.4.2, or check the vendor release and patch details." };
    const rule = record.rules?.find(r => version.startsWith(r.branch + "."));
    if (!rule) return { status: "review", label: "Version not mapped", detail: "This version has no verified range in the assessment. Absence of a match does not establish safety." };
    if ((compareVersion(version, rule.fixed) ?? -1) >= 0) return { status: "fixed", label: "Fix version met", detail: `Selected version meets the advisory fix ${rule.fixed} on branch ${rule.branch}. This evaluates only this CVE and scope.` };
    if ((compareVersion(version, rule.from) ?? -1) >= 0 && (compareVersion(version, rule.through) ?? 1) <= 0) return { status: "affected", label: "Affected range", detail: `Version ${version} is in the documented ${rule.from}–${rule.through} range.` };
    return { status: "review", label: "Version not mapped", detail: "Selected version is outside the verified affected range and fix mapping." };
  }
  return { status: "affected", label: record.feature ? "Feature dependent" : "Vendor confirms", detail: "The vendor lists this product as affected. Your installed version and configuration have not been assessed." };
}
export function cveIds(value: string): string[] {
  return [...new Set(value.match(/CVE-\d{4}-\d{4,}/gi)?.map(s => s.toUpperCase()) ?? [])];
}
export function plainText(html: string): string {
  return html.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]*>/g, " ").replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ").trim();
}
export function parseFeed(xml: string, origin: string, time: string) {
  const items = [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)];
  return items.slice(0, 100).flatMap(([, item]) => {
    const tag = (name: string) => plainText(item.match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)<\\/${name}>`, "i"))?.[1] ?? "");
    const title = tag("title"), url = tag("link"), description = tag("description");
    if (!title || !url.startsWith("https://")) return [];
    if (!/third.party|openssl|log4j|apache|curl|libssh|http.?2|node\.js|python|golang|linux|kernel|xz|package|library|libraries|tomcat|struts|netty|nginx|kafka/i.test(title + " " + description)) return [];
    return [{ id: url, title: title.slice(0, 240), url, origin, cves: cveIds(item), discoveredAt: time, publishedAt: tag("pubDate") || undefined }];
  });
}
