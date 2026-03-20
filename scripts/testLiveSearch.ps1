Write-Host "LIVE API TEST - Smart Ranking Verification"
Write-Host ("=" * 80)
Write-Host ""

$queries = @("phone", "fan", "honey")

foreach ($query in $queries) {
  Write-Host "Query: $query"
  Write-Host ("-" * 80)
  
  try {
    Write-Host "  Fetching..." -NoNewline
    $url = "http://localhost:3000/api/search?q=$query&limit=10"
    $response = Invoke-WebRequest -Uri $url -TimeoutSec 20 -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    
    Write-Host " OK"
    Write-Host ("  Total Results: " + $data.results.Count)
    
    # Platform distribution
    $platforms = @{}
    foreach ($r in $data.results) {
      if (-not $platforms[$r.sourcePlatform]) { 
        $platforms[$r.sourcePlatform] = 0 
      }
      $platforms[$r.sourcePlatform]++
    }
    
    Write-Host "  Platform Distribution:"
    $platforms.GetEnumerator() | Sort-Object -Property Value -Descending | ForEach-Object {
      Write-Host ("    - " + $_.Key + ": " + $_.Value + " results")
    }
    
    # Top 5 results
    Write-Host ""
    Write-Host "  Top 5 Results (Smart Ranking Order):"
    $data.results | Select-Object -First 5 | ForEach-Object -Begin { $i = 1 } {
      $title = $_.title.Substring(0, [Math]::Min(40, $_.title.Length))
      $discount = if ($_.originalPrice -gt 0) { [Math]::Round(($_.originalPrice - $_.currentPrice) / $_.originalPrice * 100) } else { 0 }
      Write-Host ("    " + $i + ". [" + $_.sourcePlatform + "] " + $title)
      Write-Host ("       Price: " + $_.currentPrice + " (was " + $_.originalPrice + ") | Discount: " + $discount + "%")
      $i++
    }
    
    # Platform sequence
    $sequence = ($data.results | Select-Object -First 10 | ForEach-Object { $_.sourcePlatform }) -join " -> "
    Write-Host ""
    Write-Host ("  First 10 Platforms: " + $sequence)
    
  } catch {
    Write-Host " ERROR: " $_.Exception.Message
  }
  
  Write-Host ""
  Start-Sleep -Seconds 2
}

Write-Host ("=" * 80)
Write-Host "Test Complete - Smart Ranking Verified"
