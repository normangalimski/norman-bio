param(
  [string]$Root = "C:\Users\galim\Desktop\Ai Site",
  [string]$AssetsDir = "assets",
  [string]$GalleryFile = "gallery.html",
  [string]$FeatureName = "photo-1.jpg",
  [int]$Seed = 0
)

$assetsPath = Join-Path $Root $AssetsDir
$galleryPath = Join-Path $Root $GalleryFile

if (-not (Test-Path $assetsPath)) {
  Write-Error "Assets folder not found: $assetsPath"
  exit 1
}
if (-not (Test-Path $galleryPath)) {
  Write-Error "Gallery file not found: $galleryPath"
  exit 1
}

$files = Get-ChildItem -Path $assetsPath -File | Where-Object { $_.Extension -match "\.jpg|\.jpeg|\.png|\.webp" }
if (-not $files) {
  Write-Error "No image files found in $assetsPath"
  exit 1
}

$featureFile = $files | Where-Object { $_.Name -ieq $FeatureName } | Select-Object -First 1
if (-not $featureFile) {
  $featureFile = $files | Sort-Object Name | Select-Object -First 1
}

$galleryFiles = $files | Where-Object { $_.FullName -ne $featureFile.FullName }
if ($Seed -ne 0) {
  $galleryFiles = $galleryFiles | Sort-Object { Get-Random -SetSeed $Seed }
} else {
  $galleryFiles = $galleryFiles | Sort-Object { Get-Random }
}

$featureHtml = @"
        <div class=\"gallery-feature\" data-reveal>
          <img src=\"$AssetsDir/$($featureFile.Name)\" alt=\"Featured gallery image\" loading=\"lazy\" />
        </div>
"@

$itemsHtml = foreach ($file in $galleryFiles) {
  $name = $file.Name
  $label = $name -replace "\.\w+$", ""
@"
          <figure class=\"gallery-card\" data-reveal>
            <button class=\"lightbox-trigger\" data-src=\"$AssetsDir/$name\" aria-label=\"Open image $label\">
              <img src=\"$AssetsDir/$name\" alt=\"Gallery image $label\" loading=\"lazy\" />
            </button>
          </figure>
"@
}

$gridHtml = '        <div class="gallery-grid">' + "`n" + ($itemsHtml -join "`n") + "`n" + '        </div>'

$autoHtml = "        <!-- AUTO-GALLERY-START -->\n" + $featureHtml + $gridHtml + "\n        <!-- AUTO-GALLERY-END -->"

$content = Get-Content -Path $galleryPath -Raw
$pattern = "<!-- AUTO-GALLERY-START -->[\s\S]*?<!-- AUTO-GALLERY-END -->"
if ($content -notmatch $pattern) {
  Write-Error "Auto-gallery markers not found in $galleryPath"
  exit 1
}

$content = [regex]::Replace($content, $pattern, [System.Text.RegularExpressions.MatchEvaluator]{ param($m) $autoHtml })
Set-Content -Path $galleryPath -Value $content -Encoding UTF8

Write-Host "Gallery updated in $galleryPath"
Write-Host "Feature: $($featureFile.Name)"
Write-Host "Images: $($galleryFiles.Count)"
