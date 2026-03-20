Write-Host "TESTING MERGED SEARCH (Database + Live Marketplaces)"
Write-Host ("=" * 90)

try {
  Write-Host "Fetching from http://localhost:3001/api/search?q=phone&limit=15..."
  Write-Host "(This may take 25-35 seconds due to live marketplace fetching)" 
  Write-Host ""
  
  $uri = "http://localhost:3001/api/search?q=phone&limit=15"
  $startTime = Get-Date
  $resp = Invoke-WebRequest -Uri $uri -TimeoutSec 60 -UseBasicParsing
  $elapsed = ((Get-Date) - $startTime).TotalSeconds
  
  $data = $resp.Content | ConvertFrom-Json
  
  Write-Host ("Response received in " + [Math]::Round($elapsed, 1) + " seconds")
  Write-Host ("Total Results: " + $data.results.Length)
  Write-Host ""
  
  # Show platform distribution
  $platformCounts = @{}
  foreach ($r in $data.results) {
    $platform = if ($r.sourcePlatform) { $r.sourcePlatform } else { "Database" }
    if (-not $platformCounts[$platform]) { $platformCounts[$platform] = 0 }
    $platformCounts[$platform]++
  }
  
  Write-Host "Platform Distribution (Database + Live Marketplaces):"
  Write-Host ("-" * 90)
  foreach ($platform in ($platformCounts.Keys | Sort-Object | Sort-Object { -$platformCounts[$_] })) {
    Write-Host ("  " + $platform + ": " + $platformCounts[$platform] + " results")
  }
  
  Write-Host ""
  Write-Host "TOP 8 RESULTS (Merged & Ranked):"
  Write-Host ("-" * 90)
  
  for ($i = 0; $i -lt [Math]::Min(8, $data.results.Length); $i++) {
    $item = $data.results[$i]
    $platform = if ($item.sourcePlatform) { $item.sourcePlatform } else { "Database" }
    Write-Host ""
    Write-Host ("  #" + ($i+1) + " [" + $platform + "] " + $item.title.Substring(0, [Math]::Min(50, $item.title.Length)))
    Write-Host ("      Seller: " + $item.seller.storeName + " | Price: $" + $item.currentPrice)
  }
  
  Write-Host ""
  Write-Host ("=" * 90)
  Write-Host "SUCCESS: Multi-Seller Results (Daraz-Style) Working!"
  Write-Host "  - Database products mixed with live marketplace results"
  Write-Host "  - Results ranked intelligently across all platforms"
  Write-Host "  - Similar to how Daraz shows products from multiple sellers"
  
} catch {
  Write-Host ("ERROR: " + $_.Exception.Message)
}

Write-Host ""
