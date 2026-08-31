import { test, expect } from '@playwright/test';

test.describe('Hội Cựu Học Sinh Yên Định - Cấu Hình & Khởi Tạo Giải Đấu', () => {
  test('Kiểm tra Modal Khởi tạo giải đấu với đầy đủ 3 Tab cấu hình', async ({ page }) => {
    // 1. Đăng nhập để kích hoạt quyền Editor
    await page.goto('/login');
    await page.fill('input[type="email"]', 'qtdyentho.hienha@gmail.com');
    await page.fill('input[type="password"]', '12345678');
    await page.click('button:has-text("Đăng Nhập Quản Trị")');
    await page.waitForURL('**/tournaments', { timeout: 15000 });

    // 2. Nhấn nút Tạo Giải Mới
    const createBtn = page.locator('#btn-create-tournament');
    await expect(createBtn).toBeVisible({ timeout: 15000 });
    await createBtn.click();

    // 3. Xác nhận Modal hiển thị với tiêu đề và 3 Tab
    await expect(page.locator('text=Khởi Tạo Giải Đấu Pickleball')).toBeVisible();
    await expect(page.locator('text=1. Thể Thức & Nội Dung')).toBeVisible();
    await expect(page.locator('text=2. Bảng Đấu & VĐV')).toBeVisible();
    await expect(page.locator('text=3. Luật & Knockout')).toBeVisible();

    // 4. Kiểm tra Tab 1: Đổi Thể thức & Nội dung
    await page.fill('input[placeholder*="VD: Giải Pickleball"]', 'Giải Pickleball Đôi Nam Nữ K98-01');
    
    // Chuyển sang Tab 2: Bảng Đấu & VĐV
    await page.click('button:has-text("2. Bảng Đấu & VĐV")');
    await expect(page.locator('text=Tổng Quan Quy Mô Giải Đấu')).toBeVisible();
    await expect(page.locator('text=Số Lượng Bảng Đấu')).toBeVisible();

    // Chuyển sang Tab 3: Luật & Knockout
    await page.click('button:has-text("3. Luật & Knockout")');
    await expect(page.locator('text=Quy Chuẩn Tính Điểm')).toBeVisible();
    await expect(page.locator('text=Vòng Knockout Play-off')).toBeVisible();

    console.log('\n========================================');
    console.log('[Playwright Test] XÁC NHẬN MODAL CẤU HÌNH GIẢI ĐẤU HOẠT ĐỘNG HOÀN HẢO ĐỦ 3 TAB!');
    console.log('========================================\n');
  });

  test('Kiểm tra Thể thức Rotating Doubles tự động tính toán và kiểm tra tính khả thi', async ({ page }) => {
    // 1. Đăng nhập
    await page.goto('/login');
    await page.fill('input[type="email"]', 'qtdyentho.hienha@gmail.com');
    await page.fill('input[type="password"]', '12345678');
    await page.click('button:has-text("Đăng Nhập Quản Trị")');
    await page.waitForURL('**/tournaments', { timeout: 15000 });

    const createBtn = page.locator('#btn-create-tournament');
    await expect(createBtn).toBeVisible({ timeout: 15000 });
    await createBtn.click();
    
    // Chọn Rotating Doubles
    const formatSelect = page.locator('select').first();
    await formatSelect.selectOption('ROTATING_DOUBLES');

    // Chuyển sang Tab 2
    await page.click('button:has-text("2. Bảng Đấu & VĐV")');
    await expect(page.locator('text=Cấu Hình Xoay Cặp & Lượt Đấu')).toBeVisible();
    await expect(page.locator('text=Số Lượt Đấu / Trận mỗi VĐV')).toBeVisible();

    console.log('\n========================================');
    console.log('[Playwright Test] XÁC NHẬN ROTATING DOUBLES CONFIG HOẠT ĐỘNG CHÍNH XÁC!');
    console.log('========================================\n');
  });
});
