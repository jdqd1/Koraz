$ErrorActionPreference = 'Stop'
$psqlT037 = 'C:/Users/josed/.codex/tmp/koraz-t015-postgres/pgsql/bin/psql.exe'
$knownT037 = @(Get-ChildItem -LiteralPath $PSScriptRoot -File | Where-Object { $_.Name -match '(ready|cleanup)\.json$' } | ForEach-Object {
  $recordT037 = Get-Content -LiteralPath $_.FullName -Raw | ConvertFrom-Json
  if ($recordT037.database -match '^koraz_guided_v2_test_[0-9a-f]{32}$') { $recordT037.database }
} | Sort-Object -Unique)
if ($knownT037.Count -eq 0) { throw 'No T037 test database provenance' }
$listT037 = ($knownT037 | ForEach-Object { "'$_'" }) -join ','
$presentT037 = @(& $psqlT037 -h 127.0.0.1 -p 55435 -U koraz_test -d koraz_guided_v2_control_test -At -c "select datname from pg_database where datname in ($listT037) order by datname;" | Where-Object { $_ })
if ($LASTEXITCODE) { throw 'Database verification failed' }
$connectionsT037 = @(& $psqlT037 -h 127.0.0.1 -p 55435 -U koraz_test -d koraz_guided_v2_control_test -At -c "select datname || ':' || usename || ':' || state from pg_stat_activity where pid <> pg_backend_pid() and backend_type='client backend';" | Where-Object { $_ })
if ($LASTEXITCODE) { throw 'Connection verification failed' }
[pscustomobject]@{
  checkedAt = (Get-Date).ToString('o')
  knownT037Databases = $knownT037
  knownDatabasesRemaining = $presentT037
  otherClientConnections = $connectionsT037
  status = $(if ($presentT037.Count -eq 0 -and $connectionsT037.Count -eq 0) { 'PASS' } else { 'FAIL' })
  unrelatedDatabasesDeleted = $false
} | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'database-cleanup-verification.json')
if ($presentT037.Count -or $connectionsT037.Count) { throw 'Database or connections still present; inspect before stopping the cluster' }
