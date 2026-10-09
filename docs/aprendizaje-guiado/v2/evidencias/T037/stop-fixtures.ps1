$ErrorActionPreference = 'Stop'
& (Join-Path $PSScriptRoot 'verify-cleanup.ps1')
$clusterT037 = Get-Content -LiteralPath (Join-Path $PSScriptRoot '../M01/cluster.json') -Raw | ConvertFrom-Json
$expectedDataT037 = 'C:\Users\josed\AppData\Local\Temp\koraz-guided-v2-3d5cf4ba2d2c45ee8e272fb75da35fbc'
if ($clusterT037.disposable -ne $true -or $clusterT037.port -ne 55435 -or [System.IO.Path]::GetFullPath($clusterT037.data) -ne $expectedDataT037) { throw 'Disposable cluster identity mismatch' }
$portsT037 = @(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -in 31035, 41035, 41036 })
if ($portsT037.Count) { throw 'Owned browser services still listening; inspect before stopping PostgreSQL' }
& (Join-Path $clusterT037.postgresBin 'pg_ctl.exe') -D $clusterT037.data -m fast -w stop *> (Join-Path $PSScriptRoot 'postgres-stop.txt')
$stopExitT037 = $LASTEXITCODE
if ($stopExitT037 -ne 0) { throw 'PostgreSQL shutdown failed' }
$listenersT037 = @(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -in 31035, 41035, 41036, 55435 } | Select-Object LocalAddress, LocalPort, OwningProcess)
[pscustomobject]@{
  checkedAt = (Get-Date).ToString('o')
  status = $(if ($listenersT037.Count -eq 0) { 'PASS' } else { 'FAIL' })
  portsChecked = @(31035, 41035, 41036, 55435)
  remainingListeners = $listenersT037
  postgresStopExitCode = $stopExitT037
  postgresDataPreserved = $true
  userProcessesStopped = $false
} | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'services-cleanup.json')
if ($listenersT037.Count) { throw 'Fixture listener still present' }
