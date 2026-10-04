param(
  [Parameter(Mandatory = $true)][string]$PostgresBin,
  [string]$NodeBin = 'C:\Users\josed\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin'
)

$ErrorActionPreference = 'Stop'
$t022Repo = (Resolve-Path (Join-Path $PSScriptRoot '../../../../..')).Path
$t022Data = Join-Path ([IO.Path]::GetTempPath()) ('koraz-t022-' + [guid]::NewGuid().ToString('N'))
$t022OldPath = $env:PATH
$t022OldMarker = $env:KORAZ_TEST_DATABASE
$t022OldUrl = $env:KORAZ_T022_TEST_DATABASE_URL
$t022Started = $false
$t022Exit = 1

function Invoke-T022Binary([string]$Name, [string[]]$Arguments) {
  if ($Name -eq 'pg_ctl') {
    # Redirect the daemon's inherited handles so piping the harness into a log
    # cannot keep PowerShell waiting for the background server's stdout.
    $t022Process = Start-Process -FilePath (Join-Path $PostgresBin 'pg_ctl.exe') `
      -ArgumentList ($Arguments | ForEach-Object { '"' + $_ + '"' }) `
      -WindowStyle Hidden -PassThru `
      -RedirectStandardOutput (Join-Path $t022Data 'pgctl.stdout') `
      -RedirectStandardError (Join-Path $t022Data 'pgctl.stderr')
    # Start-Process -Wait waits for the daemon's entire process tree on Windows.
    # Wait only for pg_ctl, which already uses -w to confirm startup/shutdown.
    $t022Process.WaitForExit()
    Get-Content (Join-Path $t022Data 'pgctl.stdout')
    Get-Content (Join-Path $t022Data 'pgctl.stderr')
    if ($t022Process.ExitCode -ne 0) { throw "$Name failed with exit $($t022Process.ExitCode)" }
    return
  }
  & (Join-Path $PostgresBin ($Name + '.exe')) @Arguments
  if ($LASTEXITCODE -ne 0) { throw "$Name failed with exit $LASTEXITCODE" }
}

if (Get-NetTCPConnection -LocalPort 55422 -State Listen -ErrorAction SilentlyContinue) {
  throw 'Port 55422 is occupied; refusing to use an existing server.'
}

try {
  $env:PATH = $NodeBin + ';' + $env:PATH
  $t022NodeVersion = & node --version
  if ($t022NodeVersion -notmatch '^v24\.') { throw 'Node 24 is required.' }
  Invoke-T022Binary 'initdb' @('-D', $t022Data, '-U', 'koraz_test', '-A', 'trust', '--encoding=UTF8', '--locale=C')
  Invoke-T022Binary 'pg_ctl' @('-D', $t022Data, '-l', (Join-Path $t022Data 'server.log'), '-o', '-h 127.0.0.1 -p 55422', '-w', 'start')
  $t022Started = $true
  Invoke-T022Binary 'createdb' @('-h', '127.0.0.1', '-p', '55422', '-U', 'koraz_test', 'koraz_t022_test')
  $env:KORAZ_TEST_DATABASE = 'true'
  $env:KORAZ_T022_TEST_DATABASE_URL = 'postgresql://koraz_test@127.0.0.1:55422/koraz_t022_test'
  Push-Location $t022Repo
  try {
    & pnpm.cmd --filter '@cediah/contracts' build
    if ($LASTEXITCODE -ne 0) { throw 'Contracts build failed.' }
    & pnpm.cmd --filter '@cediah/api' exec vitest run test/guided-v2-security.test.ts --reporter=verbose
    $t022Exit = $LASTEXITCODE
  } finally {
    Pop-Location
  }
} finally {
  if ($t022Started) { Invoke-T022Binary 'pg_ctl' @('-D', $t022Data, '-m', 'fast', '-w', 'stop') }
  $env:PATH = $t022OldPath
  $env:KORAZ_TEST_DATABASE = $t022OldMarker
  $env:KORAZ_T022_TEST_DATABASE_URL = $t022OldUrl
  Write-Output "Disposable cluster retained, stopped: $t022Data"
}
exit $t022Exit

