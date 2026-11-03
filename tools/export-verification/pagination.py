"""Scoped native-PDF keep-with-content assertions; not visual review."""
import re

def normalize(text):
    return re.sub(r'\s+', '', text).casefold()

def inspect(content, pairs):
    pages = [normalize(page) for page in content.split('\f')]
    results = []
    for pair in pairs:
        heading, following = normalize(pair['heading']), normalize(pair['following'])
        assert heading and following, 'Empty PDF pagination fragment'
        if 'headingOccurrence' in pair:
            occurrence = pair['headingOccurrence']
            assert type(occurrence) is int and occurrence > 0, 'Invalid PDF heading occurrence'
            locations = [(i, match.start()) for i, page in enumerate(pages)
                         for match in re.finditer(re.escape(heading), page)]
            assert len(locations) >= occurrence, f"Missing PDF heading occurrence: {pair['heading']}"
            index, start = locations[occurrence - 1]
            matches = [index + 1] if following in pages[index][start + len(heading):] else []
        else:
            matches = [i + 1 for i, page in enumerate(pages) if heading in page and following in page]
        assert matches, f"Orphaned PDF heading: {pair['heading']}"
        results.append({**pair, 'pages': matches, 'passed': True})
    return results
