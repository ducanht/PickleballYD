/**
 * Public Dashboard — SRS V6 §16
 * High-impact Landing Page & Live Sports Hub for Pickleball Yến Đình K98-01.
 * Fetches dynamic data from Firestore: ongoing tournaments, live matches, members leaderboard.
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trophy,
  Users,
  Calendar,
  Wallet,
  ArrowRight,
  Activity,
  Flame,
  ChevronRight,
  Award,
  Sparkles,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import { getTournaments, getMatches } from '../../features/tournaments/tournamentService';
import { getMembers } from '../../features/members/membersService';
import { getFinanceSummary } from '../../features/finance/financeService';
import type { Tournament, Match, Member } from '../../types';

export default function PublicDashboard() {
  const navigate = useNavigate();

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null);
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [stats, setStats] = useState({
    totalTournaments: 0,
    totalMembers: 0,
    totalMatches: 0,
    fundBalance: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all([
      getTournaments().catch(() => []),
      getMembers().catch(() => []),
      getFinanceSummary().catch(() => ({ totalIn: 0, totalOut: 0, balance: 0, transactionCount: 0 })),
    ])
      .then(async ([tList, mList, fSummary]) => {
        if (!alive) return;
        setTournaments(tList);
        setMembers(mList);

        // Find ongoing or latest tournament
        const ongoing = tList.find((t) => t.status === 'ONGOING') || tList[0] || null;
        setActiveTournament(ongoing);

        let matchesCount = 0;
        let ongoingMatches: Match[] = [];

        if (ongoing) {
          try {
            const mData = await getMatches(ongoing.id);
            matchesCount = mData.length;
            ongoingMatches = mData.filter((m) => m.status === 'IN_PROGRESS' || m.status === 'SCHEDULED').slice(0, 4);
          } catch {
            // Non-blocking
          }
        }

        setLiveMatches(ongoingMatches);
        setStats({
          totalTournaments: tList.length,
          totalMembers: mList.length,
          totalMatches: matchesCount,
          fundBalance: fSummary.balance,
        });
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  // Top 4 members by matches won
  const topMembers = [...members]
    .sort((a, b) => (b.allTimeStats?.matchesWon || 0) - (a.allTimeStats?.matchesWon || 0))
    .slice(0, 4);

  return (
    <div className="space-y-16 pb-16">
      {/* ── 1. HERO SECTION ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 px-4 sm:px-6">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-orange-500/15 via-amber-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-10 w-[400px] h-[300px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10 text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-orange-500/30 text-orange-400 text-xs sm:text-sm font-semibold shadow-inner shadow-orange-500/10 backdrop-blur-md animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse-glow" />
            <span>Hội Cựu Học Sinh Yên Định 1998 – 2001</span>
            <span className="hidden sm:inline text-white/30">•</span>
            <span className="hidden sm:inline text-slate-300">Yên Định 1 - 2 - 3</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.08] font-display">
            Sân Chơi Thể Thao <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 bg-clip-text text-transparent drop-shadow-sm">
              Pickleball Đỉnh Cao
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-slate-300 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-normal">
            Hệ thống quản lý giải đấu thể thao thông minh, bốc thăm tự động, cập nhật điểm số trực tiếp thời gian thực và công khai quỹ tài chính minh bạch.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-4">
            {activeTournament ? (
              <Link
                to={`/tournaments/${activeTournament.id}/live`}
                className="btn-primary px-6 py-3.5 text-sm sm:text-base font-bold shadow-lg shadow-orange-950/60 flex items-center gap-2.5"
              >
                <Activity className="w-5 h-5 animate-pulse text-amber-200" />
                <span>Xem Trực Tiếp Giải Đấu</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                to="/tournaments"
                className="btn-primary px-6 py-3.5 text-sm sm:text-base font-bold shadow-lg shadow-orange-950/60 flex items-center gap-2.5"
              >
                <Trophy className="w-5 h-5 text-amber-200" />
                <span>Khám Phá Giải Đấu</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}

            <Link
              to="/tournaments"
              className="btn-secondary px-5 py-3.5 text-sm sm:text-base font-semibold"
            >
              Danh Sách Giải Đấu
            </Link>

            <Link
              to="/members"
              className="btn-secondary px-5 py-3.5 text-sm sm:text-base font-semibold"
            >
              Cộng Đồng VĐV
            </Link>
          </div>
        </div>
      </section>

      {/* ── 2. QUICK STATS OVERVIEW ──────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="glass-card p-5 sm:p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Trophy className="w-16 h-16 text-orange-400" />
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
                <Trophy className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Giải Đấu</span>
            </div>
            <p className="text-3xl sm:text-4xl font-extrabold text-white font-score">
              {loading ? '...' : stats.totalTournaments}
            </p>
            <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
              <span className="text-emerald-400 font-semibold">100%</span> chuẩn quy chế
            </p>
          </div>

          <div className="glass-card p-5 sm:p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Users className="w-16 h-16 text-blue-400" />
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Vận Động Viên</span>
            </div>
            <p className="text-3xl sm:text-4xl font-extrabold text-white font-score">
              {loading ? '...' : stats.totalMembers}
            </p>
            <p className="text-xs text-slate-400 mt-1.5">
              Cựu HS K98-01 3 trường
            </p>
          </div>

          <div className="glass-card p-5 sm:p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Calendar className="w-16 h-16 text-emerald-400" />
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Trận Đã Đấu</span>
            </div>
            <p className="text-3xl sm:text-4xl font-extrabold text-white font-score">
              {loading ? '...' : stats.totalMatches}
            </p>
            <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-orange-400" />
              Tự động tính BXH
            </p>
          </div>

          <div className="glass-card p-5 sm:p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Wallet className="w-16 h-16 text-amber-400" />
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quỹ Giải Đấu</span>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-score">
              {loading ? '...' : (stats.fundBalance ?? 0).toLocaleString('vi-VN')} <span className="text-xs text-slate-400">VNĐ</span>
            </p>
            <p className="text-xs text-slate-400 mt-1.5">
              Minh bạch thu chi 100%
            </p>
          </div>
        </div>
      </section>

      {/* ── 3. FEATURED ACTIVE TOURNAMENT SHOWCASE ───────────────────────── */}
      {activeTournament ? (
        <section className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="relative rounded-3xl overflow-hidden border border-orange-500/30 bg-gradient-to-br from-navy-900/90 via-navy-850/80 to-navy-900/90 backdrop-blur-2xl p-6 sm:p-8 lg:p-10 shadow-2xl shadow-orange-950/30">
            {/* Background Glow */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-white/[0.08]">
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    ĐANG DIỄN RA
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/25">
                    {activeTournament.config.format === 'FIXED_DOUBLES' ? 'Fixed Doubles (Cặp Cố Định)' : 'Rotating Doubles (Xoay Vòng)'}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight font-display">
                  {activeTournament.name}
                </h2>
                <p className="text-sm text-slate-300 flex items-center gap-2">
                  <span>📍 Sân Pickleball Trung Tâm Yên Định</span>
                  <span>•</span>
                  <span>🏸 {activeTournament.config.scheduling.courts} Sân thi đấu</span>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                <Link
                  to={`/tournaments/${activeTournament.id}/live`}
                  className="btn-primary flex-1 lg:flex-none justify-center px-5 py-3 text-sm font-bold shadow-md shadow-orange-950/40"
                >
                  <Activity className="w-4 h-4 animate-pulse" />
                  Màn Hình Live Kiosk
                </Link>
                <Link
                  to={`/tournaments/${activeTournament.id}`}
                  className="btn-secondary flex-1 lg:flex-none justify-center px-5 py-3 text-sm font-semibold"
                >
                  Chi Tiết Giải
                </Link>
              </div>
            </div>

            {/* Live Matches or Clean Setup Notice */}
            {liveMatches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-6">
                {liveMatches.slice(0, 3).map((m, idx) => (
                  <div key={m.id || idx} className="glass-card p-4 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
                      <span className="flex items-center gap-1.5 text-orange-400">
                        <Activity className="w-3.5 h-3.5" /> {m.courtId || `Sân ${idx + 1}`}
                      </span>
                      <span className={m.status === 'IN_PROGRESS' ? 'badge-emerald' : 'badge-blue'}>
                        {m.status === 'IN_PROGRESS' ? 'Đang đấu' : 'Sắp đấu'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center bg-white/[0.03] p-2.5 rounded-xl border border-white/[0.05]">
                        <span className="text-sm font-bold text-white truncate max-w-[170px]">
                          {m.team1.p1Name} {m.team1.p2Name ? `/ ${m.team1.p2Name}` : ''}
                        </span>
                        <span className="text-xl font-extrabold text-orange-400 font-score">{m.score1Total ?? 0}</span>
                      </div>
                      <div className="flex justify-between items-center bg-white/[0.03] p-2.5 rounded-xl border border-white/[0.05]">
                        <span className="text-sm font-bold text-white truncate max-w-[170px]">
                          {m.team2.p1Name} {m.team2.p2Name ? `/ ${m.team2.p2Name}` : ''}
                        </span>
                        <span className="text-xl font-extrabold text-slate-400 font-score">{m.score2Total ?? 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="pt-6 text-center py-6 text-slate-400 space-y-2">
                <p className="text-sm font-medium">Giải đấu đã sẵn sàng! Ban Tổ Chức có thể tiến hành bốc thăm chia bảng và xếp lịch thi đấu.</p>
                <Link
                  to={`/tournaments/${activeTournament.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-400 hover:text-orange-300 underline"
                >
                  Vào trang quản lý giải đấu →
                </Link>
              </div>
            )}
          </div>
        </section>
      ) : null}

      {/* ── 4. KEY SYSTEM MODULES GRID ───────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-display">
            Tính Năng Vượt Trội Cho Giải Đấu
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            Xây dựng chuyên biệt phục vụ các giải đấu phong trào và bán chuyên nghiệp với độ chính xác tuyệt đối.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 sm:p-8 space-y-4 hover:border-orange-500/40 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-950/60 group-hover:scale-110 transition-transform">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white font-display">Thuật Toán Bốc Thăm Chuẩn</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Hỗ trợ 2 thể thức chuyên nghiệp: <strong>Fixed Doubles</strong> (Cặp cố định chia bảng + Play-off) và <strong>Rotating Doubles</strong> (Đổi bạn cặp tự động không trùng lặp đối thủ).
            </p>
            <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-white/[0.06]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                Chia hạt giống công bằng & ngẫu nhiên
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                Cân bằng số trận & thời gian nghỉ giữa các sân
              </li>
            </ul>
          </div>

          <div className="glass-panel p-6 sm:p-8 space-y-4 hover:border-blue-500/40 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-950/60 group-hover:scale-110 transition-transform">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white font-display">Bảng Điểm Live Kiosk</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Giao diện Live Board chuẩn Kiosk màn hình lớn, tự động đồng bộ thời gian thực mỗi 5 giây, phục vụ hiển thị tại sân thi đấu và điện thoại khán giả.
            </p>
            <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-white/[0.06]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                Chế độ Fullscreen Kiosk không cần đăng nhập
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                Mã QR chia sẻ nhanh cho từng sân thi đấu
              </li>
            </ul>
          </div>

          <div className="glass-panel p-6 sm:p-8 space-y-4 hover:border-emerald-500/40 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-950/60 group-hover:scale-110 transition-transform">
              <Wallet className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white font-display">Quỹ Tài Chính Bất Biến</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Quản lý sổ quỹ thu chi minh bạch: Lệ phí VĐV, tài trợ mạnh thường quân, chi phí sân bãi, giải thưởng. Cơ chế Immutable Ledger chống sửa xóa gian lận.
            </p>
            <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-white/[0.06]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                Báo cáo tổng kết thu chi xuất PDF / Excel
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                Theo dõi minh bạch theo từng giải đấu
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── 5. TOP MEMBERS LEADERBOARD PREVIEW ────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="glass-panel p-6 sm:p-8 lg:p-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-400" />
                <h3 className="text-2xl font-bold text-white font-display">Bảng Xếp Hạng Vận Động Viên</h3>
              </div>
              <p className="text-slate-400 text-sm mt-1">
                Các tay vợt xuất sắc nhất hội khóa Yên Định 1998–2001
              </p>
            </div>
            <Link
              to="/members"
              className="btn-secondary text-xs sm:text-sm font-semibold flex items-center gap-1.5 self-start sm:self-auto"
            >
              Xem Tất Cả Thành Viên <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {topMembers.length > 0 ? (
              topMembers.map((m, idx) => (
                <div
                  key={m.id}
                  onClick={() => navigate(`/members/${m.id}`)}
                  className="glass-card p-5 cursor-pointer hover:border-orange-500/40 relative group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                      {m.fullName.split(' ').slice(-1)[0][0]}
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-extrabold ${
                      idx === 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      idx === 1 ? 'bg-slate-300/20 text-slate-200 border border-slate-300/30' :
                      idx === 2 ? 'bg-orange-700/30 text-orange-300 border border-orange-700/30' :
                      'bg-white/5 text-slate-400 border border-white/10'
                    }`}>
                      #{idx + 1} TOP
                    </span>
                  </div>

                  <h4 className="font-bold text-white text-base group-hover:text-orange-400 transition-colors line-clamp-1">
                    {m.fullName}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Trường: {m.school === 'YD1' ? 'Yên Định 1' : m.school === 'YD2' ? 'Yên Định 2' : m.school === 'YD3' ? 'Yên Định 3' : 'Khác'}
                  </p>

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/[0.06] text-center">
                    <div>
                      <p className="text-xs text-slate-400">Trận Thắng</p>
                      <p className="text-sm font-bold text-emerald-400 font-score">
                        {m.allTimeStats?.matchesWon || 0} Trận
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Tỷ lệ thắng</p>
                      <p className="text-sm font-bold text-orange-400 font-score">
                        {m.allTimeStats?.matchesPlayed
                          ? Math.round(((m.allTimeStats.matchesWon || 0) / m.allTimeStats.matchesPlayed) * 100)
                          : 0}%
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-4 text-center py-8 text-slate-400 text-sm">
                Đang tải danh sách thành viên...
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 6. CALL TO ACTION FOOTER BANNER ──────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 p-8 sm:p-12 text-center text-white shadow-2xl shadow-orange-950/60">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h3 className="text-3xl sm:text-4xl font-black tracking-tight font-display">
              Sẵn Sàng Tham Gia Cùng Chúng Tôi?
            </h3>
            <p className="text-orange-100 text-sm sm:text-base leading-relaxed">
              Cổng thông tin chính thức của Hội Cựu Học Sinh Yên Định 1998–2001. Đăng ký tham gia các giải đấu thể thao và giao lưu kết nối phong trào.
            </p>
            <div className="pt-3 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/tournaments"
                className="px-6 py-3 rounded-xl bg-navy-950 text-white font-bold text-sm hover:bg-navy-900 transition-colors shadow-lg"
              >
                Xem Lịch Thi Đấu
              </Link>
              <Link
                to="/login"
                className="px-6 py-3 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold text-sm border border-white/30 transition-colors"
              >
                Đăng Nhập Quản Trị
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
