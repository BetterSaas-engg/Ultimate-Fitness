# Generates the PWA icon set from the gym's badge logo.
#
# The source logo is 291x100 - that is the highest resolution the brand has
# (checked against ultimatefitnessclub.ca), so the 512px icons upscale ~1.3x.
# Drop a larger assets/uf-logo-dark.png in and re-run to sharpen them.
#
#   powershell -ExecutionPolicy Bypass -File scripts/make-pwa-icons.ps1

Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$src = Join-Path $root 'assets\uf-logo-dark.png'
$out = Join-Path $root 'public\icons'
New-Item -ItemType Directory -Force -Path $out | Out-Null

$logo = [System.Drawing.Image]::FromFile($src)

function New-Icon {
    param(
        [string]$Path,
        [int]$Size,
        [double]$Fraction,   # logo width as a fraction of the canvas
        [string]$Background  # 'white' or 'gradient'
    )

    $bmp = New-Object System.Drawing.Bitmap($Size, $Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    if ($Background -eq 'gradient') {
        # --theme-gradient from their stylesheet
        $rect = New-Object System.Drawing.Rectangle(0, 0, $Size, $Size)
        $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
            $rect,
            [System.Drawing.ColorTranslator]::FromHtml('#07A4E7'),
            [System.Drawing.ColorTranslator]::FromHtml('#1C72B3'),
            [System.Drawing.Drawing2D.LinearGradientMode]::ForwardDiagonal)
    } else {
        $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    }
    $g.FillRectangle($brush, 0, 0, $Size, $Size)
    $brush.Dispose()

    $w = [int]($Size * $Fraction)
    $h = [int]($w * $logo.Height / $logo.Width)
    $g.DrawImage($logo, [int](($Size - $w) / 2), [int](($Size - $h) / 2), $w, $h)

    $g.Dispose()
    $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    "  {0,-28} {1}x{1}" -f (Split-Path -Leaf $Path), $Size
}

# purpose: any - the logo reads as the logo, on the brand's own white
New-Icon -Path (Join-Path $out 'icon-192.png') -Size 192 -Fraction 0.80 -Background white
New-Icon -Path (Join-Path $out 'icon-512.png') -Size 512 -Fraction 0.80 -Background white

# purpose: maskable - Android crops to a circle, so everything sits inside the
# safe zone (a circle 80% of the icon's width) and the bleed is brand blue.
New-Icon -Path (Join-Path $out 'icon-maskable-512.png') -Size 512 -Fraction 0.60 -Background gradient

# iOS home screen. No masking beyond rounded corners, so it can match 'any'.
New-Icon -Path (Join-Path $out 'apple-touch-icon.png') -Size 180 -Fraction 0.80 -Background white

# Browser tab
New-Icon -Path (Join-Path $root 'assets\favicon.png') -Size 48 -Fraction 0.92 -Background white

$logo.Dispose()
Write-Host 'Done.'
