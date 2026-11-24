import assert from 'node:assert/strict';

const normalize = value => value.replace(/\s+/g, ' ').trim();

// Only expand a normal disclosure. Preserve all original keyboard/navigation
// state for the export harness and exclude print-only and hidden DOM text.
async function readSurface(page, proof, offline) {
  return page.evaluate(({proof, offline}) => {
    const root = document.querySelector(offline ? 'body' : 'main');
    if (!root) return {answer: false, citation: false};
    const opened = [];
    try {
      const details = [...root.querySelectorAll('details:not([open])')];
      for (const disclosure of details) {
        const summary = disclosure.querySelector(':scope > summary');
        if (summary?.checkVisibility() && summary.getClientRects().length) {
          summary.click();
          opened.push(disclosure);
        }
      }
      const visible = el => el.checkVisibility({visibilityProperty: true, opacityProperty: true}) && el.getClientRects().length;
      const compact = text => text.replace(/\s+/g, ' ').trim();
      const answer = offline ? proof.reportAnswer || proof.answer : proof.answer;
      const regions = offline ? [root] : [...root.querySelectorAll(proof.region)];
      const url = new URL(proof.sourceUrl).href;
      return {
        answer: regions.some(el => visible(el) && compact(el.innerText).includes(compact(answer))),
        citation: [...root.querySelectorAll('a[href]')].some(el => visible(el) && el.href === url),
      };
    } finally {
      for (const disclosure of opened.reverse()) if (disclosure.open) disclosure.querySelector(':scope > summary').click();
    }
  }, {proof, offline});
}

export async function checkReaderSurface(page, proofs, offline = false) {
  for (const proof of proofs) {
    const result = await readSurface(page, proof, offline);
    const scope = proof.capabilityId + ' on ' + proof.routeId + (offline ? ' offline' : ' screen');
    assert(result.answer, scope + ' missing visible answer: ' + normalize(offline && proof.reportAnswer || proof.answer));
    assert(result.citation, scope + ' missing public citation: ' + proof.sourceUrl);
  }
}
