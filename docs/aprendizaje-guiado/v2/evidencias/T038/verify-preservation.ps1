$ErrorActionPreference = 'Stop'
$repoT038 = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '../../../../..')).Path
$baselineT038 = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'baseline-hashes.json') -Raw | ConvertFrom-Json
$allowedT038 = @(
  'apps/api/src/providers/postgres-guided-learning-v2.ts',
  'apps/api/src/guided-learning/v2/evidence.ts',
  'apps/api/src/guided-learning/v2/selection.ts',
  'apps/api/src/guided-learning/v2/routes.ts',
  'apps/api/test/guided-v2-evidence.test.ts',
  'apps/api/test/guided-v2-selection.test.ts',
  'apps/api/test/guided-v2-routes.test.ts',
  'apps/api/test/guided-v2-security.test.ts',
  'apps/web/src/components/learning/editor/v2/activity-editor.tsx',
  'apps/web/src/components/learning/editor/v2/sources-fields.tsx',
  'apps/web/src/components/learning/editor/v2/activity-forms.test.tsx',
  'apps/web/src/components/learning/editor/v2/visual-forms.test.tsx'
)
$newT038 = 'apps/api/test/performance/guided-v2-load.mjs'
$changedT038 = @(foreach($entryT038 in $baselineT038){
  $pathT038 = Join-Path $repoT038 $entryT038.path
  if(-not(Test-Path -LiteralPath $pathT038)){
    [pscustomobject]@{path=$entryT038.path;change='missing'}
  }elseif((Get-FileHash -LiteralPath $pathT038 -Algorithm SHA256).Hash -ne $entryT038.sha256){
    [pscustomobject]@{path=$entryT038.path;change='modified'}
  }
})
$unexpectedT038 = @($changedT038 | Where-Object {$_.path -notin $allowedT038 -or $_.change -eq 'missing'})
$baselinePathsT038 = @($baselineT038 | ForEach-Object {$_.path})
$newPathsT038 = @(git -C $repoT038 ls-files --cached --others --exclude-standard apps packages database | Where-Object {$_ -notin $baselinePathsT038})
$unexpectedNewT038 = @($newPathsT038 | Where-Object {$_ -ne $newT038})
[pscustomobject]@{
  status=$(if($unexpectedT038.Count -eq 0 -and $unexpectedNewT038.Count -eq 0){'PASS'}else{'FAIL'})
  baselineFiles=$baselineT038.Count
  unchangedFiles=$baselineT038.Count-$changedT038.Count
  authorizedChanges=$changedT038
  newProductFiles=$newPathsT038
  unexpectedChanges=$unexpectedT038
  unexpectedNewFiles=$unexpectedNewT038
} | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'preservation.json')
@(@($changedT038 | ForEach-Object {$_.path}) + $newT038 | ForEach-Object {[pscustomobject]@{path=$_;sha256=(Get-FileHash -LiteralPath (Join-Path $repoT038 $_) -Algorithm SHA256).Hash}}) | ConvertTo-Json -Depth 3 | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'source-hashes.json')
if($unexpectedT038.Count -or $unexpectedNewT038.Count){throw 'Changes outside the T038 allowlist'}
