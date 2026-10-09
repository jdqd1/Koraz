param([string]$PostgresBin='C:\Users\josed\.codex\tmp\koraz-t015-postgres\pgsql\bin')
$ErrorActionPreference='Stop'
if(Get-NetTCPConnection -LocalPort 55435 -State Listen -ErrorAction SilentlyContinue){throw '55435 occupied; refusing existing server'}
$m01Data=Join-Path ([IO.Path]::GetTempPath()) ('koraz-guided-v2-'+[guid]::NewGuid().ToString('N'))
& (Join-Path $PostgresBin 'initdb.exe') -D $m01Data -U koraz_test -A trust --encoding=UTF8 --locale=C
if($LASTEXITCODE -ne 0){throw 'initdb failed'}
$m01Process=Start-Process -FilePath (Join-Path $PostgresBin 'pg_ctl.exe') -ArgumentList @('-D',('"'+$m01Data+'"'),'-l',('"'+(Join-Path $m01Data 'server.log')+'"'),'-o','"-h 127.0.0.1 -p 55435"','-w','start') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $m01Data 'pgctl.stdout') -RedirectStandardError (Join-Path $m01Data 'pgctl.stderr')
$m01Process.WaitForExit()
Get-Content (Join-Path $m01Data 'pgctl.stdout')
Get-Content (Join-Path $m01Data 'pgctl.stderr')
if($m01Process.ExitCode -ne 0){throw 'pg_ctl failed'}
& (Join-Path $PostgresBin 'createdb.exe') -h 127.0.0.1 -p 55435 -U koraz_test koraz_guided_v2_control_test
if($LASTEXITCODE -ne 0){throw 'createdb failed'}
[ordered]@{data=$m01Data;port=55435;postgresBin=$PostgresBin;controlUrl='postgresql://koraz_test@127.0.0.1:55435/koraz_guided_v2_control_test';disposable=$true} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'cluster.json') -Encoding utf8
