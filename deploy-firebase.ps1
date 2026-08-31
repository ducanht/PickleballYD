# Script tự động triển khai lên Firebase Hosting & Firestore Rules
Set-Location -Path $PSScriptRoot

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "🚀 TRIỂN KHAI PICKLEBALL YÊN ĐỊNH HUB LÊN FIREBASE" -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Cyan

# 1. Build app
Write-Host "`n[1/3] Đang biên dịch mã nguồn (npm run build)..." -ForegroundColor Green
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Lỗi biên dịch. Vui lòng kiểm tra lại mã nguồn!" -ForegroundColor Red
    exit 1
}

# 2. Check login
Write-Host "`n[2/3] Kiểm tra đăng nhập Firebase..." -ForegroundColor Green
npx -y firebase-tools@latest login

# 3. Deploy
Write-Host "`n[3/3] Đang tải lên Firebase Hosting & Firestore Rules..." -ForegroundColor Green
npx -y firebase-tools@latest deploy --only hosting,firestore:rules --project yendinhk9801

Write-Host "`n🎉 HOÀN TẤT TRIỂN KHAI THÀNH CÔNG!" -ForegroundColor Cyan
Write-Host "🌐 Địa chỉ web: https://yendinhk9801.web.app" -ForegroundColor Yellow
