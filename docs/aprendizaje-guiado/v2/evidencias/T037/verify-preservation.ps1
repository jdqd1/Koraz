$ErrorActionPreference = 'Stop'
$repoT037 = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '../../../../..')).Path
$baselineT037 = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'baseline-hashes.json') -Raw | ConvertFrom-Json
$allowedT037 = @(
  'apps/web/src/app/interface-polish.css',
  'apps/web/src/app/reference-dashboard.css',
  'apps/web/src/components/app-shell.tsx',
  'apps/web/src/components/learning/editor/v2/editor-shell.tsx',
  'apps/web/src/components/learning/editor/v2/use-route-editor.ts',
  'apps/web/src/components/learning/editor/v2/styles.module.css',
  'apps/web/src/components/learning/editor/v2/assessment-editor.tsx',
  'apps/web/src/components/learning/map/learning-map-workspace.tsx',
  'apps/web/src/components/learning/map/learning-map.module.css',
  'apps/web/src/components/learning/v2/player.tsx'
)
$changedT037 = @(foreach ($entryT037 in $baselineT037) {
  $fileT037 = Join-Path $repoT037 $entryT037.path
  if (-not (Test-Path -LiteralPath $fileT037)) {
    [pscustomobject]@{ path = $entryT037.path; change = 'missing' }
  } elseif ((Get-FileHash -LiteralPath $fileT037 -Algorithm SHA256).Hash -ne $entryT037.sha256) {
    [pscustomobject]@{ path = $entryT037.path; change = 'modified' }
  }
})
$unexpectedT037 = @($changedT037 | Where-Object { $_.path -notin $allowedT037 -or $_.change -eq 'missing' })
[pscustomobject]@{
  checkedAt = (Get-Date).ToString('o')
  baselineFiles = $baselineT037.Count
  unchangedFiles = $baselineT037.Count - $changedT037.Count
  authorizedChanges = $changedT037
  unexpectedChanges = $unexpectedT037
  status = $(if ($unexpectedT037.Count -eq 0) { 'PASS' } else { 'FAIL' })
} | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'preservation.json')
if ($unexpectedT037.Count) { throw 'Changes outside the T037 allowlist' }
$hashFilesT037 = @($allowedT037) + 'apps/web/src/components/learning/v2/player.module.css' + 'apps/web/tests/e2e/guided-v2-accessibility.spec.ts'
@($hashFilesT037 | ForEach-Object {
  [pscustomobject]@{ path = $_; sha256 = (Get-FileHash -LiteralPath (Join-Path $repoT037 $_) -Algorithm SHA256).Hash }
}) | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'source-hashes.json')
