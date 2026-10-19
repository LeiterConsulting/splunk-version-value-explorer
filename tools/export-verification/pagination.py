"""Scoped native-PDF keep-with-content assertions; not visual review."""
import re

def normalize(text):
    return re.sub(r'\s+', '', text).casefold()

def inspect(content, pairs):
    pages = [normalize(page) for page in content.split('\f')]
    results = []
    for pair in pairs:
        heading, following = normalize(pair['heading']), normalize(pair['following'])
        matches = [i + 1 for i, page in enumerate(pages) if heading in page and following in page]
        assert matches, f"Orphaned PDF heading: {pair['heading']}"
        results.append({**pair, 'pages': matches, 'passed': True})
    return results
