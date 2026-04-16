$batchRoot = "C:\Users\rohan\Downloads\resume10000\batches"
$bucketPrefix = "gs://bnc-resume-pipeline-100/raw/pdf"
$startBatch = 3
$useParallel = $true

$batchDirs = Get-ChildItem -Path $batchRoot -Directory |
  Where-Object { $_.Name -match '^batch-(\d+)$' -and [int]$Matches[1] -ge $startBatch } |
  Sort-Object Name

if (-not $batchDirs) {
  Write-Host "No batch folders found from batch-$('{0:D3}' -f $startBatch) onward."
  exit 1
}

foreach ($batch in $batchDirs) {
  $destination = "$bucketPrefix/$($batch.Name)/"
  $sourcePattern = Join-Path $batch.FullName '*'

  Write-Host ""
  Write-Host "Uploading $($batch.Name) -> $destination"

  if ($useParallel) {
    gsutil -m cp -r $sourcePattern $destination
  } else {
    gsutil cp -r $sourcePattern $destination
  }

  if ($LASTEXITCODE -ne 0) {
    Write-Host "Upload failed for $($batch.Name). Stopping."
    exit $LASTEXITCODE
  }

  Write-Host "Verifying $($batch.Name)..."
  $sample = @(gsutil ls "$destination**" | Select-Object -First 3)
  if (-not $sample -or $sample.Count -eq 0) {
    Write-Host "Verification failed for $($batch.Name). No files found in destination. Stopping."
    exit 1
  }

  $sample | ForEach-Object { Write-Host $_ }

  Write-Host "$($batch.Name) completed."
}

Write-Host ""
Write-Host "All batches from batch-$('{0:D3}' -f $startBatch) onward uploaded successfully."
