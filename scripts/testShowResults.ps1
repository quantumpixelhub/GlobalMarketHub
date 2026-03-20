Write-Host "LIVE SEARCH API TEST - Fetching Results"
Write-Host ("=" * 80)

Write-Host ""
Write-Host "Query: phone"
Write-Host ("-" * 80)

try {
  $response = Invoke-WebRequest -Uri "http://localhost:3000/api/search?q=phone&limit=10" -TimeoutSec 20 -UseBasicParsing
  $data = $response.Content | ConvertFrom-Json
  
  Write-Host ("Total Results: " + $data.results.Length)
  Write-Host ""
  
  if ($data.results.Length -gt 0) {
    Write-Host "Top 5 Results (Ranking Order):"
    
    for ($i = 0; $i -lt [Math]::Min(5, $data.results.Length); $i++) {
      $item = $data.results[$i]
      Write-Host ""
      Write-Host ("  " + ($i+1) + ". [" + $item.sourcePlatform + "] " + $item.title)
      Write-Host ("     Price: " + $item.currentPrice)
      Write-Host ("     Original: " + $item.originalPrice)
      Write-Host ("     Seller: " + $item.seller.storeName)
    }
    
    Write-Host ""
    Write-Host "Platform Sequence (First 10):"
    $seq = ""
    for ($i = 0; $i -lt [Math]::Min(10, $data.results.Length); $i++) {
      if ($seq) { $seq += " -> " }
      $seq += $data.results[$i].sourcePlatform
    }
    Write-Host ("  " + $seq)
  }
  
} catch {
  Write-Host ("ERROR: " + $_.Exception.Message)
}

Write-Host ""
Write-Host ("=" * 80)
