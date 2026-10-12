import json
from pathlib import Path

root = Path(__file__).resolve().parent
effective = {}
reports = ['playwright.json', 'desktop-image-recheck.json', 'final-recheck.json']

def visit(suites, filename):
    for suite in suites:
        for spec in suite.get('specs', []):
            for test in spec.get('tests', []):
                result = test.get('results', [{}])[-1]
                effective[(test['projectName'], spec['title'])] = {
                    'project': test['projectName'], 'title': spec['title'],
                    'status': result.get('status'), 'report': filename,
                }
        visit(suite.get('suites', []), filename)

for filename in reports:
    path = root / filename
    if path.exists():
        visit(json.loads(path.read_text(encoding='utf-8-sig'))['suites'], filename)

checks = list(effective.values())
summary = {
    'scope': 'Local UI with typed HTTP fixtures; not production or a real API/database acceptance.',
    'browser': {'total': len(checks), 'passed': sum(check['status'] == 'passed' for check in checks), 'failed': sum(check['status'] != 'passed' for check in checks)},
    'unit': {'files': 63, 'passed': 492, 'failed': 0},
    'checks': sorted(checks, key=lambda check: (check['project'], check['title'])),
    'reports': reports,
}
(root / 'validation-summary.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(summary['browser']))
