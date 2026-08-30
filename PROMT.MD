MỤC TIÊU TỔNG QUÁT
Xây dựng một ứng dụng web (WebApp) phục vụ công tác tổ chức giải đấu Pickleball dành cho 21 vận động viên (14 nam, 7 nữ). Ứng dụng hỗ trợ:

Quản lý danh sách VĐV (CRUD) với thông tin chi tiết.

Bốc thăm chia bảng và ghép cặp thi đấu với hiệu ứng trực quan, hồi hộp.

Lưu trữ kết quả và lịch sử bốc thăm trên đám mây.

Giao diện thân thiện, responsive, dùng ngay trên điện thoại tại sân đấu.

🧱 CÔNG NGHỆ SỬ DỤNG
Thành phần	Công nghệ
Frontend	React (hooks, context) + Vite (build tool)
UI Library	Tailwind CSS (hoặc CSS thuần để linh hoạt)
Backend & Database	Firebase Firestore (lưu dữ liệu realtime)
Authentication	Firebase Auth (tuỳ chọn, để quản trị viên)
Storage	Firebase Storage (lưu ảnh đại diện VĐV)
Deploy	Vercel (hosting frontend) + Firebase (Backend)
📋 DANH SÁCH TÍNH NĂNG CHI TIẾT
1. QUẢN LÝ VĐV (Members)
Các trường thông tin:

id: tự động sinh

fullName: Họ và tên (bắt buộc)

gender: Nam / Nữ

phone: Số điện thoại (không bắt buộc)

club: Trường / Câu lạc bộ

finance: Tài chính đã đóng (số tiền)

sponsor: Tài trợ (tên nhà tài trợ, nếu có)

elo: Điểm ELO (số nguyên, mặc định 0)

avatar: URL ảnh đại diện (có thể upload lên Firebase Storage)

Chức năng:

Hiển thị danh sách dạng Card Grid (mỗi card hiển thị tên, giới tính, trường, ELO).

Thêm mới VĐV (form popup/ modal).

Sửa thông tin VĐV.

Xóa VĐV (có xác nhận).

Tìm kiếm / lọc theo tên, giới tính, trường.

Import danh sách VĐV từ file Excel (hoặc CSV) – để nhập nhanh 21 VĐV mẫu.

2. BỐC THĂM CHIA BẢNG (Nam)
Mô tả: 14 nam được bốc thăm ngẫu nhiên chia thành 2 bảng (mỗi bảng 7 người).

Quy trình:

Nhấn nút "1️⃣ Chia bảng Nam".

Hệ thống quay vòng hồi hộp trên danh sách nam chưa phân bảng.

Mỗi lần bốc (thời gian 3-4 giây) chọn ra 1 người và gán ngẫu nhiên vào bảng 1 hoặc bảng 2 (đảm bảo cân bằng 7-7).

Cập nhật Card của người đó: hiển thị badge "Bảng 1" hoặc "Bảng 2", chuyển sang nhóm tương ứng.

Quá trình tiếp tục cho đến khi hết 14 người.

Hiệu ứng: Quay vòng trên các Card chưa được chọn, mỗi Card khi được quay đến sẽ nổi bật (phóng to, viền sáng). Tốc độ chậm dần ở cuối để tăng kịch tính.

3. BỐC THĂM GHÉP CẶP
Có 3 bảng/ nhóm cần ghép cặp:

Nhóm Nữ (7 người)

Nhóm Nam Bảng 1 (7 người)

Nhóm Nam Bảng 2 (7 người)

Quy trình chung:

Mỗi lần bấm nút tương ứng (ví dụ: "2️⃣ Ghép cặp Nữ").

Hệ thống quay vòng trên danh sách VĐV chưa ghép cặp trong nhóm đó.

Sau 3-4 giây, chọn ngẫu nhiên 2 người và ghép thành một cặp.

Đánh dấu cả 2 người đã ghép, cập nhật trạng thái trên Card (hiển thị "Ghép với [tên]").

Thêm cặp vào danh sách cặp đấu của nhóm.

Lặp lại cho đến khi chỉ còn 0 hoặc 1 người (nếu còn 1 người thì họ nghỉ).

Hiệu ứng: Giống như bước chia bảng, nhưng chọn 2 người thay vì 1.

Lưu ý: Các nút ghép cặp chỉ khả dụng sau khi đã chia bảng Nam xong.

4. HIỂN THỊ DANH SÁCH CẶP GHÉP
Sau mỗi lần bốc cặp, danh sách cặp đấu của nhóm đó được cập nhật và hiển thị ở phần dưới trang.

Danh sách hiển thị dạng các tag cặp, kèm số thứ tự và tên 2 VĐV.

Có thể xem lịch sử các cặp đã ghép qua các lần bốc khác nhau (nếu có nhiều vòng).

5. LƯU TRỮ VÀ ĐỒNG BỘ DỮ LIỆU
Sử dụng Firebase Firestore để lưu:

Danh sách VĐV (collection members).

Trạng thái bốc thăm: bảng đã chia (maleGroups), các cặp đã ghép (femalePairs, male1Pairs, male2Pairs).

Lịch sử bốc thăm (có thể lưu theo thời gian).

Dữ liệu được đồng bộ realtime để nhiều người cùng theo dõi (nếu cần).

6. GIAO DIỆN & TRẢI NGHIỆM NGƯỜI DÙNG
Responsive: Tối ưu trên mọi kích thước màn hình (đặc biệt là điện thoại).

Card Grid: Hiển thị VĐV dạng lưới các thẻ, mỗi thẻ chứa tên, badge (bảng nếu có), trạng thái ghép cặp, ELO (nếu là nữ), và các thông tin phụ.

Hiệu ứng hồi hộp:

Quay vòng trên các Card với tốc độ thay đổi, cuối cùng chậm lại.

Card được quay đến sẽ nổi bật (phóng to, glow vàng).

Khi chọn xong, Card sẽ chuyển sang màu xanh (đã ghép) hoặc hiển thị badge tương ứng.

Pháo hoa (confetti) bắn lên khi hoàn thành một bước.

Trạng thái trực quan: Thanh trạng thái luôn cập nhật thông báo hành động đang diễn ra (ví dụ: "Đang bốc: Nguyễn Văn A → Bảng 1").

7. TÍNH NĂNG MỞ RỘNG (CÓ THỂ THÊM)
Quản lý tài chính: Thu lệ phí, chi phí giải thưởng, hiển thị báo cáo.

Live Score: Cập nhật tỷ số các trận đấu realtime.

Bảng xếp hạng ELO tự động cập nhật sau mỗi trận.

Xuất báo cáo PDF danh sách cặp đấu và kết quả.

🗂️ CẤU TRÚC DỰ ÁN (ĐỀ XUẤT)
text
pickleball-app/
├── public/
│   └── images/               # Ảnh mặc định
├── src/
│   ├── api/
│   │   └── firebase.js       # Cấu hình Firebase, exports db, storage
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── StatusBar.jsx
│   │   │   └── Confetti.jsx
│   │   ├── members/
│   │   │   ├── MemberList.jsx
│   │   │   ├── MemberForm.jsx
│   │   │   ├── MemberCard.jsx
│   │   │   └── MemberFilter.jsx
│   │   ├── draws/
│   │   │   ├── DrawStep1.jsx     # Chia bảng Nam
│   │   │   ├── DrawStep2.jsx     # Ghép cặp Nữ
│   │   │   ├── DrawStep3.jsx     # Ghép cặp Nam B1
│   │   │   ├── DrawStep4.jsx     # Ghép cặp Nam B2
│   │   │   ├── PairList.jsx      # Hiển thị các cặp
│   │   │   └── SpinEffect.jsx    # Hiệu ứng quay vòng (dùng chung)
│   │   └── pairs/
│   │       └── PairTag.jsx
│   ├── contexts/
│   │   ├── AuthContext.jsx
│   │   └── DataContext.jsx     # Quản lý state toàn cục (members, draws)
│   ├── hooks/
│   │   ├── useFirestore.js     # Custom hook CRUD Firestore
│   │   ├── useDraw.js          # Logic bốc thăm
│   │   └── useSpin.js          # Logic hiệu ứng quay vòng
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── MembersPage.jsx
│   │   ├── DrawPage.jsx        # Trang chính bốc thăm
│   │   └── ResultsPage.jsx
│   ├── services/
│   │   ├── memberService.js
│   │   └── drawService.js
│   ├── utils/
│   │   ├── constants.js
│   │   ├── helpers.js
│   │   └── spinUtils.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env                        # Biến môi trường Firebase
├── .gitignore
├── package.json
├── vite.config.js
├── vercel.json                 # Cấu hình deploy Vercel
└── README.md
🔥 FIREBASE SCHEMA (ĐỀ XUẤT)
javascript
// Collection: members
{
  id: "string",
  fullName: "string",
  gender: "male" | "female",
  phone: "string",
  club: "string",
  finance: number,
  sponsor: "string",
  elo: number,
  avatar: "string (URL)",
  createdAt: timestamp
}

// Collection: drawState (chỉ lưu một document duy nhất)
{
  maleGroups: {
    "id1": 1,   // id VĐV -> bảng 1 hoặc 2
    "id2": 2,
    ...
  },
  femalePairs: [ [id1, id2], [id3, id4], ... ],
  male1Pairs: [ [id5, id6], ... ],
  male2Pairs: [ [id7, id8], ... ],
  femaleMatched: [id1, id2, ...],
  male1Matched: [...],
  male2Matched: [...],
  step1Done: boolean,
  step2Done: boolean,
  step3Done: boolean,
  step4Done: boolean,
  updatedAt: timestamp
}

// Collection: history (lưu lịch sử mỗi lần bốc thăm)
{
  step: "split_male" | "pair_female" | ...,
  timestamp: timestamp,
  details: { ... }  // lưu chi tiết các cặp đã bốc
}
🎮 LUỒNG CHÍNH CỦA WEBAPP
Trang chủ (Dashboard): Hiển thị tổng quan số VĐV, tiến độ bốc thăm, và nút điều hướng đến các chức năng.

Quản lý VĐV: Nhập/xuất danh sách, xem thông tin chi tiết.

Trang bốc thăm:

Bước 1: Chia bảng Nam (nút "1️⃣")

Bước 2: Ghép cặp Nữ (nút "2️⃣")

Bước 3: Ghép cặp Nam B1 (nút "3️⃣")

Bước 4: Ghép cặp Nam B2 (nút "4️⃣")

Mỗi bước đều có hiệu ứng quay vòng và cập nhật giao diện ngay lập tức.

Danh sách cặp đấu được hiển thị ở cuối trang.

Lưu trữ tự động: Mọi thay đổi được lưu vào Firestore, cho phép tải lại trang mà không mất dữ liệu.

Xuất kết quả: Cho phép in hoặc xuất danh sách cặp đấu ra PDF để thông báo cho VĐV.

🧪 YÊU CẦU KỸ THUẬT BỔ SUNG
Hiệu ứng quay vòng:

Chạy liên tục trên danh sách các Card chưa chọn, mỗi Card được làm nổi bật trong khoảng 150-200ms.

Tổng thời gian mỗi lần bốc khoảng 3.5 giây.

Tốc độ giảm dần ở 30% cuối cùng.

Chống bốc trùng: Mỗi VĐV chỉ xuất hiện một lần trong một vòng ghép cặp.

Xử lý số lẻ: Nếu nhóm có số lẻ (7 người), sau khi ghép cặp sẽ còn 1 người nghỉ trong vòng đó.

Giao diện đa ngôn ngữ: Tiếng Việt là chính, nhưng có thể dễ dàng mở rộng.

🚀 DEPLOY
Frontend: Deploy lên Vercel, sử dụng biến môi trường cho Firebase config.

Backend: Firebase hoàn toàn serverless, không cần quản lý máy chủ.

Domain: Có thể sử dụng tên miền tùy chỉnh (nếu có).

📝 VÍ DỤ DỮ LIỆU MẪU (7 NỮ)
javascript
const femaleSample = [
  { name: 'Lê Thị Nga', club: 'YĐ 1', elo: 4 },
  { name: 'Nguyễn Thị Hạnh', club: 'YĐ 1', elo: 5 },
  { name: 'Trịnh Thị Hiền', club: 'YĐ 2', elo: 6 },
  { name: 'Trịnh Thị Mạnh', club: 'YĐ 2', elo: 1 },
  { name: 'Trịnh Thị Ngân', club: 'YĐ 2', elo: 7 },
  { name: 'Lê Thị Thiện', club: 'YĐ 2', elo: 3 },
  { name: 'Phạm Thị Hoa', club: 'YĐ 2', elo: 2 }
];
(Tương tự cho 14 nam có thể dùng tên mẫu khác)