Set-Location -Path $PSScriptRoot

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "TRIEN KHAI PICKLEBALL YEN DINH HUB" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Build app
Write-Host "[1/2] Dang bien dich ma nguon..." -ForegroundColor Green
npm run build
Copy-Item dist\index.html dist\404.html -Force

# 2. Deploy
Write-Host "[2/2] Dang tai len Firebase Hosting..." -ForegroundColor Green
npx -y firebase-tools@latest deploy --only hosting,firestore:rules --project yendinhk9801 --non-interactive

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "TRIEN KHAI HOAN TAT!" -ForegroundColor Green
Write-Host "Web URL: https://yendinhk9801.web.app" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan

