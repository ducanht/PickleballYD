# 🚀 ĐỊNH HƯỚNG PHÁT TRIỂN & KHUYẾN NGHỊ KỸ THUẬT (NEXT STEPS & RECOMMENDATIONS)
## Pickleball Yến Đình Hub

---

## 🎯 1. Các Nội Dung Tiếp Tục Phát Triển (Future Roadmap)

1. **Giao diện Trọng tài Cầm tay (Mobile Referee Scoring Mode)**:
   - Tối ưu hóa UI nhập điểm riêng biệt trên màn hình điện thoại cho trọng tài bàn (nút bấm điểm lớn +1/-1, nút đổi lượt giao bóng, đổi sân).
   - Tích hợp hiệu ứng âm thanh thông báo khi trận đấu kết thúc hoặc chạm điểm set point.

2. **Tự Động Đẩy Đội Thắng Từ Vòng Bảng Vào Vòng Knockout**:
   - Khi tất cả các trận vòng bảng kết thúc (`COMPLETED`), hệ thống kích hoạt trigger gợi ý tự động lấy Đội Nhất Bảng A vs Đội Nhì Bảng B vào nhánh Bán kết / Chung kết mà không cần thao tác thủ công.

3. **Thông Báo Đẩy Thời Gian Thực (FCM Web Push Notifications)**:
   - Thông báo cho VĐV khi trận đấu sắp diễn ra: *"Trận đấu #5 của bạn tại Sân 1 sắp bắt đầu sau 5 phút"*.
   - Thông báo cho toàn hội viên khi giải đấu có nhà vô địch mới.

4. **Trộn & In Bằng Khen / Giấy Chứng Nhận Tự Động (Certificate PDF Generator)**:
   - Tích hợp thư viện `@react-pdf/renderer` để tự động tạo file PDF Giấy chứng nhận / Kỷ niệm chương có ảnh đại diện và thành tích của VĐV để in ấn trao giải.

---

## 💡 2. Các Cải Tiến Đã Thực Hiện Trong Quá Trình Làm Việc

1. **Tách Biệt Nghiệp Vụ Toán Học Thuần Túy (Pure TS Engine Decoupling)**:
   - Toàn bộ thuật toán bốc thăm (`teamDrawEngine`, `groupDrawEngine`, `fixtureGenerator`, `rotatingDoublesEngine`, `standingsCalculator`, `knockoutEngine`) được thiết kế hoàn toàn bằng Pure TypeScript không phụ thuộc vào React Component hay Firebase SDK.
   - *Lợi ích*: Cực kỳ dễ kiểm thử Unit Test, chạy nhanh, độc lập với nền tảng và dễ tái sử dụng.

2. **Kỷ Luật Bất Biến & Chống Gian Lận (Auditability & Immutability)**:
   - Triệt tiêu hoàn toàn thao tác xóa vật lý đối với dữ liệu tài chính và kết quả giải đấu.
   - Sửa điểm trận đã kết thúc bắt buộc kiểm tra vai trò `ADMIN` và bắt buộc nhập lý do bằng văn bản (Luật BR-006 & BR-007).

3. **Tương Thích Tiếng Việt Hoàn Hảo Khi Xuất Excel (UTF-8 BOM Injection)**:
   - Thêm tiền tố `\uFEFF` (Byte Order Mark) trước chuỗi CSV trước khi tạo Blob tải về, giúp Microsoft Excel trên Windows tự động nhận diện font Unicode tiếng Việt có dấu mà không bị lỗi font/ký tự lạ.

4. **Sẵn Sàng Cho Môi Trường Thi Đấu Thực Tế (PWA & Multi-tab Offline Persistence)**:
   - Sử dụng IndexedDB cục bộ giúp ứng dụng vẫn chạy mượt mà trên sân đấu ngoài trời khi mạng 4G/WiFi chập chờn và tự động đồng bộ lên cloud khi có mạng trở lại.

---

## 🛡️ 3. Các Khuyến Nghị Kỹ Thuật Quan Trọng

1. **Bảo Mật Firebase (Firebase Security Rules & Secrets)**:
   - Đảm bảo deploy file `firestore.rules` lên Firebase Console bằng lệnh `firebase deploy --only firestore:rules` trước khi đưa vào sử dụng thực tế.
   - Tuyệt đối không commit file `.env` chứa API Key lên GitHub công khai (đã được cấu hình trong `.gitignore`).

2. **Tối Ưu Hóa Chunking & Code-Splitting Khi Build**:
   - Hiện tại file bundle `index.js` có kích thước ~883 kB do tích hợp đầy đủ Firebase SDK và Lucide icons.
   - *Khuyến nghị*: Trong tương lai có thể tinh chỉnh `build.rolldownOptions.output.codeSplitting` trong `vite.config.ts` để tách nhỏ vendor bundle cho tốc độ tải trang ban đầu nhanh hơn nữa.

3. **Định Kỳ Kiểm Tra Toàn Vẹn CSDL**:
   - Quản trị viên nên chạy công cụ **"Kiểm Tra Toàn Vẹn Dữ Liệu"** trong trang Admin sau mỗi mùa giải để rà soát các liên kết VĐV mồ côi hoặc trận đấu lỗi.

---

## 📌 4. Quy Tắc Bắt Buộc Dành Cho Lập Trình Viên & AI Agent Sau Này

> **LUÔN ĐỌC CÁC TÀI LIỆU SAU ĐÂY TRƯỚC KHI CAN THIỆP CODE:**
> 1. Đọc [`README.md`](file:///d:/Antigravity%20Projects/PickleballYD/README.md) để nắm kiến trúc tổng quan.
> 2. Đọc [`PROJECT_PROGRESS.md`](file:///d:/Antigravity%20Projects/PickleballYD/PROJECT_PROGRESS.md) để hiểu những gì đã hoàn thành.
> 3. Đọc [`AGENTS.md`](file:///d:/Antigravity%20Projects/PickleballYD/AGENTS.md) để tuân thủ nghiêm ngặt các quy tắc lập trình, bảo mật và bảo toàn dữ liệu.
> 4. Chạy `npm run build` sau mỗi lần chỉnh sửa mã nguồn để đảm bảo 0 lỗi biên dịch.
