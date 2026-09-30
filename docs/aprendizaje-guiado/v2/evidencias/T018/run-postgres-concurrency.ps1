param(
  [Parameter(Mandatory = $true)][string]$PostgresBin,
  [string]$NodeBin = 'C:\Users\josed\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin'
)

$ErrorActionPreference = 'Stop'
$t018Repo = (Resolve-Path (Join-Path $PSScriptRoot '../../../../..')).Path
$t018Data = Join-Path ([IO.Path]::GetTempPath()) ('koraz-t018-' + [guid]::NewGuid().ToString('N'))
$t018OldPath = $env:PATH
$t018OldMarker = $env:KORAZ_TEST_DATABASE
$t018OldUrl = $env:KORAZ_T018_TEST_DATABASE_URL
$t018Started = $false
$t018Exit = 1

function Invoke-T018Binary([string]$Name, [string[]]$Arguments) {
  if ($Name -eq 'pg_ctl') {
    # Redirect the daemon's inherited handles so piping the harness into a log
    # cannot keep PowerShell waiting for the background server's stdout.
    $t018Process = Start-Process -FilePath (Join-Path $PostgresBin 'pg_ctl.exe') `
      -ArgumentList ($Arguments | ForEach-Object { '"' + $_ + '"' }) `
      -WindowStyle Hidden -PassThru `
      -RedirectStandardOutput (Join-Path $t018Data 'pgctl.stdout') `
      -RedirectStandardError (Join-Path $t018Data 'pgctl.stderr')
    # Start-Process -Wait waits for the daemon's entire process tree on Windows.
    # Wait only for pg_ctl, which already uses -w to confirm startup/shutdown.
    $t018Process.WaitForExit()
    Get-Content (Join-Path $t018Data 'pgctl.stdout')
    Get-Content (Join-Path $t018Data 'pgctl.stderr')
    if ($t018Process.ExitCode -ne 0) { throw "$Name failed with exit $($t018Process.ExitCode)" }
    return
  }
  & (Join-Path $PostgresBin ($Name + '.exe')) @Arguments
  if ($LASTEXITCODE -ne 0) { throw "$Name failed with exit $LASTEXITCODE" }
}

if (Get-NetTCPConnection -LocalPort 55418 -State Listen -ErrorAction SilentlyContinue) {
  throw 'Port 55418 is occupied; refusing to use an existing server.'
}

try {
  $env:PATH = $NodeBin + ';' + $env:PATH
  $t018NodeVersion = & node --version
  if ($t018NodeVersion -notmatch '^v24\.') { throw 'Node 24 is required.' }
  Invoke-T018Binary 'initdb' @('-D', $t018Data, '-U', 'koraz_test', '-A', 'trust', '--encoding=UTF8', '--locale=C')
  Invoke-T018Binary 'pg_ctl' @('-D', $t018Data, '-l', (Join-Path $t018Data 'server.log'), '-o', '-h 127.0.0.1 -p 55418', '-w', 'start')
  $t018Started = $true
  Invoke-T018Binary 'createdb' @('-h', '127.0.0.1', '-p', '55418', '-U', 'koraz_test', 'koraz_t018_test')
  $env:KORAZ_TEST_DATABASE = 'true'
  $env:KORAZ_T018_TEST_DATABASE_URL = 'postgresql://koraz_test@127.0.0.1:55418/koraz_t018_test'
  Push-Location $t018Repo
  try {
    & pnpm.cmd --filter '@cediah/contracts' build
    if ($LASTEXITCODE -ne 0) { throw 'Contracts build failed.' }
    & pnpm.cmd --filter '@cediah/api' exec vitest run test/guided-v2-scheduler.test.ts --reporter=verbose
    $t018Exit = $LASTEXITCODE
  } finally {
    Pop-Location
  }
} finally {
  if ($t018Started) { Invoke-T018Binary 'pg_ctl' @('-D', $t018Data, '-m', 'fast', '-w', 'stop') }
  $env:PATH = $t018OldPath
  $env:KORAZ_TEST_DATABASE = $t018OldMarker
  $env:KORAZ_T018_TEST_DATABASE_URL = $t018OldUrl
  Write-Output "Disposable cluster retained, stopped: $t018Data"
}
exit $t018Exit

