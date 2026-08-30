# 🤖 WORKSPACE AGENT RULES & ARCHITECTURE MEMORY
# Pickleball Yến Đình Hub (SRS V6)

Tài liệu này là **Trí Nhớ Dự Án & Quy Tắc Bắt Buộc (Agent Memory)** cho kho mã nguồn `PickleballYD`.
Bất kỳ AI Agent nào làm việc trong dự án này **BẮT BUỘC** phải đọc tài liệu này đầu tiên trước khi can thiệp mã nguồn.

---

## 🏛️ 1. Bản Đồ Kiến Trúc & Quy Tắc Nghiệp Vụ Cốt Lõi

1. **Nghiệp Vụ Thuật Toán Độc Lập Giao Diện (Pure TS Engines)**:
   - Các file trong `src/features/fixedDoubles/` và `src/features/tournaments/engine/` (`teamDrawEngine.ts`, `groupDrawEngine`, `fixtureGenerator`, `rotatingDoublesEngine`, `feasibilityCheck`, `scheduleValidator`, `standingsCalculator`, `knockoutEngine`) là module **Pure TypeScript**.
   - **Tuyệt đối KHÔNG import React hooks hay Firebase Firestore vào các engine này**.

2. **Kỷ Luật Bất Biến Tài Chính & Tỷ Số (Immutable Ledger & Auditing)**:
   - **Tài chính**: Tuyệt đối không xóa cứng dữ liệu (`DELETE`). Mọi thao tác hủy giao dịch đều thông qua hàm `voidTransaction(id, reason)` ghi nhận trạng thái `VOID` kèm lý do và ghi `auditLogs`.
   - **Tỷ số trận đấu**: Mỗi lần cập nhật điểm phải ghi nhận lịch sử `scoreHistory`.
   - **Luật BR-006 & BR-007**: Chỉ tài khoản vai trò `ADMIN` mới có quyền sửa điểm trận đã kết thúc (`COMPLETED`) và bắt buộc phải điền lý do sửa điểm.

3. **Phân Quyền 3 Cấp Độ (RBAC)**:
   - `VIEWER`: Chỉ xem thông tin hội viên, giải đấu, lịch thi đấu, bảng xếp hạng.
   - `EDITOR`: Thêm/sửa hội viên, ghi nhận thu chi, thực hiện bốc thăm giải đấu, nhập điểm trận đấu.
   - `ADMIN`: VOID tài chính, sửa điểm trận đã kết thúc, phân quyền tài khoản, kích hoạt công cụ Rebuild dữ liệu.

4. **An Toàn Khi Xuất CSV Tiếng Việt**:
   - Khi xuất file CSV tiếng Việt cho Excel, luôn chèn mã **UTF-8 BOM (`\uFEFF`)** ở đầu Blob tải về để tránh lỗi font chữ tiếng Việt trên Microsoft Windows.

5. **Quy Trình Kiểm Tra Trước Khi Hoàn Tất**:
   - Luôn chạy lệnh `npm run build` để xác nhận **0 lỗi TypeScript** trước khi bàn giao cho người dùng.

---

<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**This project has a knowledge graph. Start with the code-review-graph MCP tools to narrow scope, then read the source.** The graph is cheaper than scanning files and gives you structural context (callers, dependents, test coverage) that file search cannot.

### Key Tools
| Tool | Use when |
| ------ | ---------- |
| `detect_changes_tool` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context_tool` | Need source snippets for review — token-efficient |
| `get_impact_radius_tool` | Understanding blast radius of a change |
| `get_affected_flows_tool` | Finding which execution paths are impacted |
| `query_graph_tool` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes_tool` | Finding functions/classes by name or keyword |
| `get_architecture_overview_tool` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |
<!-- /code-review-graph MCP tools -->
