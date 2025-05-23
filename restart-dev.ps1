# PowerShell script to restart Next.js development server
Write-Host "Stopping any existing servers on port 9004..." -ForegroundColor Yellow

# Kill any Node.js processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Kill process using port 9004 specifically
$port = Get-NetTCPConnection -LocalPort 9004 -ErrorAction SilentlyContinue
if ($port) { 
    Write-Host "Killing process using port 9004..." -ForegroundColor Yellow
    Stop-Process -Id $port.OwningProcess -Force 
}

Write-Host "Clearing Next.js cache..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

Write-Host "Starting development server..." -ForegroundColor Green
npm run dev