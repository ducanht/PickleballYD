# 🏸 Pickleball Yến Đình Hub (SRS V6)
> Hệ thống quản lý hội cựu học sinh & giải đấu thể thao Yên Định 1998–2001.

---

## 🌟 Tổng Quan Dự Án

**Pickleball Yến Đình Hub** là nền tảng web ứng dụng hiện đại phục vụ toàn diện công tác quản trị hội viên, quản lý sổ quỹ tài chính minh bạch và vận hành các giải đấu thể thao Pickleball chuyên nghiệp với 2 thể thức: **Cặp Cố Định (Fixed Doubles)** và **Cặp Xoay Vòng (Rotating Doubles)**.

Hệ thống được thiết kế theo tiêu chuẩn kiến trúc hiện đại, tách biệt hoàn toàn nghiệp vụ thuật toán giải đấu (Pure TypeScript Domain Engines) khỏi tầng giao diện (UI) và tầng dữ liệu (Firebase Firestore).

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend Core**: React 19, TypeScript 6.0, Vite 8.2.
- **Styling**: Tailwind CSS v4, Lucide React icons, Canvas Confetti.
- **Backend & Database**: Firebase Firestore (Offline Multi-tab IndexedDB Persistence), Firebase Authentication, Firebase Storage.
- **Bảo Mật**: Firestore Security Rules v2, Phân quyền RBAC (`VIEWER`, `EDITOR`, `ADMIN`), Sổ quỹ tài chính & lịch sử tỷ số bất biến (`VOID` / `scoreHistory`).
- **PWA**: Web App Manifest, Offline Banner, Kiosk/TV Live Board (Auto-refresh 5s).
- **Codebase Intelligence**: CBI-MCP (`code-review-graph` v2.3.8 AST Tree-sitter + SQLite FTS5).

---

## 🏛️ Kiến Trúc Hệ Thống (8 Phân Hệ Cốt Lõi)

```
src/
├── api/
│   └── firebase.ts               # Khởi tạo SDK + Offline Persistence
├── components/
│   └── common/
│       ├── Header.tsx            # Menu điều hướng theo vai trò (RBAC)
│       ├── RoleGuard.tsx         # Bảo vệ route theo UserRole
│       ├── OfflineBanner.tsx     # Cảnh báo trạng thái mạng & đồng bộ cục bộ
│       └── QRCodeDisplay.tsx     # Modal chia sẻ mã QR Live Board & BXH
├── features/
│   ├── auth/                     # Phân quyền, đăng nhập/đăng xuất, Claims
│   ├── members/                  # Quản lý VĐV, Avatar, Snapshot, All-time Stats
│   ├── finance/                  # Sổ quỹ tài chính, Bút toán VOID bất biến
│   ├── tournaments/              # Quản lý giải đấu, Sự kiện & Audit Service
│   ├── fixedDoubles/             # Bốc thăm cặp (LCG Seeded), chia bảng, lịch vòng tròn
│   ├── rotatingDoubles/          # Xoay vòng cặp đấu, Feasibility Check, Validator
│   ├── export/                   # Xuất CSV/Excel hỗ trợ UTF-8 BOM tiếng Việt
│   └── admin/                    # Tính lại chỉ số VĐV & Kiểm tra toàn vẹn CSDL
└── pages/
    ├── Public/                   # Dashboard công khai, Live Board TV, BXH, Lịch đấu
    ├── Members/                  # Danh sách hội viên, Chi tiết & Thống kê 4 Card
    ├── Finance/                  # Dashboard tài chính, Cơ cấu chi, Sổ quỹ
    ├── Tournaments/              # Danh sách giải, Chi tiết, Wizard bốc thăm, Nhánh Knockout
    └── Admin/                    # Phân quyền tài khoản & Kiểm tra hệ thống
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Dự Án

### 1. Yêu Cầu Môi Trường
- Node.js >= 18.0.0
- npm >= 9.0.0 hoặc pnpm >= 8.0.0

### 2. Cài Đặt Dependencies
```bash
npm install
```

### 3. Cấu Hình Biến Môi Trường (.env)
Tạo file `.env` từ `.env.example` và điền thông tin Firebase Web App của bạn:
```bash
cp .env.example .env
```

Nội dung mẫu trong `.env`:
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=104861414799
VITE_FIREBASE_APP_ID=1:104861414799:web:633d01a6...
VITE_FIREBASE_MEASUREMENT_ID=G-FJVTQNRFTT
VITE_USE_EMULATOR=false
```

### 4. Khởi Chạy Server Phát Triển
```bash
npm run dev
```

### 5. Kiểm Thử Biên Dịch Production
```bash
npm run build
```

---

## 🔒 Quy Tắc Bảo Mật & Kỷ Luật Dữ Liệu

1. **Bất biến tài chính (Immutable Ledger)**: Mọi giao dịch thu/chi khi hủy phải ghi nhận trạng thái `VOID` kèm lý do và ghi vào Audit Log; không xóa vật lý bản ghi.
2. **Kỷ luật lịch sử tỷ số**: Trọng tài nhập điểm có lịch sử `scoreHistory` bất biến. Khi trận đã kết thúc (`COMPLETED`), chỉ `ADMIN` mới có quyền sửa điểm và bắt buộc phải điền lý do sửa điểm (Luật BR-006 & BR-007).
3. **Phân quyền 3 cấp độ (RBAC)**:
   - `VIEWER`: Tra cứu thông tin hội viên, xem giải đấu và tỷ số.
   - `EDITOR`: Thêm/sửa hội viên, ghi nhận thu/chi, bốc thăm giải đấu, nhập điểm trận.
   - `ADMIN`: VOID tài chính, sửa điểm trận đã kết thúc, phân quyền tài khoản, chạy công cụ Rebuild dữ liệu.

---

## 📄 Bản Quyền
© 2026 Hội Cựu Học Sinh Yên Định 1998–2001. All rights reserved.
