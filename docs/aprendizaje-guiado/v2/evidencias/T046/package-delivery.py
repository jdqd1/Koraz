"""Build and verify a selective delivery archive without changing its sources."""
import hashlib
import json
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

evidence = Path(__file__).resolve().parent
root = evidence.parents[4]
docs = root / 'docs/aprendizaje-guiado/v2'
skill = root / 'tools/skills/crear-rutas-koraz'

def digest(data):
    return hashlib.sha256(data).hexdigest()

def save(name, value):
    (evidence / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

selected = {}
for source in sorted(skill.rglob('*')):
    if source.is_file():
        selected['skill/crear-rutas-koraz/' + source.relative_to(skill).as_posix()] = source

doc_paths = [
    'manuales/administracion.md', 'manuales/alumno.md', 'manuales/importacion.md', 'manuales/skill.md',
    'runbook.md', 'entrega/README.md', 'acta-HITO-S.md', 'acta-HITO-K.md',
    'evidencias/T042/result.json', 'evidencias/T042/accepted-contract-hashes.json',
    'evidencias/T042/reader-deferral.json', 'evidencias/T043/result.json', 'evidencias/T044/result.json',
    'evidencias/T045/result.json', 'evidencias/T045/README.md',
    'evidencias/T045/browser-policy-limitation.json', 'evidencias/T045/skill-repairs.json',
    'evidencias/T045/revision-contenido.md', 'evidencias/T045/content-audit.json',
    'evidencias/T045/http-journey.json', 'evidencias/T045/portable-checks.json',
    'evidencias/T046/result.json', 'evidencias/T046/README.md',
    'evidencias/T046/checklist-final.json', 'evidencias/T046/installation.json',
    'evidencias/T046/quick-validate.json', 'evidencias/T046/quick-validate.txt',
    'evidencias/T046/installed-resources.json', 'evidencias/T046/installed-cli.json',
    'evidencias/T046/prerequisite-check.json',
]
for path in doc_paths:
    source = docs / path
    assert source.is_file(), path
    selected['docs/aprendizaje-guiado/v2/' + path] = source

cases = [
    ('synthetic', 'cases/synthetic/round-2/output', 'assets-pendientes.json'),
    ('pilot', 'cases/pilot/round-3/output', 'assets-a-vincular.json'),
    ('adversarial', 'cases/adversarial/output', 'assets-pendientes.json'),
]
for case, directory, assets in cases:
    for filename in ['ruta.koraz-route.json', 'revision-de-ruta.md', assets]:
        source = docs / 'evidencias/T045' / directory / filename
        assert source.is_file(), str(source)
        selected['docs/aprendizaje-guiado/v2/evidencias/T045/' + directory + '/' + filename] = source

intro = (
    '# Entrega local Koraz guided-v2\n\n'
    'Instalación/documentación PASS local. Hito K original completo NO VERIFICADO.\n'
    'Consulta docs/aprendizaje-guiado/v2/entrega/README.md y acta-HITO-K.md.\n\n'
    'skill/crear-rutas-koraz contiene los 12 archivos exactos probados e instalados. '
    'Su validador requiere Node.js 24, sin repositorio/red/dependencias externas.\n'
    'Los JSON de T045 contienen soluciones editoriales privadas. El sintético es ficticio '
    'y no médico; piloto y adversarial son borradores no publicables con incidencias.\n\n'
    'Este archivo contiene una selección explícita de evidencias, identificada en '
    'ENTREGA-MANIFEST.json. Los enlaces a dossiers históricos no empaquetados requieren '
    'el repositorio original. No contiene la aplicación, bases de datos, todas las capturas '
    'ni los logs completos; no acredita despliegue, revisión médica nueva o producción.\n'
).encode('utf-8')

entries = [{'path': 'LEEME.md', 'source': 'generated delivery introduction', 'bytes': len(intro), 'sha256': digest(intro)}]
for archive_path, source in sorted(selected.items()):
    data = source.read_bytes()
    entries.append({'path': archive_path, 'source': source.relative_to(root).as_posix(), 'bytes': len(data), 'sha256': digest(data)})

manifest = {'taskId': 'T046', 'clientDate': '2026-10-10', 'timezone': 'America/Caracas',
            'scope': 'Selective local delivery; standalone skill, documentation and selected evidence',
            'localDeliveryStatus': 'PASS', 'originalHitoKAcceptance': False,
            'selfHashExcluded': True, 'entriesCount': len(entries), 'entries': entries}
manifest_bytes = (json.dumps(manifest, ensure_ascii=False, indent=2) + '\n').encode('utf-8')
archive = evidence / 'entrega-koraz-guided-v2.zip'
with ZipFile(archive, 'w', compression=ZIP_DEFLATED, compresslevel=9) as bundle:
    bundle.writestr('LEEME.md', intro)
    for archive_path, source in sorted(selected.items()):
        bundle.writestr(archive_path, source.read_bytes())
    bundle.writestr('ENTREGA-MANIFEST.json', manifest_bytes)

with ZipFile(archive) as bundle:
    assert bundle.testzip() is None
    assert len(bundle.namelist()) == len(entries) + 1
    assert len(set(bundle.namelist())) == len(bundle.namelist())
    checks = []
    for entry in entries:
        actual = bundle.read(entry['path'])
        assert digest(actual) == entry['sha256'] and len(actual) == entry['bytes']
        assert not Path(entry['path']).is_absolute() and '..' not in Path(entry['path']).parts
        checks.append({'path': entry['path'], 'status': 'PASS'})
    assert bundle.read('ENTREGA-MANIFEST.json') == manifest_bytes

save('delivery-manifest.json', {**manifest, 'archiveFile': archive.name,
                              'archiveBytes': archive.stat().st_size,
                              'archiveSha256': digest(archive.read_bytes()),
                              'embeddedManifestSha256': digest(manifest_bytes)})
save('delivery-archive-check.json', {'status': 'PASS', 'zipCrc': 'PASS', 'entriesVerified': len(checks),
                                   'embeddedManifestVerified': True, 'totalZipEntries': len(checks) + 1,
                                   'archiveSha256': digest(archive.read_bytes()), 'checks': checks,
                                   'historicalEvidenceSelectionDeclared': True})
print(json.dumps({'archive': str(archive), 'entries': len(checks) + 1, 'bytes': archive.stat().st_size,
                  'integrity': 'PASS', 'originalFullHitoK': False}))
