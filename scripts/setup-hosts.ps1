# Run this script as Administrator to set up local DNS entries
# Usage: .\setup-hosts.ps1

$hostsFile = "C:\Windows\System32\drivers\etc\hosts"
$entries = @(
    "127.0.0.1  keycloak.sso.local",
    "127.0.0.1  portal.sso.local",
    "127.0.0.1  app1.sso.local",
    "127.0.0.1  app2.sso.local",
    "127.0.0.1  app3.sso.local",
    "127.0.0.1  app4.sso.local",
    "127.0.0.1  app5.sso.local"
)

$currentContent = Get-Content $hostsFile -Raw

foreach ($entry in $entries) {
    $hostname = ($entry -split "\s+")[1]
    if ($currentContent -notmatch [regex]::Escape($hostname)) {
        Add-Content -Path $hostsFile -Value $entry
        Write-Host "Added: $entry"
    } else {
        Write-Host "Already exists: $hostname"
    }
}

Write-Host ""
Write-Host "Hosts file updated. Verifying..."
Get-Content $hostsFile | Select-String "sso.local"
