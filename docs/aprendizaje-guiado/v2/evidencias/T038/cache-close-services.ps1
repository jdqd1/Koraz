$ErrorActionPreference = 'Stop'
$clusterT038 = Get-Content -LiteralPath (Join-Path $PSScriptRoot '../M01/cluster.json') -Raw | ConvertFrom-Json
$expectedDataT038 = 'C:\Users\josed\AppData\Local\Temp\koraz-guided-v2-3d5cf4ba2d2c45ee8e272fb75da35fbc'
$expectedBinT038 = 'C:\Users\josed\.codex\tmp\koraz-t015-postgres\pgsql\bin'
if (-not $clusterT038.disposable -or $clusterT038.port -ne 55435 -or $clusterT038.controlUrl -ne 'postgresql://koraz_test@127.0.0.1:55435/koraz_guided_v2_control_test') { throw 'Unexpected test cluster' }
$dataT038 = (Resolve-Path -LiteralPath $clusterT038.data).Path
$binT038 = (Resolve-Path -LiteralPath $clusterT038.postgresBin).Path
if ($dataT038 -ne $expectedDataT038 -or $binT038 -ne $expectedBinT038) { throw 'Unexpected resolved cluster paths' }
$cleanupT038 = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'database-cleanup-verification.json') -Raw | ConvertFrom-Json
if ($cleanupT038.status -ne 'PASS' -or $cleanupT038.remaining.Count -ne 0 -or $cleanupT038.otherConnections.Count -ne 0 -or ((Get-Date).ToUniversalTime() - [datetime]$cleanupT038.at).TotalSeconds -gt 60) { throw 'Require fresh successful database and connection verification before stop' }
& (Join-Path $binT038 'pg_ctl.exe') -D $dataT038 -m fast -w stop *> (Join-Path $PSScriptRoot 'cache-postgres-stop.txt')
if ($LASTEXITCODE -ne 0) { Get-Content -LiteralPath (Join-Path $PSScriptRoot 'cache-postgres-stop.txt'); throw 'Marked PostgreSQL did not stop cleanly' }
$listenersT038 = @(Get-NetTCPConnection -State Listen -LocalPort 31035,41035,55435 -ErrorAction SilentlyContinue | Select-Object LocalAddress,LocalPort,OwningProcess)
[pscustomobject]@{status=$(if ($listenersT038.Count -eq 0) {'PASS'} else {'FAIL'});at=(Get-Date).ToUniversalTime().ToString('o');checkedPorts=@(31035,41035,55435);listeners=$listenersT038;postgresStopped=$true} | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'services-cleanup.json') -Encoding utf8
if ($listenersT038.Count -ne 0) { throw 'Test ports remain occupied; no unrelated process was stopped' }
