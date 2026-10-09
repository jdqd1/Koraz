$ErrorActionPreference = 'Stop'
$t040Ports = @(3000, 4100, 31035, 41035, 41036, 55415, 55418, 55422, 55435)
$t040Listeners = @(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -in $t040Ports } | Select-Object LocalAddress, LocalPort, OwningProcess)
$t040ServiceStatus = if ($t040Listeners.Count -eq 0) { 'PASS' } else { 'FAIL' }
$t040ServiceReceipt = [ordered]@{ status = $t040ServiceStatus; recordedUtc = [DateTime]::UtcNow.ToString('o'); checkedPorts = $t040Ports; listeners = $t040Listeners; unrelatedProcessesTerminated = $false }
$t040ServiceReceipt | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'services-final.json') -Encoding utf8NoBOM
Write-Output "Owned service cleanup $t040ServiceStatus; listeners=$($t040Listeners.Count)"
if ($t040Listeners.Count -gt 0) { exit 1 }
