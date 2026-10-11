$ErrorActionPreference='Stop'
Set-Location -LiteralPath 'D:\Jose (Datos)\Medicina\CEDIAH\Web'
$env:PATH='C:/Users/josed/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin;'+$env:PATH
$env:KORAZ_TEST_DATABASE='true'
$env:KORAZ_GUIDED_V2_TEST_DATABASE_URL='postgresql://koraz_test@127.0.0.1:55435/koraz_guided_v2_control_test'
$rcCluster=Get-Content 'docs/aprendizaje-guiado/v2/evidencias/RC01/cluster.json' -Raw | ConvertFrom-Json
& (Join-Path $rcCluster.postgresBin 'pg_ctl.exe') -D $rcCluster.data status *> $null
if ($LASTEXITCODE -eq 3) {
 & (Join-Path $rcCluster.postgresBin 'pg_ctl.exe') -D $rcCluster.data -l 'docs/aprendizaje-guiado/v2/evidencias/RC01/cluster-server.txt' -o '-p 55435 -h 127.0.0.1' -w start
 if ($LASTEXITCODE -ne 0) {throw 'Could not start the marked disposable PostgreSQL cluster'}
}
node work/test/rc01/cleanup-interrupted.mjs
if ($LASTEXITCODE -ne 0) {throw 'Owned interrupted cleanup failed'}
node work/test/rc01/prepare.mjs
$ErrorActionPreference='Continue'
& 'C:/Users/josed/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe' apps/web/node_modules/@playwright/test/cli.js test --config work/test/rc01/playwright.config.mts *> docs/aprendizaje-guiado/v2/evidencias/RC01/browser-run.txt
$rcExit=$LASTEXITCODE
Set-Content 'docs/aprendizaje-guiado/v2/evidencias/RC01/browser-exit.json' ('{"exitCode":'+$rcExit+'}')
exit $rcExit
