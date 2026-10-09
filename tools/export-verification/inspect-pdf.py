"""Inspect every native Chromium PDF page; retain PNGs for separate visual review."""
import json, pathlib, re, subprocess, sys, xml.etree.ElementTree as ET

pdf, directory, expected_file = map(pathlib.Path, sys.argv[1:])
info = subprocess.check_output(['pdfinfo', str(pdf)], text=True)
count = int(re.search(r'^Pages:\s+(\d+)', info, re.M)[1])
subprocess.run(['pdftoppm', '-r', '72', '-png', str(pdf), str(directory / 'page')], check=True)
subprocess.run(['pdftotext', '-bbox', str(pdf), str(directory / 'bounds.html')], check=True)
root = ET.parse(directory / 'bounds.html').getroot()
pages = root.findall('.//{*}page')
assert len(pages) == count and count > 0, 'PDF page count mismatch'
results, text = [], []
for index, page in enumerate(pages, 1):
    words = page.findall('.//{*}word')
    assert words, f'Blank PDF page {index}'
    width, height = float(page.attrib['width']), float(page.attrib['height'])
    for word in words:
        x0, y0, x1, y1 = (float(word.attrib[k]) for k in ['xMin','yMin','xMax','yMax'])
        assert -1 <= x0 <= x1 <= width + 1 and -1 <= y0 <= y1 <= height + 1, f'Clipped PDF text on page {index}'
    image = sorted(directory.glob('page-*.png'))[index - 1]
    assert image.stat().st_size > 500, f'Empty page rendering {index}'
    results.append({'page': index, 'file': str(image), 'passed': True, 'words': len(words)})
    text.extend(word.text or '' for word in words)
normalize = lambda s: re.sub(r'\s+', '', s).casefold()
# Bounding-box reading order can interleave adjacent table columns. The
# content stream preserves each printed cell's prose; geometry remains checked
# independently above for every word on every rendered page.
content = subprocess.check_output(['pdftotext', '-raw', str(pdf), '-'], text=True)
(directory / 'content.txt').write_text(content)
actual = normalize(content)
expected = json.loads(expected_file.read_text())
for heading in expected['headings']:
    assert normalize(heading) in actual, f'Missing PDF section: {heading}'
for annotation in expected['printAnnotations']:
    assert normalize(annotation) in actual, f'Missing printable change context: {annotation}'
assert normalize(expected['revision']) in actual, 'Missing PDF content identity'
for control in ['Save dated snapshot (.html)', 'Print / save PDF', 'Copy comparison link']:
    assert normalize(control) not in actual, f'Interactive control leaked into PDF: {control}'
result = {'passed': True, 'pageCount': count, 'pages': results,
          'method': 'native Chromium print; Poppler renders every page; text bounds, nonblank pages and section completeness',
          'humanVisualReview': 'not-performed'}
(directory / 'inspection.json').write_text(json.dumps(result, indent=2))
print(json.dumps(result))
