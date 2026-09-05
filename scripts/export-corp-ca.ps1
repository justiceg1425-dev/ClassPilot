# Exports the Windows trust store to .certs/corp-ca.pem so Node-based tooling
# (Supabase CLI, @supabase/supabase-js) can validate TLS through a corporate
# inspection proxy. Node ignores the Windows store; curl (schannel) does not,
# which is why browsers/curl work but `node fetch` fails with
# SELF_SIGNED_CERT_IN_CHAIN. `scripts/db.mjs` picks up the bundle automatically
# when it exists. `.certs/` is git-ignored — run this once per machine.
#
#   pwsh -File scripts/export-corp-ca.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$out = Join-Path $root '.certs\corp-ca.pem'
New-Item -ItemType Directory -Force -Path (Split-Path $out) | Out-Null

$stores = @(
  'Cert:\LocalMachine\Root', 'Cert:\CurrentUser\Root',
  'Cert:\LocalMachine\CA', 'Cert:\CurrentUser\CA'
)
$seen = @{}
$lines = New-Object System.Collections.Generic.List[string]
$now = Get-Date
$kept = 0; $expired = 0

foreach ($store in $stores) {
  try { $certs = Get-ChildItem $store -ErrorAction Stop } catch { continue }
  foreach ($c in $certs) {
    if ($seen.ContainsKey($c.Thumbprint)) { continue }
    $seen[$c.Thumbprint] = $true
    if ($c.NotAfter -lt $now) { $expired++; continue }
    $b64 = [System.Convert]::ToBase64String($c.RawData, 'InsertLineBreaks')
    $lines.Add('-----BEGIN CERTIFICATE-----')
    foreach ($l in ($b64 -split "`r`n")) { if ($l) { $lines.Add($l) } }
    $lines.Add('-----END CERTIFICATE-----')
    $kept++
  }
}

Set-Content -Path $out -Value $lines -Encoding ascii
Write-Output "wrote $kept certificates ($expired expired skipped) to $out"
