Set-Location -Path $PSScriptRoot

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "TRIEN KHAI PICKLEBALL YEN DINH HUB" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Build app
Write-Host "[1/3] Dang bien dich ma nguon..." -ForegroundColor Green
npm run build

# 2. Check login
Write-Host "[2/3] Kiem tra dang nhap Firebase..." -ForegroundColor Green
npx -y firebase-tools@latest login

# 3. Deploy
Write-Host "[3/3] Dang tai len Firebase Hosting..." -ForegroundColor Green
npx -y firebase-tools@latest deploy --only hosting,firestore:rules --project yendinhk9801

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "TRIEN KHAI HOAN TAT!" -ForegroundColor Green
Write-Host "Web URL: https://yendinhk9801.web.app" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
