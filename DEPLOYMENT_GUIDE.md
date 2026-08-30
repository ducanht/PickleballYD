# 🚀 HƯỚNG DẪN THIẾT LẬP BIẾN MÔI TRƯỜNG & DEPLOY DỰ ÁN
## Pickleball Yến Đình Hub (Firebase & Vercel)

Tài liệu này cung cấp hướng dẫn chi tiết từng bước để thiết lập biến môi trường (Environment Variables) và triển khai (deploy) hệ thống lên **Vercel** hoặc **Firebase Hosting**.

---

## 🔑 1. Danh Sách Biến Môi Trường Cần Thiết

Dự án sử dụng các biến môi trường sau để kết nối với Firebase Project `yendinhk9801`:

| Tên Biến Môi Trường (Key) | Giá Trị (Value) | Mô Tả |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | `AIzaSyDWH7P6YUUz1d63Kmf5rUsIOkFrXhlzmlo` | API Key của Firebase Web App |
| `VITE_FIREBASE_AUTH_DOMAIN` | `yendinhk9801.firebaseapp.com` | Tên miền xác thực người dùng |
| `VITE_FIREBASE_PROJECT_ID` | `yendinhk9801` | ID dự án Firebase |
| `VITE_FIREBASE_STORAGE_BUCKET` | `yendinhk9801.firebasestorage.app` | Bucket lưu trữ ảnh đại diện / chứng từ |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `104861414799` | ID gửi thông báo Cloud Messaging |
| `VITE_FIREBASE_APP_ID` | `1:104861414799:web:633d01a637cff7c71b47fa` | ID định danh Web App |
| `VITE_FIREBASE_MEASUREMENT_ID` | `G-FJVTQNRFTT` | Google Analytics Measurement ID |
| `VITE_USE_EMULATOR` | `false` | Đặt `false` khi chạy môi trường Live |

> ⚠️ **Lưu ý quan trọng**: File `.env` cục bộ đã được thêm vào `.gitignore` để không bị lộ API key lên GitHub. Khi deploy lên Vercel hoặc Firebase, bạn cần khai báo các biến này trực tiếp trên Dashboard của nền tảng tương ứng.

---

## 🌐 2. Hướng Dẫn Deploy Lên VERCEL (Khuyến Nghị)

Vercel là lựa chọn tối ưu cho frontend Single Page App nhờ CDN toàn cầu, tốc độ tải trang nhanh và khả năng tự động deploy mỗi khi bạn push code lên GitHub.

### Cách 1: Deploy qua Giao Diện Web Vercel Dashboard (Dễ nhất)

1. Truy cập [https://vercel.com](https://vercel.com) và đăng nhập bằng tài khoản GitHub `ducanht`.
2. Bấm **"Add New..."** $\rightarrow$ Chọn **"Project"**.
3. Tìm và chọn repository **`PickleballYD`** $\rightarrow$ Bấm **"Import"**.
4. Tại mục **"Environment Variables"**, mở rộng và thêm lần lượt 8 biến môi trường ở Bảng trên:
   - Thêm `VITE_FIREBASE_API_KEY` = `AIzaSyDWH7P6YUUz1d63Kmf5rUsIOkFrXhlzmlo`
   - Thêm `VITE_FIREBASE_AUTH_DOMAIN` = `yendinhk9801.firebaseapp.com`
   - Thêm `VITE_FIREBASE_PROJECT_ID` = `yendinhk9801`
   - Thêm `VITE_FIREBASE_STORAGE_BUCKET` = `yendinhk9801.firebasestorage.app`
   - Thêm `VITE_FIREBASE_MESSAGING_SENDER_ID` = `104861414799`
   - Thêm `VITE_FIREBASE_APP_ID` = `1:104861414799:web:633d01a637cff7c71b47fa`
   - Thêm `VITE_FIREBASE_MEASUREMENT_ID` = `G-FJVTQNRFTT`
   - Thêm `VITE_USE_EMULATOR` = `false`
5. Nhấn **"Deploy"**. Vercel sẽ tự động chạy `npm run build` và cấp phát tên miền miễn phí dạng `pickleball-yd.vercel.app`.

### Cách 2: Deploy qua Vercel CLI (Dòng lệnh)

```bash
# 1. Đăng nhập Vercel (nếu chưa)
npx vercel login

# 2. Liên kết project và deploy
npx vercel --prod
```

> File `vercel.json` đã được tạo sẵn trong dự án để cấu hình rewrite toàn bộ route về `index.html`, tránh lỗi 404 khi tải lại trang con.

---

## 🔥 3. Hướng Dẫn Deploy Lên FIREBASE HOSTING & FIRESTORE RULES

Nếu muốn toàn bộ hệ thống nằm trọn trong hệ sinh thái Firebase (Hosting + Database + Rules + Auth):

### Bước 1: Deploy Firestore Security Rules
Quy tắc bảo mật [`firestore.rules`](firestore.rules) phân quyền RBAC và bảo vệ sổ quỹ bất biến cần được đẩy lên Firebase Console:

```bash
# Sử dụng Firebase CLI
npx -y firebase-tools@latest deploy --only firestore:rules --project yendinhk9801
```

### Bước 2: Build & Deploy Frontend Lên Firebase Hosting

```bash
# 1. Biên dịch ứng dụng sang thư mục dist/
npm run build

# 2. Deploy lên Firebase Hosting
npx -y firebase-tools@latest deploy --only hosting --project yendinhk9801
```

Sau khi deploy thành công, trang web sẽ hoạt động trực tiếp tại:
- `https://yendinhk9801.web.app`
- `https://yendinhk9801.firebaseapp.com`

---

## 👥 4. Khởi Tạo Tài Khoản Quản Trị Viên (Admin User) Đầu Tiên

1. Truy cập vào trang web sau khi deploy $\rightarrow$ Bấm nút **"Đăng nhập"** trên thanh menu.
2. Đăng ký/đăng nhập bằng Email của bạn qua Firebase Auth.
3. Mở [Firebase Console](https://console.firebase.google.com/project/yendinhk9801/firestore) $\rightarrow$ Vào collection `users` $\rightarrow$ Chọn document ứng với `UID` tài khoản của bạn:
   - Sửa trường `role` từ `VIEWER` thành `ADMIN`.
4. Tải lại trang web $\rightarrow$ Bạn sẽ có toàn quyền Quản trị tối cao (Phân quyền người dùng khác, sửa điểm trận, VOID tài chính, Rebuild CSDL).
