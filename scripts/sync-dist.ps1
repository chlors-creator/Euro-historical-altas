$root=Split-Path -Parent $PSScriptRoot
$files=@(
  'app.js','formal-names.js','euro-meta-zh.js','index.html','styles.css','euro-cshapes-europe-1816-1885.js','euro-cshapes-official.js','euro-cshapes-modern-2020-2026.js','euro-cshapes.js',
  'euro-historical-1816-1885.js','euro-historical-1886-1999.js','euro-2026.js',
  'PROJECT_CONTEXT.md','README.md',
  'modules/boundary-debug.js','modules/core.js','modules/events.js',
  'modules/flags.js','modules/lazy-loader.js','modules/map.js'
)
foreach($file in $files){
  $source=Join-Path $root $file
  $target=Join-Path $root ('dist/'+$file)
  $targetDir=Split-Path -Parent $target
  if(!(Test-Path -LiteralPath $targetDir)){New-Item -ItemType Directory -Path $targetDir -Force | Out-Null}
  Copy-Item -LiteralPath $source -Destination $target -Force
}
$dataSource=Join-Path $root 'data/euro-modern-2020-2026.geojson'
$dataTarget=Join-Path $root 'dist/data/euro-modern-2020-2026.geojson'
if(Test-Path -LiteralPath $dataSource){
  $dataDir=Split-Path -Parent $dataTarget
  if(!(Test-Path -LiteralPath $dataDir)){New-Item -ItemType Directory -Path $dataDir -Force | Out-Null}
  Copy-Item -LiteralPath $dataSource -Destination $dataTarget -Force
}
$assetSource=Join-Path $root 'assets'
if(Test-Path -LiteralPath $assetSource){
  $assetTarget=Join-Path $root 'dist/assets'
  if(!(Test-Path -LiteralPath $assetTarget)){New-Item -ItemType Directory -Path $assetTarget -Force | Out-Null}
  Get-ChildItem -LiteralPath $assetSource -File -Recurse | ForEach-Object {
    $relative=$_.FullName.Substring($assetSource.Length).TrimStart('\','/')
    $target=Join-Path $assetTarget $relative
    $targetDir=Split-Path -Parent $target
    if(!(Test-Path -LiteralPath $targetDir)){New-Item -ItemType Directory -Path $targetDir -Force | Out-Null}
    Copy-Item -LiteralPath $_.FullName -Destination $target -Force
  }
}
Push-Location $root
try { Get-Content -LiteralPath .\scripts\verify.mjs -Raw | node --input-type=module - }
finally { Pop-Location }
