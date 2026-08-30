/**
 * exportService.ts — CSV & Excel Export Engine (SRS V6 §22)
 * Handles client-side CSV downloads with UTF-8 BOM support for Vietnamese text.
 */

import Papa from 'papaparse';
import type { Member, Finance, StandingEntry, Match } from '../../types';

function downloadCsv(csvContent: string, fileName: string) {
  // Prefix with UTF-8 BOM (\uFEFF) so Excel opens Vietnamese characters correctly
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ── Export Members ────────────────────────────────────────────────────────────
export function exportMembersToCsv(members: Member[], fileName = 'Danh_Sach_Thanh_Vien.csv') {
  const data = members.map((m, idx) => ({
    STT: idx + 1,
    'Họ Và Tên': m.fullName,
    'Giới Tính': m.gender === 'MALE' ? 'Nam' : 'Nữ',
    'Trường': m.school,
    'Số Điện Thoại': m.phone || '',
    'Trạng Thái': m.status,
    'Số Giải Đã Đấu': m.allTimeStats.tournamentsPlayed,
    'Số Trận Đã Đấu': m.allTimeStats.matchesPlayed,
    'Số Trận Thắng': m.allTimeStats.matchesWon,
    'Điểm Thắng': m.allTimeStats.pointsWon,
    'Điểm Thua': m.allTimeStats.pointsLost,
    'Hiệu Số': m.allTimeStats.pointsWon - m.allTimeStats.pointsLost,
  }));

  const csv = Papa.unparse(data);
  downloadCsv(csv, fileName);
}

// ── Export Finance Ledger ─────────────────────────────────────────────────────
export function exportFinancesToCsv(finances: Finance[], fileName = 'So_Quy_Tai_Chinh.csv') {
  const data = finances.map((f, idx) => ({
    STT: idx + 1,
    'Loại Thu/Chi': f.type === 'IN' ? 'Thu' : 'Chi',
    'Danh Mục': f.category,
    'Số Tiền (VNĐ)': f.amount,
    'Nội Dung': f.description,
    'Người Liên Quan': f.personName || '',
    'Năm': f.year,
    'Trạng Thái': f.status === 'CONFIRMED' ? 'Hợp lệ' : 'Đã hủy (VOID)',
    'Lý Do Hủy': f.voidReason || '',
    'Ngày Giao Dịch': f.timestamp ? new Date(f.timestamp.toDate?.() || f.timestamp as unknown as string).toLocaleDateString('vi-VN') : '',
  }));

  const csv = Papa.unparse(data);
  downloadCsv(csv, fileName);
}

// ── Export Tournament Standings ───────────────────────────────────────────────
export function exportStandingsToCsv(standings: StandingEntry[], tournamentName: string, groupName = '') {
  const data = standings.map((s) => ({
    'Hạng': s.rank,
    'Đội / VĐV': s.entityName,
    'Số Trận': s.matchesPlayed,
    'Thắng': s.matchesWon,
    'Thua': s.matchesLost,
    'Điểm Thắng': s.pointsWon,
    'Điểm Thua': s.pointsLost,
    'Hiệu Số': s.pointsDifference,
    'Hòa Chỉ Số': s.isTied ? 'Có' : 'Không',
  }));

  const safeName = tournamentName.replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9]/g, '_');
  const fileName = `BXH_${safeName}_${groupName ? `Bang_${groupName}_` : ''}${Date.now()}.csv`;
  const csv = Papa.unparse(data);
  downloadCsv(csv, fileName);
}

// ── Export Match Results ──────────────────────────────────────────────────────
export function exportMatchesToCsv(matches: Match[], tournamentName: string) {
  const data = matches.map((m) => {
    const score = m.games[0] || { score1: 0, score2: 0 };
    return {
      'Trận Số': m.order,
      'Giai Đoạn': m.stage,
      'Bảng Đấu': m.groupId || '-',
      'Vòng Đấu': m.round,
      'Sân Đấu': m.courtId || '-',
      'Đôi 1': `${m.team1.p1Name} / ${m.team1.p2Name}`,
      'Điểm Đôi 1': score.score1,
      'Điểm Đôi 2': score.score2,
      'Đôi 2': `${m.team2.p1Name} / ${m.team2.p2Name}`,
      'Người Thắng': m.winner === 'TEAM1' ? 'Đôi 1' : m.winner === 'TEAM2' ? 'Đôi 2' : 'Hòa / Chưa đấu',
      'Trạng Thái': m.status,
    };
  });

  const safeName = tournamentName.replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9]/g, '_');
  const fileName = `Ket_Qua_${safeName}_${Date.now()}.csv`;
  const csv = Papa.unparse(data);
  downloadCsv(csv, fileName);
}
