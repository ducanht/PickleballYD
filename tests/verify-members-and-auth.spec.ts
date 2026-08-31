import { test, expect } from '@playwright/test';

test.describe('Xác Thực 23 VĐV Thật và Quản Trị Cấp Tài Khoản', () => {
  test('Hiển thị đầy đủ 23 thành viên thật trên trang /members', async ({ page }) => {
    await page.goto('http://localhost:4173/members');
    
    // Đợi tiêu đề hoặc bảng thành viên tải xong
    await expect(page.locator('h1')).toContainText('Danh Sách Vận Động Viên');
    
    // Đợi loading spinner biến mất
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    // Đếm số dòng thành viên trong bảng
    const rowCount = await page.locator('table tbody tr').count();
    console.log(`[Playwright Test] Số lượng thành viên hiển thị trên WebApp: ${rowCount}`);
    expect(rowCount).toBe(23);

    // Chụp ảnh bằng chứng
    await page.screenshot({ path: 'test-results/members-list-23-athletes.png', fullPage: true });
  });

  test('Trang /login chỉ có Đăng Nhập, đã loại bỏ Đăng Ký Admin công khai', async ({ page }) => {
    await page.goto('http://localhost:4173/login');
    
    await expect(page.locator('h2')).toContainText('Đăng Nhập Quản Trị Viên');
    
    // Đảm bảo không còn nút hay tab Đăng Ký Admin
    const registerTab = page.locator('button:has-text("Đăng Ký Admin")');
    await expect(registerTab).toHaveCount(0);
    
    // Chụp ảnh trang login
    await page.screenshot({ path: 'test-results/login-admin-only.png' });
  });

  test('Trang /admin có nút Cấp Tài Khoản Mới và Modal hoạt động', async ({ page }) => {
    // Đăng nhập Admin qua nút Truy cập nhanh
    await page.goto('http://localhost:4173/login');
    await page.click('button:has-text("Vào Quyền Admin")');
    await page.waitForURL('**/tournaments');
    
    // Điều hướng tới /admin
    await page.goto('http://localhost:4173/admin');
    await expect(page.locator('h1')).toContainText('Quản Trị Hệ Thống');
    
    // Kiểm tra nút Cấp Tài Khoản Mới
    const createBtn = page.locator('button:has-text("Cấp Tài Khoản Mới")');
    await expect(createBtn).toBeVisible();
    
    // Mở modal
    await createBtn.click();
    await expect(page.locator('h3:has-text("Cấp Tài Khoản Mới")')).toBeVisible();
    
    // Chụp ảnh modal cấp tài khoản
    await page.screenshot({ path: 'test-results/admin-provision-user-modal.png' });
  });
});
