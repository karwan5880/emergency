# Script to clear VS Code and Cursor cache folders
# Make sure both applications are closed before running this script

Write-Host "Clearing VS Code and Cursor cache..." -ForegroundColor Cyan
Write-Host ""

# VS Code cache paths
$vscodePaths = @(
    "$env:APPDATA\Code\CachedData",
    "$env:APPDATA\Code\CachedExtensions",
    "$env:APPDATA\Code\logs",
    "$env:APPDATA\Code\User\workspaceStorage"
)

# Cursor cache paths
$cursorPaths = @(
    "$env:APPDATA\Cursor\CachedData",
    "$env:APPDATA\Cursor\CachedExtensions",
    "$env:APPDATA\Cursor\logs",
    "$env:APPDATA\Cursor\User\workspaceStorage"
)

# Function to safely delete cache folder
function Clear-CacheFolder {
    param([string]$Path, [string]$AppName)
    
    if (Test-Path $Path) {
        try {
            $size = (Get-ChildItem -Path $Path -Recurse -ErrorAction SilentlyContinue | 
                    Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
            $sizeMB = [math]::Round($size / 1MB, 2)
            
            Remove-Item -Path $Path -Recurse -Force -ErrorAction Stop
            Write-Host "[OK] Cleared: $AppName - $(Split-Path $Path -Leaf) ($sizeMB MB)" -ForegroundColor Green
            return $sizeMB
        }
        catch {
            Write-Host "[ERROR] Failed to clear: $Path - $($_.Exception.Message)" -ForegroundColor Red
            return 0
        }
    }
    else {
        Write-Host "[SKIP] Not found: $AppName - $(Split-Path $Path -Leaf)" -ForegroundColor Yellow
        return 0
    }
}

# Clear VS Code cache
Write-Host "=== VS Code Cache ===" -ForegroundColor Cyan
$vscodeTotal = 0
foreach ($path in $vscodePaths) {
    $size = Clear-CacheFolder -Path $path -AppName "VS Code"
    $vscodeTotal += $size
}

Write-Host ""

# Clear Cursor cache
Write-Host "=== Cursor Cache ===" -ForegroundColor Cyan
$cursorTotal = 0
foreach ($path in $cursorPaths) {
    $size = Clear-CacheFolder -Path $path -AppName "Cursor"
    $cursorTotal += $size
}

Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host "VS Code cache cleared: $vscodeTotal MB" -ForegroundColor Green
Write-Host "Cursor cache cleared: $cursorTotal MB" -ForegroundColor Green
Write-Host "Total cache cleared: $($vscodeTotal + $cursorTotal) MB" -ForegroundColor Green
Write-Host ""
Write-Host "Cache clearing complete! You can now restart VS Code and Cursor." -ForegroundColor Cyan

