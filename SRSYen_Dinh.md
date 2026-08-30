**ĐẶC TẢ YÊU CẦU HỆ THỐNG (SRS)**

**NỀN TẢNG QUẢN LÝ HỘI CỰU HỌC SINH & GIẢI ĐẤU THỂ THAO YÊN ĐỊNH (1998–2001)**

*Phiên bản V6 – Technical & Business Specification*

Mục tiêu: xây dựng hệ sinh thái WebApp lưu trữ dài hạn, minh bạch tài chính, quản lý thành viên và tổ chức giải thể thao đa thể thức, với Tournament Engine có thể kiểm chứng và tái sử dụng qua nhiều năm.

# 0. Thông tin kiểm soát tài liệu

| **Thuộc tính** | **Giá trị** |
| --- | --- |
| Tên tài liệu | SRS – Nền tảng Quản lý Hội Cựu Học Sinh & Giải Đấu Thể Thao Yên Định 1998–2001 |
| Phiên bản | V6 |
| Trạng thái | Baseline triển khai / dùng làm nguồn yêu cầu cho AI Coder |
| Phạm vi | Member Directory, Finance, Tournament Engine, Public Live View, Admin, Audit, Export, Offline/PWA |
| Nền tảng mục tiêu | React + Vite + TypeScript, Tailwind CSS, Firebase |
| CSDL | Cloud Firestore |
| Lưu trữ tệp | Firebase Storage |
| Hosting ưu tiên | Firebase Hosting |
| Đối tượng sử dụng | Khán giả, Viewer, Editor, Admin |
| Nguyên tắc dữ liệu | Reference + Snapshot + Audit; không mất lịch sử |

# 1. Tầm nhìn và mục tiêu dự án

Dự án xây dựng một nền tảng số dùng lâu dài cho cộng đồng cựu học sinh Yên Định niên khóa 1998–2001. Hệ thống không chỉ phục vụ một giải đấu đơn lẻ mà phải có khả năng lưu trữ liên tục nhiều năm, tái sử dụng dữ liệu thành viên, tổng hợp thành tích cá nhân, minh bạch thu–chi và tổ chức nhiều giải với luật chơi có thể cấu hình.

Điểm khác biệt cốt lõi của phiên bản V6 là Tournament Engine được tách thành một lớp nghiệp vụ độc lập. Hệ thống phải có khả năng kiểm tra tính khả thi, sinh lịch đấu, xác nhận các ràng buộc và chỉ ghi nhận lịch sau khi validation đạt. Animation bốc thăm chỉ trình diễn kết quả đã được tính toán, không phải nguồn sinh kết quả.

## 1.1. Mục tiêu chính

- Lưu trữ danh bạ thành viên theo thời gian và giữ snapshot lịch sử trong từng giải.
- Minh bạch hóa các khoản thu, chi, số dư và chứng từ; cho phép phân tích theo năm và theo giải.
- Hỗ trợ ít nhất hai thể thức: Fixed Doubles và Rotating Doubles.
- Cho phép cấu hình số lượng bảng, số VĐV/cặp, cách xếp bảng, cách tính điểm, knockout và tiêu chí xếp hạng theo từng giải.
- Cung cấp Public Live Board theo thời gian thực cho người xem.
- Hỗ trợ điện thoại, máy tính bảng, desktop; có PWA và khả năng tiếp tục thao tác khi mất mạng.
- Có audit trail, soft delete/archive và khả năng rebuild các thống kê tổng hợp.

## 1.2. Nguyên tắc thiết kế

- Lịch sử là bất biến: dữ liệu quá khứ không bị thay đổi do hồ sơ hiện tại thay đổi.
- Bảo mật ở backend: PIN chỉ là tiện ích giao diện; quyền thật nằm ở Firebase Authentication và Security Rules.
- Nghiệp vụ độc lập giao diện: Tournament Engine không phụ thuộc React hoặc Firestore.
- Không random mù: mọi lịch đấu phải qua Feasibility Check và Validation.
- Không xóa vật lý dữ liệu lịch sử quan trọng. Dùng soft delete, VOID hoặc ARCHIVED.
- Tối ưu đọc bằng snapshot và denormalization có chủ đích; vẫn duy trì nguồn dữ liệu chuẩn để có thể tính lại.

# 2. Kiến trúc tổng thể

Browser / PWA\
└── React SPA\
├── Public Dashboard / Live Board\
├── Member Directory\
├── Finance Dashboard\
├── Tournament UI\
└── Admin UI\
│\
├── Domain / Tournament Engine (pure TS)\
└── Firebase Services\
├── Firebase Auth\
├── Cloud Firestore\
├── Firebase Storage\
└── App Check\

Hosting: Firebase Hosting

## 2.1. Technology Stack

| **Thành phần** | **Công nghệ** | **Yêu cầu** |
| --- | --- | --- |
| Frontend | React + Vite + TypeScript | SPA, mobile-first, code splitting khi cần |
| UI | Tailwind CSS | Responsive, touch-friendly |
| Animation | Framer Motion | Draw animation, easing, transitions |
| Charts | Recharts hoặc Chart.js | Finance dashboard |
| Effects | Canvas-confetti | Confetti sau kết quả hợp lệ |
| Backend/Data | Firebase / Cloud Firestore | Realtime, offline, query |
| Auth | Firebase Authentication | Identity + session |
| File Storage | Firebase Storage | Avatar, biên lai/chứng từ |
| Hosting | Firebase Hosting | Ưu tiên triển khai đồng bộ hệ Firebase |
| PWA | Service Worker + manifest | Cài đặt trên mobile, cache asset |
| Testing | Vitest + React Testing Library | Unit/integration frontend |
| E2E | Playwright | Luồng chính và mobile/desktop |

## 2.2. Luồng dữ liệu

UI → Application Service → Domain Engine → Validation → Repository → Firestore\
↘ Audit Service\
↘ Event/Timeline\

Firestore → listener → state store → UI realtime

# 3. Phân quyền và bảo mật

V6 bỏ mô hình “PIN là bảo mật”. Firebase Authentication là lớp xác thực; Firestore Security Rules là lớp phân quyền và kiểm tra dữ liệu; Firebase App Check là lớp bổ sung để giúp chỉ ứng dụng hợp lệ truy cập backend. Đây là mô hình phù hợp với hướng dẫn bảo mật hiện hành của Firebase cho client web/mobile. \[1]\[2]

## 3.1. Vai trò

| **Vai trò** | **Public read** | **Đăng nhập** | **Nhập tỷ số** | **Tài chính** | **Khởi tạo/cấu hình giải** | **Xóa/Archive** |
| --- | --- | --- | --- | --- | --- | --- |
| PUBLIC | Có | Không | Không | Dashboard công khai (nếu bật) | Không | Không |
| VIEWER | Có | Có | Không | Có | Không | Không |
| EDITOR | Có | Có | Có | Có | Có | Không |
| ADMIN | Có | Có | Có | Có | Có | Có |

## 3.2. User schema

users/{uid}\
{\
displayName: string,\
role: "VIEWER" | "EDITOR" | "ADMIN",\
active: boolean,\
createdAt: Timestamp,\
lastLoginAt: Timestamp | null\
}

Role có thể được biểu diễn bằng custom claims để Security Rules kiểm tra trực tiếp. Firebase có hướng dẫn chính thức về role-based access bằng custom claims. \[3]

## 3.3. Nguyên tắc PIN

UI có thể có nút 🔒 “Chế độ quản trị” và một mã PIN ngắn để giảm thao tác trên thiết bị tại sân; tuy nhiên PIN không được dùng để cấp quyền Firestore. Không lưu PIN bí mật trong client bundle và không coi PIN là security boundary.

# 4. Module 1 – Quản lý danh bạ thành viên

## 4.1. Chức năng

- Danh sách dạng table/grid card, tìm kiếm theo tên/số điện thoại và lọc theo trường, giới tính, trạng thái.
- Avatar tròn; upload Firebase Storage hoặc URL ngoài có kiểm soát.
- Thêm, sửa, archive; không xóa vật lý nếu thành viên đã có lịch sử giải hoặc giao dịch.
- Xem thành tích all-time và lịch sử các giải đã tham gia.
- Xuất CSV/XLSX.

## 4.2. Schema members

members/{memberId}\
{\
fullName: string,\
gender: "MALE" | "FEMALE",\
phone: string | null,\
school: "YD1" | "YD2" | "YD3" | "OTHER",\
avatarUrl: string | null,\
status: "ACTIVE" | "INACTIVE" | "ARCHIVED",\
note: string | null,\
allTimeStats: {\
tournamentsPlayed: number,\
matchesPlayed: number,\
matchesWon: number,\
pointsWon: number,\
pointsLost: number\
},\
createdAt: Timestamp,\
updatedAt: Timestamp\
}

**Lưu ý:** allTimeStats là aggregate/cache, không phải source of truth. Phải có chức năng rebuild từ dữ liệu giải đấu.

# 5. Module 2 – Quản lý tài chính

Mục tiêu là tạo một sổ quỹ minh bạch, có thể phân tích theo năm, theo giải, theo loại thu/chi và theo người đóng. Không xóa vật lý giao dịch đã xác nhận; khi hủy dùng VOID kèm người và thời điểm thực hiện.

## 5.1. Dashboard

- TỔNG THU
- TỔNG CHI
- SỐ DƯ TỒN QUỸ
- Pie/Donut: cơ cấu khoản chi
- Bar/Line: thu – chi theo năm hoặc theo giải
- Bảng giao dịch có lọc IN/OUT, năm, category, tournament

## 5.2. Schema finances

finances/{financeId}\
{\
type: "IN" | "OUT",\
category: string,\
amount: number,\
description: string,\
personId: string | null,\
personName: string | null,\
tournamentId: string | null,\
year: number,\
receiptUrl: string | null,\
status: "CONFIRMED" | "VOID",\
voidReason: string | null,\
voidedBy: string | null,\
voidedAt: Timestamp | null,\
timestamp: Timestamp,\
createdBy: string,\
updatedAt: Timestamp\
}

## 5.3. Quy tắc tài chính

- personId + personName là Reference + Snapshot; transaction lịch sử vẫn giữ tên tại thời điểm giao dịch.
- tournamentId liên kết khoản thu/chi với từng giải; null dùng cho quỹ chung.
- amount > 0; dấu thu/chi do type quyết định, không dùng số âm để biểu thị OUT.
- Giao dịch CONFIRMED không DELETE vật lý. Hủy → VOID.
- Mọi create/update/void tài chính đều ghi audit log.
- Số dư = tổng IN hợp lệ – tổng OUT hợp lệ.

# 6. Module 3 – Tournament Management

## 6.1. Vòng đời giải

DRAFT → DRAWING → DRAWN → ONGOING → COMPLETED\
└──────→ CANCELLED\

Không cho sửa config lõi sau trạng thái DRAWN, trừ các hành động được ADMIN mở khóa và phải audit.

## 6.2. Tournament schema

tournaments/{tournamentId}\
{\
name: string,\
startDate: Timestamp,\
status: "DRAFT" | "DRAWING" | "DRAWN" | "ONGOING" | "COMPLETED" | "CANCELLED" | "ARCHIVED",\
config: {...},\
publicSlug: string,\
createdBy: string,\
createdAt: Timestamp,\
updatedAt: Timestamp,\
completedAt: Timestamp | null\
}

## 6.3. Cấu hình giải đề xuất

config: {\
format: "FIXED_DOUBLES" | "ROTATING_DOUBLES",\

participants: {\
genderMode: "MALE" | "FEMALE" | "MIXED",\
maxPlayers: number\
},\

rotating: {\
uniquePartnersRequired: number,\
matchesRequiredPerPlayer: number | "AUTO",\
maxPartnerRepeat: number,\
balanceMatches: boolean,\
balanceRest: boolean,\
minimizeOpponentRepeat: boolean\
},\

groups: {\
numberOfGroups: number,\
maxEntitiesPerGroup: number,\
assignmentMode: "RANDOM" | "SEEDED"\
},\

scoring: {\
matchFormat: "SINGLE_GAME" | "BEST_OF_3",\
pointsToWin: number,\
winByTwo: boolean,\
maxPoints: number | null\
},\

ranking: {\
rules: \["MATCH_WINS", "POINT_DIFFERENCE", "POINTS_WON", "HEAD_TO_HEAD"]\
},\

knockout: {\
enabled: boolean,\
qualifiersPerGroup: number,\
pairingMode: "FIXED_BRACKET" | "NEW_RANDOM_PAIR" | "KEEP_GROUP_PAIR",\
drawMode: "FIXED" | "RANDOM"\
},\

scheduling: {\
courts: number,\
restBetweenMatches: number\
}\
}

# 7. Snapshot và dữ liệu lịch sử

Mỗi giải phải bảo toàn trạng thái dữ liệu tại thời điểm thi đấu. Snapshot được thực hiện ở tối thiểu ba tầng: participant, match và transaction. Điều này giúp lịch sử không phụ thuộc vào hồ sơ hiện tại.

## 7.1. Participants

tournaments/{id}/participants/{participantId}\
{\
memberId: string,\
name: string,\
gender: "MALE" | "FEMALE",\
school: "YD1" | "YD2" | "YD3" | "OTHER",\
avatarUrl: string | null,\
seed: number | null,\
registrationStatus: "REGISTERED" | "CONFIRMED" | "WITHDRAWN" | "ABSENT",\
tournamentStats: {\
matchesPlayed: number,\
matchesWon: number,\
matchesLost: number,\
pointsWon: number,\
pointsLost: number,\
pointsDifference: number\
},\
createdAt: Timestamp\
}

## 7.2. Teams – chỉ dùng cho Fixed Doubles

tournaments/{id}/teams/{teamId}\
{\
name: string,\
p1Id: string,\
p2Id: string,\
p1Name: string,\
p2Name: string,\
groupId: string | null,\
teamStats: { played, won, lost, pointsDifference },\
createdAt: Timestamp\
}

## 7.3. Groups

tournaments/{id}/groups/{groupId}\
{\
name: string,\
type: "MALE" | "FEMALE" | "MIXED",\
entityType: "TEAM" | "PARTICIPANT",\
entityIds: string\[],\
maxEntities: number\
}

# 8. Match Engine và schema trận đấu

## 8.1. Match schema

tournaments/{id}/matches/{matchId}\
{\
stage: "GROUP" | "QUARTER_FINAL" | "SEMI_FINAL" | "FINAL",\
round: number,\
groupId: string | null,\
order: number,\
courtId: string | null,\
team1: { p1Id, p1Name, p2Id, p2Name },\
team2: { p1Id, p1Name, p2Id, p2Name },\
games: [\
{ score1: number, score2: number }\
],\
score1Total: number,\
score2Total: number,\
winner: "TEAM1" | "TEAM2" | "NONE",\
status: "SCHEDULED" | "READY" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "WALKOVER",\
operatorId: string | null,\
updatedAt: Timestamp,\
completedAt: Timestamp | null\
}

## 8.2. Quy tắc trận

- Một match có đúng 4 người distinct khi là doubles.
- Một người không được xuất hiện đồng thời ở cả Team 1 và Team 2.
- Không cho nhập score vượt maxPoints nếu config cấm.
- COMPLETED phải xác định winner, trừ trường hợp WALKOVER theo rule riêng.
- Match đã COMPLETED chỉ ADMIN mới được sửa; mọi sửa phải tạo score history + audit.
- round và order phục vụ lập lịch, hiển thị và cân bằng nghỉ.

# 9. Rotating Doubles – Tournament Engine

Đây là module nghiệp vụ quan trọng nhất của V6. Mục tiêu là tạo lịch đáp ứng ràng buộc cứng trước, sau đó tối ưu các mục tiêu mềm. Không dùng Math.random thuần túy rồi coi kết quả là hợp lệ.

## 9.1. Định nghĩa

uniquePartnersRequired = số đồng đội khác nhau mà mỗi VĐV phải ghép trong toàn giải\
matchesRequiredPerPlayer = số trận mỗi VĐV phải thi đấu\
maxPartnerRepeat = số lần tối đa một cặp partner được phép lặp

## 9.2. Hard constraints

- Mỗi match có đúng 4 VĐV distinct.
- Mỗi VĐV đạt đúng matchesRequiredPerPlayer nếu cấu hình yêu cầu cân bằng tuyệt đối.
- Mỗi VĐV có đúng uniquePartnersRequired partner khác nhau.
- Không cặp partner nào vượt maxPartnerRepeat.
- Không VĐV nào xuất hiện hai lần trong cùng một match.
- Tổng số trận phải phù hợp với tổng lượt chơi yêu cầu.
- Mọi VĐV tham gia phải được gán lịch hoặc báo lỗi rõ ràng.

## 9.3. Soft constraints

- Hạn chế lặp đối thủ.
- Cân bằng số trận liên tiếp.
- Tối đa hóa thời gian nghỉ giữa hai trận của cùng người.
- Phân bổ đều theo các sân.
- Tránh chuỗi trận liên tiếp nếu còn phương án hợp lệ khác.

## 9.4. Feasibility Check

Trước khi sinh lịch, hệ thống phải kiểm tra nhanh các điều kiện số học và cấu hình. Nếu không thể tạo lịch đáp ứng các hard constraints, không cho phép Draw. UI phải hiển thị nguyên nhân thất bại và cấu hình gợi ý có thể sửa.

Ví dụ với N người và K partner duy nhất mỗi người:\
Tổng quan hệ partner cần có = N × K / 2.\
Mỗi match tạo 2 quan hệ partner.\
Nếu mỗi người phải đấu M trận thì tổng lượt chơi = N × M = 4 × số trận.\
Số trận = N × M / 4.\
Các điều kiện trên phải đồng thời phù hợp với số nguyên và cấu hình bảng/sân.

## 9.5. Pipeline thuật toán

Input players + config\
↓\
1\. Feasibility Check\
↓ PASS\
2\. Build partner graph\
↓\
3\. Construct matches\
↓\
4\. Optimize opponent repeat / rest / court load\
↓\
5\. Validate schedule\
↓ FAIL → retry/backtrack with deterministic seed\
↓ PASS\
6\. Persist draw result + algorithmVersion\
↓\
7\. Show animation using saved result

## 9.6. Deterministic seed và phiên bản thuật toán

draws/{drawId}\
{\
drawType: "PARTNER" | "GROUP" | "KNOCKOUT",\
seed: string,\
algorithmVersion: "ROTATING_V2",\
inputHash: string,\
result: object,\
validation: { passed: boolean, errors: string\[], warnings: string\[] },\
createdBy: string,\
createdAt: Timestamp\
}

Dùng seed + algorithmVersion giúp có thể tái hiện/điều tra kết quả khi cần. Đây là yêu cầu quản trị dữ liệu lịch sử, không chỉ phục vụ animation.

# 10. Schedule Validation

## 10.1. Validation report

SCHEDULE VALIDATION\
\-------------------\
Players: 16\
Matches: 16\
Unique partner target: 4\
Partner duplicates: 0\
Players with missing matches: 0\
Players with excess matches: 0\
Invalid matches: 0\
Court conflicts: 0\
Status: PASS

## 10.2. API logic

validateRotatingSchedule(schedule, players, config)\
→ {\
passed: boolean,\
hardConstraintErrors: string\[],\
softConstraintWarnings: string\[],\
playerStats: {...},\
pairStats: {...}\
}

# 11. Fixed Doubles

Nhánh Fixed Doubles đơn giản hơn: bốc/nhập cặp cố định, chia bảng, sinh round-robin/format tương ứng, tính BXH theo đội, sau đó knockout. Team snapshot giữ tên từng VĐV để lịch sử độc lập với members hiện tại.

## 11.1. Luồng

Participants → Draw Teams → Validate Teams → Draw Groups → Generate Fixtures → Play → Standings → Knockout

# 12. Group Stage và chia bảng

## 12.1. Cấu hình

- numberOfGroups
- maxEntitiesPerGroup
- group type
- assignmentMode RANDOM/SEEDED
- entityType TEAM/PARTICIPANT

## 12.2. Luật phân bổ

- Không entity nào thuộc hai bảng.
- Tổng entity trong groups phải bằng tổng entity hợp lệ.
- Nếu sử dụng SEEDED, seed phải được xác định trước khi draw.
- Sau khi DRAWN không tự động xáo lại group nếu đã có match, trừ quy trình RESET được ADMIN xác nhận và audit.

# 13. Knockout Engine

## 13.1. Qualification

knockout: {\
qualifiersPerGroup: 2,\
pairingMode: "FIXED_BRACKET" | "NEW_RANDOM_PAIR" | "KEEP_GROUP_PAIR",\
drawMode: "FIXED" | "RANDOM"\
}

## 13.2. Fixed bracket

Ví dụ 2 bảng:\
A1 vs B2\
B1 vs A2

Bracket rule phải được lưu trong config hoặc tài liệu cấu hình, không hard-code trong component.

## 13.3. Rotating knockout

Nếu giải Rotating đi tiếp vào knockout, phải cấu hình rõ việc ghép cặp mới hay giữ cặp. V6 mặc định hỗ trợ NEW_RANDOM_PAIR khi yêu cầu bốc cặp mới; draw vẫn phải qua validation trước khi công bố.

# 14. Ranking và tie-break

ranking.rules = [\
"MATCH_WINS",\
"POINT_DIFFERENCE",\
"POINTS_WON",\
"HEAD_TO_HEAD"\
]

- Điểm xếp hạng phải được tính tự động từ match results.
- Không nhập tay groupRank/overallRank.
- Khi hòa, áp dụng tuần tự rule trong config.
- Nếu tie-break vẫn chưa phân định được, hệ thống phải đánh dấu TIE và yêu cầu luật phụ được cấu hình; không random âm thầm.

# 15. Draw Animation & Suspense UI

Animation chỉ trình diễn kết quả đã được engine tính và lưu. Điều này đảm bảo refresh hoặc mất mạng giữa chừng không làm thay đổi kết quả.

## 15.1. Luồng

Generate → Validate → Save → Animate\

Start: quay liên tục\
Stop: easing-out + vài vòng giảm tốc\
Finish: zoom đối tượng / hiển thị kết quả / confetti\
Reload giữa animation: đọc kết quả đã lưu, không random lại

## 15.2. One-screen layout

- Khối animation/bóng/lồng cầu bên trái hoặc trung tâm.
- Danh sách kết quả đã bốc bên phải.
- Thanh trạng thái tiến độ.
- Nút Start/Stop/Confirm.
- Âm thanh có thể tắt; không tự phát khi trình duyệt chặn autoplay.

# 16. Public Live Board

Public route examples:\
/tournaments/:id/live\
/tournaments/:id/standings\
/tournaments/:id/schedule

- Trận đang thi đấu theo sân.
- Lịch sắp tới.
- BXH realtime.
- Kết quả đã hoàn thành.
- Bracket knockout.
- Timeline sự kiện của giải.
- QR Code tới publicSlug.
- TV/Kiosk mode tối ưu màn hình lớn.

# 17. Audit Log và Event Timeline

## 17.1. Audit schema

auditLogs/{auditId}\
{\
action: string,\
module: "MEMBER" | "FINANCE" | "TOURNAMENT" | "AUTH",\
targetId: string,\
tournamentId: string | null,\
userId: string,\
userName: string | null,\
before: object | null,\
after: object | null,\
timestamp: Timestamp\
}

## 17.2. Event timeline

tournaments/{id}/events/{eventId}\
{\
type: "DRAW_PARTNERS" | "DRAW_GROUPS" | "MATCH_STARTED" | "SCORE_UPDATED" | "MATCH_COMPLETED" | "KNOCKOUT_DRAW" | "TOURNAMENT_COMPLETED",\
actorId: string,\
message: string,\
metadata: object,\
timestamp: Timestamp\
}

# 18. Score History và quản lý xung đột

## 18.1. Score history

tournaments/{id}/matches/{matchId}/scoreHistory/{historyId}\
{\
oldGames: \[...],\
newGames: \[...],\
changedBy: string,\
changedAt: Timestamp,\
reason: string | null\
}

## 18.2. Offline và conflict

Cloud Firestore hỗ trợ offline persistence trên web; dữ liệu local được đồng bộ khi online trở lại. Với nhiều thay đổi trên cùng một document, cơ chế đồng bộ hiện tại là last-write-wins. Do đó ứng dụng phải tránh cho nhiều thiết bị cùng chỉnh một trận đồng thời. \[4]

- Mỗi match có operatorId khi bắt đầu nhập.
- UI cảnh báo khi document có update mới từ thiết bị khác.
- Chỉ operator hoặc ADMIN được sửa trong khoảng thời gian xử lý.
- Điểm số phải có scoreHistory để truy nguyên và sửa sai.

# 19. PWA và Offline Mode

Web offline persistence phải được bật có chủ đích; Firebase lưu ý rằng cache web không tự động xóa giữa các phiên và chỉ một số trình duyệt hỗ trợ đầy đủ cơ chế này. Dự án phải hiển thị trạng thái Online/Offline rõ ràng và chỉ mở các tính năng phù hợp khi ngoại tuyến. citeturn533462search0

- Installable PWA.
- Service worker cache static assets.
- Offline banner: OFFLINE / SYNCING / ONLINE.
- Score input tiếp tục dùng dữ liệu đã cache.
- Queue hành động local nếu cần và hiển thị pending state.
- Không tự tạo draw mới khi offline nếu chưa có engine result trên client được xác nhận.

# 20. Data Lifecycle, Archive và Recovery

## 20.1. Soft delete

- Members: ARCHIVED.
- Finance: VOID.
- Tournament: ARCHIVED sau COMPLETED.
- Không delete match lịch sử nếu đã phát sinh kết quả.

## 20.2. Rebuild statistics

Admin Tools\
├── Recalculate member all-time stats\
├── Validate tournament integrity\
├── Recalculate standings\
├── Check finance balance\
└── Detect orphan references

# 21. Firestore Collections – Tổng hợp

| **Collection** | **Mục đích** | **Ghi chú** |
| --- | --- | --- |
| members | Danh bạ gốc | Nguồn hồ sơ hiện tại; có aggregate cache |
| users | Tài khoản/quyền | Auth UID + role |
| finances | Sổ quỹ | Reference + Snapshot; không delete confirmed |
| auditLogs | Audit toàn hệ thống | Mọi thay đổi nhạy cảm |
| tournaments | Thông tin/config giải | Nguồn cấu hình |
| tournaments/{id}/participants | Snapshot VĐV | Dữ liệu tại thời điểm giải |
| tournaments/{id}/teams | Snapshot đội | Chỉ Fixed Doubles |
| tournaments/{id}/groups | Bảng đấu | TEAM hoặc PARTICIPANT |
| tournaments/{id}/matches | Lịch + kết quả | Flat, query theo stage/group/order |
| tournaments/{id}/matches/{id}/scoreHistory | Lịch sử sửa điểm | Audit cấp trận |
| tournaments/{id}/draws | Kết quả bốc thăm | Seed + algorithmVersion + validation |
| tournaments/{id}/events | Timeline | Public/ADMIN tùy rule |

# 22. Index và tối ưu truy vấn

- Matches: tournamentId path + stage + groupId + order (subcollection query).
- Finance: type + year + timestamp; tournamentId + timestamp.
- Tournaments: status + startDate.
- Members: status + school + fullName nếu cần query kết hợp.
- Public Live Board ưu tiên query theo match status/stage/order thay vì đọc toàn bộ collection.

**Lưu ý:** Firestore Security Rules không phải bộ lọc; query phải phù hợp với điều kiện của Rules. Thiết kế query và Rules cùng lúc. \[5]

# 23. Export

- Members.xlsx / Members.csv.
- Finance.xlsx / Finance.csv.
- Tournament Results.xlsx: Participants, Matches, Standings, Schedule, Finance by Tournament.
- Có thể xuất JSON backup cho Admin.
- Tên file chứa năm + slug giải.

# 24. Functional Requirements – Tổng hợp

| **ID** | **Yêu cầu** |
| --- | --- |
| FR-MEM-001 | CRUD/Archive thành viên |
| FR-MEM-002 | Upload/change avatar |
| FR-MEM-003 | Search/filter |
| FR-MEM-004 | All-time statistics |
| FR-FIN-001 | Create/update/void finance |
| FR-FIN-002 | Dashboard thu/chi/số dư |
| FR-FIN-003 | Filter & export |
| FR-FIN-004 | Link finance → tournament |
| FR-T-001 | Create/config tournament |
| FR-T-002 | Participant snapshot |
| FR-T-003 | Fixed Doubles draw |
| FR-T-004 | Rotating feasibility |
| FR-T-005 | Rotating schedule generation |
| FR-T-006 | Schedule validation |
| FR-T-007 | Group draw |
| FR-T-008 | Knockout draw |
| FR-T-009 | Scoring |
| FR-T-010 | Standings/tie-break |
| FR-T-011 | Live Board |
| FR-T-012 | Draw animation |
| FR-SEC-001 | Firebase Auth |
| FR-SEC-002 | Role/claims |
| FR-SEC-003 | Firestore Rules |
| FR-SEC-004 | App Check |
| FR-SEC-005 | Audit |
| FR-OFF-001 | Offline persistence |
| FR-OFF-002 | Conflict warning |
| FR-OFF-003 | Score history |
| FR-DATA-001 | Archive/rebuild |
| FR-EXP-001 | XLSX/CSV export |

# 25. Non-Functional Requirements

- Responsive: mobile-first, tablet, desktop, TV/kiosk.
- Realtime UI: thay đổi tỷ số/BXH hiển thị cho Public View với độ trễ thấp trong điều kiện mạng bình thường.
- Availability: app vẫn có thể xem dữ liệu đã cache khi offline.
- Security: không có write public; dữ liệu nhạy cảm không được đặt trong document public nếu cần hạn chế field vì Firestore read là cấp document. \[6]
- Maintainability: Domain Engine không phụ thuộc UI/DB.
- Testability: mọi luật tính điểm, tie-break, feasibility, validator có unit test.
- Observability: audit + event timeline + error logging.
- Accessibility: đủ contrast, keyboard navigation cơ bản, labels cho input, touch target phù hợp.

# 26. Quy tắc nghiệp vụ (Business Rules)

1. BR-001: Mỗi VĐV chỉ xuất hiện một lần trong một match.
2. BR-002: Một Rotating Doubles match phải có đúng 4 VĐV distinct.
3. BR-003: Một cặp partner không vượt maxPartnerRepeat.
4. BR-004: Lịch phải PASS validation trước khi Publish.
5. BR-005: Không thay đổi config lõi sau DRAWN nếu không qua quy trình ADMIN reset.
6. BR-006: Không sửa/xóa match COMPLETED nếu không có quyền ADMIN.
7. BR-007: Mọi sửa score phải ghi scoreHistory và audit.
8. BR-008: Không delete tournament đã COMPLETED; chỉ ARCHIVED.
9. BR-009: Finance CONFIRMED không DELETE; chỉ VOID có lý do.
10. BR-010: All-time stats có thể rebuild, không phải nguồn dữ liệu lịch sử duy nhất.
11. BR-011: Animation không quyết định draw result.
12. BR-012: Không random ngầm khi tie-break chưa được cấu hình đủ.
13. BR-013: Public chỉ đọc dữ liệu đã được publish/cho phép hiển thị.
14. BR-014: Participant và match phải snapshot tên để bảo toàn lịch sử.
15. BR-015: Các enum nghiệp vụ phải dùng giá trị chuẩn trong code, nhãn hiển thị do UI quản lý.

# 27. API/Service Layer đề xuất

membersService\
getMembers()\
createMember()\
updateMember()\
archiveMember()\
uploadAvatar()\

financeService\
createTransaction()\
updateTransaction()\
voidTransaction()\
getFinanceSummary()\

tournamentService\
createTournament()\
updateConfig()\
registerParticipant()\
snapshotParticipants()\
drawGroups()\
generateFixtures()\
publishDraw()\
updateScore()\
completeMatch()\
generateKnockout()\
completeTournament()\

tournamentEngine\
feasibilityCheck()\
generateRotatingSchedule()\
validateRotatingSchedule()\
calculateStandings()\
generateFixedBracket()\
validateKnockout()\

auditService\
writeAudit()\

rebuildService\
recalculateMemberStats()\
validateTournamentIntegrity()

# 28. Kiến trúc thư mục frontend

src/\
├── app/\
├── components/\
├── pages/\
│   ├── PublicDashboard/\
│   ├── Members/\
│   ├── Finance/\
│   ├── Tournaments/\
│   └── Admin/\
├── features/\
│   ├── auth/\
│   ├── members/\
│   ├── finance/\
│   └── tournaments/\
│       ├── engine/\
│       ├── fixedDoubles/\
│       ├── rotatingDoubles/\
│       ├── knockout/\
│       ├── scoring/\
│       └── draw/\
├── services/\
├── repositories/\
├── hooks/\
├── utils/\
├── types/\
└── tests/

# 29. Security Rules – yêu cầu tối thiểu

Public reads only for explicitly public collections/views.\
Authenticated users can read according to role.\
Only EDITOR/ADMIN can create or update tournament/score/finance according to policy.\
Only ADMIN can archive/void/reset sensitive records.\
Clients cannot directly set role or privilege claims.\
Clients cannot write audit entries with arbitrary actor identity; actor should derive from auth context or trusted backend path.

**Lưu ý:** Firebase hiện khuyến nghị Firebase Authentication + Firestore Security Rules cho web/mobile; App Check có thể dùng bổ sung. \[1]

# 30. Hosting và môi trường

Firebase Hosting là lựa chọn ưu tiên vì frontend và các dịch vụ Firebase được triển khai trong cùng hệ sinh thái. Firebase Hosting hiện hỗ trợ SSL mặc định và triển khai bằng Firebase CLI. \[7]

| **Môi trường** | **Mục đích** |
| --- | --- |
| Local | Dev React/Vite, Firebase Emulator Suite |
| Staging | Test tích hợp với project Firebase riêng hoặc namespace riêng |
| Production | Giải chính thức, dữ liệu lâu dài |

# 31. Testing Strategy

## 31.1. Unit tests bắt buộc

- feasibilityCheck với nhiều số lượng VĐV/partner
- partner graph uniqueness
- match construction
- schedule validator
- ranking/tie-break
- score validation
- knockout bracket
- finance balance
- snapshot creation

## 31.2. Test matrix Rotating

| **Case** | **Mục tiêu** | **Kết quả** |
| --- | --- | --- |
| 8 VĐV / 2 partner | Kiểm tra cấu hình nhỏ | Phải xác định PASS/FAIL theo điều kiện toán học |
| 10 VĐV / 3 partner | Kiểm tra graph/scheduling | Không duplicate partner nếu maxPartnerRepeat=0 |
| 12 VĐV / 3–4 partner | Kiểm tra cân bằng | Mọi VĐV được thống kê đúng |
| 14 VĐV / 4 partner | Kiểm tra feasibility | Nếu không khả thi phải báo lý do |
| 16 VĐV / 4 partner | Case điển hình | Tất cả hard constraints PASS nếu cấu hình hợp lệ |
| 20 VĐV / 4–5 partner | Stress test | Validator + scheduler vẫn ổn định |
| Rút 1 VĐV sau DRAW | Kiểm tra immutable draw | Không tự âm thầm thay lịch; phải RESET/REDRAW có audit |
| Offline score | Mất mạng giữa trận | Không mất dữ liệu local, sync khi online |
| Concurrent score | Hai thiết bị cùng sửa | Có cơ chế cảnh báo/conflict history |

## 31.3. E2E

- Đăng nhập → mở Admin
- Tạo giải → cấu hình → add participant
- Feasibility fail → sửa config → pass
- Draw → animation → publish
- Nhập score → BXH realtime
- Hoàn thành knockout → Complete tournament
- Tạo finance → dashboard → export
- Offline → nhập score → online sync

# 32. Lộ trình triển khai

| **Phase** | **Phạm vi** | **Definition of Done** |
| --- | --- | --- |
| 1. Foundation | Vite/React/TS/Tailwind/Firebase/Auth/PWA | App chạy local + auth + route |
| 2. Members | CRUD, avatar, search, archive | Có snapshot-ready member model |
| 3. Finance | Transactions, dashboard, export, audit | Sổ quỹ có tổng thu/chi/số dư |
| 4. Tournament Core | Tournament/participant/group/match/scoring | Fixed flow chạy end-to-end |
| 5. Fixed Doubles | Team draw, groups, standings, knockout | Giải Fixed hoàn chỉnh |
| 6. Rotating Engine | Feasibility, generator, validator, optimizer | Case test đạt hard constraints |
| 7. Live/PWA | Realtime board, offline, score history | Sân bóng có thể thao tác thực tế |
| 8. Hardening | Rules, App Check, backup, audit, performance | Production ready |

# 33. Danh sách thay đổi trọng yếu so với SRS V5

| **Chủ đề** | **Thay đổi V6** | **Mức độ** |
| --- | --- | --- |
| Bảo mật | PIN → Auth + Roles/Claims + Security Rules + App Check | Bắt buộc |
| Audit | Bổ sung auditLogs + event timeline | Bắt buộc |
| Finance | Thêm tournamentId, year, status/VOID, snapshot | Bắt buộc |
| Tournament lifecycle | Thêm DRAWING/DRAWN/CANCELLED/ARCHIVED | Bắt buộc |
| Rotating | Bổ sung Feasibility + Hard/Soft Constraints + Validation | Bắt buộc |
| Rotating params | partnersPerPlayer → uniquePartnersRequired; thêm matchesRequiredPerPlayer | Khuyến nghị |
| Match | Thêm round, court, status chi tiết, games\[], winner, operator | Bắt buộc |
| Score | Thêm scoreHistory | Bắt buộc |
| Knockout | Bổ sung pairingMode và qualification rules | Bắt buộc |
| Ranking | Thêm tie-break config | Bắt buộc |
| Snapshot | Snapshot thêm school/avatar/seed/status; match snapshot tên | Bắt buộc |
| Stats | allTimeStats trở thành aggregate/cache có rebuild | Khuyến nghị |
| Archive | Soft delete/VOID/ARCHIVED | Bắt buộc |
| Offline | Conflict policy + operator ownership | Bắt buộc |
| PWA | Đưa thành yêu cầu chính thức | Khuyến nghị cao |
| Export | Ưu tiên XLSX ngoài CSV | Khuyến nghị |
| Algorithm traceability | draw seed + algorithmVersion + inputHash | Khuyến nghị cao |

# 34. Definition of Done – Production

- Không còn write public vào Firestore.
- Role/claims được kiểm thử bằng emulator.
- Security Rules có test tự động.
- App Check được cấu hình production.
- Rotating Engine có validator riêng và test matrix.
- Mỗi draw lưu seed + algorithmVersion + validation result.
- Finance không delete confirmed.
- Match completed có score history.
- Tournament completed không bị sửa trái phép.
- Public Live Board hoạt động realtime.
- Offline score không mất khi rớt mạng và có conflict handling.
- Có backup/export JSON/XLSX.
- Có tính năng rebuild all-time stats và kiểm tra integrity.
- Tài liệu cấu hình và Business Rules đồng nhất với code.

# 35. Khuyến nghị triển khai cho AI Coder

AI Coder phải được giao tài liệu này cùng các yêu cầu triển khai theo từng phase. Không yêu cầu AI sinh toàn bộ hệ thống trong một prompt duy nhất.

- Bắt đầu từ schema + types + rules + tests, sau đó mới làm UI.
- Viết Tournament Engine như pure TypeScript module, có test trước khi tích hợp Firestore.
- Không hard-code luật giải trong component. Mọi biến thể phải nằm trong config.
- Không dùng random sort làm thuật toán chính.
- Không ghi trực tiếp Firestore từ nhiều component; thông qua service/repository.
- Mọi thao tác nhạy cảm phải qua authorization và audit.
- Sau mỗi phase phải có test + build + lint; trước production dùng emulator kiểm tra rules.

# 36. Tài liệu tham chiếu kỹ thuật

Các yêu cầu Firebase trong tài liệu này được đối chiếu với tài liệu chính thức cập nhật trong tháng 8/2026: bảo mật Firestore/Auth/App Check, offline persistence/PWA và Firebase Hosting. citeturn533462search6turn533462search0turn533462search12turn533462search5

https://firebase.google.com/docs/firestore/security/overview

https://firebase.google.com/docs/firestore/manage-data/enable-offline

https://firebase.google.com/docs/web/pwa

https://firebase.google.com/docs/hosting/quickstart

# 37. Nguồn tham chiếu chính thức

**\[1] Firebase – Secure data in Cloud Firestore**\
https://firebase.google.com/docs/firestore/security/overview

**\[2] Firebase – Writing conditions for Cloud Firestore Security Rules**\
https://firebase.google.com/docs/firestore/security/rules-conditions

**\[3] Firebase – Basic Security Rules / Custom claims and roles**\
https://firebase.google.com/docs/rules/basics

**\[4] Firebase – Access data offline**\
https://firebase.google.com/docs/firestore/manage-data/enable-offline

**\[5] Firebase – Securely query data / Rules are not filters**\
https://firebase.google.com/docs/firestore/security/rules-query

**\[6] Firebase – Control access to specific fields**\
https://firebase.google.com/docs/firestore/security/rules-fields

**\[7] Firebase – Get started with Firebase Hosting**\
https://firebase.google.com/docs/hosting/quickstart

**\[8] Firebase – Use Firebase in a progressive web app (PWA)**\
https://firebase.google.com/docs/web/pwa
