param(
  [Parameter(Mandatory = $true)][string]$PostgresBin,
  [string]$NodeBin = 'C:\Users\josed\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin'
)

$ErrorActionPreference = 'Stop'
$t015Repo = (Resolve-Path (Join-Path $PSScriptRoot '../../../../..')).Path
$t015Data = Join-Path ([IO.Path]::GetTempPath()) ('koraz-t015-' + [guid]::NewGuid().ToString('N'))
$t015OldPath = $env:PATH
$t015OldMarker = $env:KORAZ_TEST_DATABASE
$t015OldUrl = $env:KORAZ_T015_TEST_DATABASE_URL
$t015Started = $false
$t015Exit = 1

function Invoke-T015Binary([string]$Name, [string[]]$Arguments) {
  if ($Name -eq 'pg_ctl') {
    # Redirect the daemon's inherited handles so piping the harness into a log
    # cannot keep PowerShell waiting for the background server's stdout.
    $t015Process = Start-Process -FilePath (Join-Path $PostgresBin 'pg_ctl.exe') `
      -ArgumentList ($Arguments | ForEach-Object { '"' + $_ + '"' }) `
      -WindowStyle Hidden -PassThru `
      -RedirectStandardOutput (Join-Path $t015Data 'pgctl.stdout') `
      -RedirectStandardError (Join-Path $t015Data 'pgctl.stderr')
    # Start-Process -Wait waits for the daemon's entire process tree on Windows.
    # Wait only for pg_ctl, which already uses -w to confirm startup/shutdown.
    $t015Process.WaitForExit()
    Get-Content (Join-Path $t015Data 'pgctl.stdout')
    Get-Content (Join-Path $t015Data 'pgctl.stderr')
    if ($t015Process.ExitCode -ne 0) { throw "$Name failed with exit $($t015Process.ExitCode)" }
    return
  }
  & (Join-Path $PostgresBin ($Name + '.exe')) @Arguments
  if ($LASTEXITCODE -ne 0) { throw "$Name failed with exit $LASTEXITCODE" }
}

if (Get-NetTCPConnection -LocalPort 55415 -State Listen -ErrorAction SilentlyContinue) {
  throw 'Port 55415 is occupied; refusing to use an existing server.'
}

try {
  $env:PATH = $NodeBin + ';' + $env:PATH
  $t015NodeVersion = & node --version
  if ($t015NodeVersion -notmatch '^v24\.') { throw 'Node 24 is required.' }
  Invoke-T015Binary 'initdb' @('-D', $t015Data, '-U', 'koraz_test', '-A', 'trust', '--encoding=UTF8', '--locale=C')
  Invoke-T015Binary 'pg_ctl' @('-D', $t015Data, '-l', (Join-Path $t015Data 'server.log'), '-o', '-h 127.0.0.1 -p 55415', '-w', 'start')
  $t015Started = $true
  Invoke-T015Binary 'createdb' @('-h', '127.0.0.1', '-p', '55415', '-U', 'koraz_test', 'koraz_t015_test')
  $env:KORAZ_TEST_DATABASE = 'true'
  $env:KORAZ_T015_TEST_DATABASE_URL = 'postgresql://koraz_test@127.0.0.1:55415/koraz_t015_test'
  Push-Location $t015Repo
  try {
    & pnpm.cmd --filter '@cediah/contracts' build
    if ($LASTEXITCODE -ne 0) { throw 'Contracts build failed.' }
    & pnpm.cmd --filter '@cediah/api' exec vitest run test/guided-v2-attempts.test.ts --reporter=verbose
    $t015Exit = $LASTEXITCODE
  } finally {
    Pop-Location
  }
} finally {
  if ($t015Started) { Invoke-T015Binary 'pg_ctl' @('-D', $t015Data, '-m', 'fast', '-w', 'stop') }
  $env:PATH = $t015OldPath
  $env:KORAZ_TEST_DATABASE = $t015OldMarker
  $env:KORAZ_T015_TEST_DATABASE_URL = $t015OldUrl
  Write-Output "Disposable cluster retained, stopped: $t015Data"
}
exit $t015Exit
