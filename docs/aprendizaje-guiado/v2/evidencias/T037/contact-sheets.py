"""Arrange unmodified browser captures for visual comparison across viewports."""
from pathlib import Path
from PIL import Image, ImageDraw

base = Path(__file__).resolve().parent
root = base / 'browser-artifacts'
roots = [base / 'reflow-recheck-artifacts', base / 'closure-artifacts', base / 'preview-final-artifacts', base / 'map-final-artifacts', base / 'native-final-artifacts', root]
keys = ['admin-empty', 'admin-0', 'admin-1', 'admin-2', 'admin-3', 'admin-4',
        'renderer-study', 'renderer-constructed', 'renderer-choice', 'renderer-short',
        'renderer-match', 'renderer-sequence', 'renderer-image', 'renderer-case',
        'learner-path', 'today', 'map', 'map-list', 'map-loaded-root', 'map-loaded-routes', 'review-empty', 'learner-zoom200',
        'learner-loading', 'learner-feedback', 'learner-error', 'image-zoom-reduced-motion',
        'image-alternative', 'keyboard-objectives', 'keyboard-dialog', 'match-table-keyboard', 'sequence-keyboard']
projects = ['desktop', '360', '390', '768']
for key in keys:
    sources = []
    for project in projects:
        candidates = [p for capture_root in roots for p in capture_root.rglob(key + '-viewport.png') if p.parent.name.endswith('-' + project)]
        if not candidates:
            continue
        p = candidates[0]
        source = Image.open(p).convert('RGB')
        scale = 350 / source.width
        thumb = source.resize((350, round(source.height * scale)))
        sources.append((project, p, thumb))
    if not sources:
        continue
    sheet = Image.new('RGB', (len(sources) * 370, max(t.height for _, _, t in sources) + 60), '#eef1f6')
    draw = ImageDraw.Draw(sheet)
    for i, (project, _, thumb) in enumerate(sources):
        draw.text((i * 370 + 10, 10), key + ' / ' + project, fill='#152044')
        sheet.paste(thumb, (i * 370 + 10, 40))
    sheet.save(base / ('comparison-' + key + '.png'))
print('Visual comparison sheets created from viewport captures.')
