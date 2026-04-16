$jobName = "resume-bulk-worker"
$region = "us-central1"
$bucketPrefix = "gs://bnc-resume-pipeline-100/raw/pdf"
$artifactsPrefix = "gs://bnc-resume-pipeline-100/results/cloud-run"
$batchStart = 38
$batchEnd = 40
$limit = 0
$maxWorkers = 3
$gcloudCandidates = @(
  "gcloud.cmd",
  "C:\Users\rohan\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
)

$gcloudPath = $null
foreach ($candidate in $gcloudCandidates) {
  $resolved = Get-Command $candidate -ErrorAction SilentlyContinue
  if ($resolved) {
    $gcloudPath = $resolved.Source
    break
  }
}

if (-not $gcloudPath) {
  Write-Host "Could not find gcloud.cmd in PATH or the default Cloud SDK location."
  exit 1
}

for ($i = $batchStart; $i -le $batchEnd; $i++) {
  $batchName = "batch$($i)"
  $gcsPrefix = "$bucketPrefix/$batchName/"
  $resultsOut = "/tmp/$($batchName)_results.json"
  $summaryOut = "/tmp/$($batchName)_summary.json"
  $failuresOut = "/tmp/$($batchName)_failures.json"

  $argsList = @(
    "--gcs-prefix=$gcsPrefix",
    "--max-workers=$maxWorkers",
    "--max-retries=3",
    "--results-out=$resultsOut",
    "--summary-out=$summaryOut",
    "--failures-out=$failuresOut",
    "--artifacts-gcs-prefix=$artifactsPrefix/$batchName"
  )

  if ($limit -gt 0) {
    $argsList += "--limit=$limit"
  }

  Write-Host "Launching $batchName ..."
  $argFlags = $argsList | ForEach-Object { "--args=$_" }
  $command = @(
    $gcloudPath, "run", "jobs", "execute", $jobName,
    "--region", $region
  ) + $argFlags

  Start-Process -FilePath $command[0] -ArgumentList $command[1..($command.Length - 1)] -NoNewWindow
  Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "All batch executions launched. Check status with:"
Write-Host "gcloud run jobs executions list --job $jobName --region $region"
