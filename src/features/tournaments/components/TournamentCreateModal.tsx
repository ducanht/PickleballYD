import React, { useState } from 'react';
import type { TournamentConfig, TournamentFormat, GenderMode, AssignmentMode, MatchFormat } from '../../../types';
import {
  Trophy,
  X,
  Layers,
  Users,
  Settings,
  Calendar,
  MapPin,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Flame,
  Award,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { feasibilityCheck } from '../engine/feasibilityCheck';

interface TournamentCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    startDate: string;
    venue: string;
    config: TournamentConfig;
  }) => Promise<void>;
  loading?: boolean;
}

export const TournamentCreateModal: React.FC<TournamentCreateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
}) => {
  // Step / Tab: 1 = Basic & Category, 2 = Groups & Quota, 3 = Scoring & Knockout
  const [activeTab, setActiveTab] = useState<1 | 2 | 3>(1);

  // Form states
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [venue, setVenue] = useState('Sân Pickleball Trung Tâm Yên Định');
  const [courts, setCourts] = useState(2);

  // Format & Category
  const [format, setFormat] = useState<TournamentFormat>('FIXED_DOUBLES');
  const [genderMode, setGenderMode] = useState<GenderMode>('MIXED');

  // Groups & Quota
  const [numberOfGroups, setNumberOfGroups] = useState(2);
  const [entitiesPerGroup, setEntitiesPerGroup] = useState(4); // For Fixed: 4 pairs/group; For Rotating: 8 players/group
  const [assignmentMode, setAssignmentMode] = useState<AssignmentMode>('RANDOM');

  // Rotating specific
  const [roundsCount, setRoundsCount] = useState(4);
  const [maxPartnerRepeat, setMaxPartnerRepeat] = useState(1);
  const [uniquePartnersRequired, setUniquePartnersRequired] = useState(3);

  // Scoring & Knockout
  const [matchFormat, setMatchFormat] = useState<MatchFormat>('SINGLE_GAME');
  const [pointsToWin, setPointsToWin] = useState(11);
  const [winByTwo, setWinByTwo] = useState(true);
  const [maxPoints, setMaxPoints] = useState<number | null>(15);
  const [knockoutEnabled, setKnockoutEnabled] = useState(true);
  const [qualifiersPerGroup, setQualifiersPerGroup] = useState(2);
  const [restBetweenMatches, setRestBetweenMatches] = useState(5);

  if (!isOpen) return null;

  // Calculated totals
  const totalEntities = numberOfGroups * entitiesPerGroup;
  const totalPlayers = format === 'FIXED_DOUBLES' ? totalEntities * 2 : totalEntities;

  // Feasibility validation for Rotating Doubles
  const rotatingFeasibility =
    format === 'ROTATING_DOUBLES'
      ? feasibilityCheck({
          numPlayers: entitiesPerGroup,
          uniquePartnersRequired: Math.min(uniquePartnersRequired, entitiesPerGroup - 1),
          matchesRequiredPerPlayer: roundsCount,
          courts,
        })
      : { feasible: true, errors: [], suggestions: [], numMatches: 0 };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !startDate) return;

    const fullConfig: TournamentConfig = {
      format,
      participants: {
        genderMode,
        maxPlayers: totalPlayers,
      },
      rotating: {
        uniquePartnersRequired: Math.min(uniquePartnersRequired, entitiesPerGroup - 1),
        matchesRequiredPerPlayer: roundsCount,
        maxPartnerRepeat,
        balanceMatches: true,
        balanceRest: true,
        minimizeOpponentRepeat: true,
      },
      groups: {
        numberOfGroups,
        maxEntitiesPerGroup: entitiesPerGroup,
        assignmentMode,
      },
      scoring: {
        matchFormat,
        pointsToWin,
        winByTwo,
        maxPoints: maxPoints || null,
      },
      ranking: {
        rules: ['MATCH_WINS', 'POINT_DIFFERENCE', 'POINTS_WON', 'HEAD_TO_HEAD'],
      },
      knockout: {
        enabled: knockoutEnabled,
        qualifiersPerGroup,
        pairingMode: 'FIXED_BRACKET',
        drawMode: 'RANDOM',
      },
      scheduling: {
        courts,
        restBetweenMatches,
      },
    };

    await onSubmit({
      name: name.trim(),
      startDate,
      venue: venue.trim(),
      config: fullConfig,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col glass-panel p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-950/60">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white font-display">
                Khởi Tạo Giải Đấu Pickleball
              </h3>
              <p className="text-xs text-slate-400">
                Hội Cựu Học Sinh Yên Định • Cấu hình chuẩn thể thức và nội dung thi đấu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 gap-2 bg-white/[0.03] p-1.5 rounded-2xl border border-white/[0.06]">
          <button
            type="button"
            onClick={() => setActiveTab(1)}
            className={`py-2 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 1
                ? 'bg-orange-500 text-white shadow-md shadow-orange-950/50'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>1. Thể Thức & Nội Dung</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab(2)}
            className={`py-2 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 2
                ? 'bg-orange-500 text-white shadow-md shadow-orange-950/50'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>2. Bảng Đấu & VĐV</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab(3)}
            className={`py-2 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 3
                ? 'bg-orange-500 text-white shadow-md shadow-orange-950/50'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>3. Luật & Knockout</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 space-y-6">
          {/* ── TAB 1: Basic Information & Format / Category ──────────────── */}
          {activeTab === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Tên Giải Đấu *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-base"
                  placeholder="VD: Giải Pickleball Cựu HS Yên Định Khóa 1998-2001 Lần I - 2026"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Thể Thức Thi Đấu *
                  </label>
                  <select
                    value={format}
                    onChange={(e) => {
                      const f = e.target.value as TournamentFormat;
                      setFormat(f);
                      if (f === 'FIXED_DOUBLES') {
                        setEntitiesPerGroup(4); // 4 pairs per group
                      } else {
                        setEntitiesPerGroup(8); // 8 players per group
                      }
                    }}
                    className="input-base"
                  >
                    <option value="FIXED_DOUBLES">Cặp Cố Định (Fixed Doubles)</option>
                    <option value="ROTATING_DOUBLES">Cặp Xoay Vòng (Rotating Doubles)</option>
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {format === 'FIXED_DOUBLES'
                      ? 'Ghép đôi cố định suốt giải, chia bảng đấu vòng tròn và vào vòng Knockout.'
                      : 'Mỗi vòng xoay chuyển bạn cặp mới, tính điểm xếp hạng cá nhân.'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Nội Dung Thi Đấu *
                  </label>
                  <select
                    value={genderMode}
                    onChange={(e) => setGenderMode(e.target.value as GenderMode)}
                    className="input-base"
                  >
                    <option value="MIXED">
                      {format === 'FIXED_DOUBLES' ? 'Đôi Nam Nữ / Hỗn Hợp' : 'Nam & Nữ Hỗn Hợp'}
                    </option>
                    <option value="MALE">
                      {format === 'FIXED_DOUBLES' ? 'Đôi Nam (Men\'s Doubles)' : 'VĐV Nam (Men\'s Rotating)'}
                    </option>
                    <option value="FEMALE">
                      {format === 'FIXED_DOUBLES' ? 'Đôi Nữ (Women\'s Doubles)' : 'VĐV Nữ (Women\'s Rotating)'}
                    </option>
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {genderMode === 'MIXED' && format === 'FIXED_DOUBLES'
                      ? 'Bốc thăm sẽ ghép 1 Nam + 1 Nữ thành 1 cặp đôi.'
                      : `Áp dụng cho nội dung ${genderMode === 'MALE' ? 'Nam' : genderMode === 'FEMALE' ? 'Nữ' : 'Hỗn hợp'}.`}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Ngày Khởi Tranh *
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Địa Điểm Tổ Chức
                  </label>
                  <input
                    type="text"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    className="input-base"
                    placeholder="Sân Pickleball Trung Tâm Yên Định"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 2: Groups & Quota Configuration ────────────────────────── */}
          {activeTab === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div className="glass-card p-4 border-orange-500/20 bg-orange-500/5 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-orange-400">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    Tổng Quan Quy Mô Giải Đấu:
                  </span>
                  <span className="badge-orange text-xs">
                    {totalPlayers} VĐV • {format === 'FIXED_DOUBLES' ? `${totalEntities} Cặp đấu` : `${numberOfGroups} Bảng xoay`}
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Giải gồm <strong className="text-white">{numberOfGroups} bảng đấu</strong> (Bảng A, B, C...). Mỗi bảng gồm{' '}
                  <strong className="text-white">
                    {entitiesPerGroup} {format === 'FIXED_DOUBLES' ? 'cặp đấu' : 'vận động viên'}
                  </strong>.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Số Lượng Bảng Đấu
                  </label>
                  <select
                    value={numberOfGroups}
                    onChange={(e) => setNumberOfGroups(parseInt(e.target.value) || 1)}
                    className="input-base"
                  >
                    <option value={1}>1 Bảng (Đấu vòng tròn toàn giải)</option>
                    <option value={2}>2 Bảng (Bảng A, B)</option>
                    <option value={3}>3 Bảng (Bảng A, B, C)</option>
                    <option value={4}>4 Bảng (Bảng A, B, C, D)</option>
                    <option value={6}>6 Bảng (A, B, C, D, E, F)</option>
                    <option value={8}>8 Bảng (A đến H)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    {format === 'FIXED_DOUBLES' ? 'Số Cặp Đấu Mỗi Bảng' : 'Số VĐV Mỗi Bảng'}
                  </label>
                  <input
                    type="number"
                    min={format === 'FIXED_DOUBLES' ? 2 : 4}
                    max={32}
                    value={entitiesPerGroup}
                    onChange={(e) => setEntitiesPerGroup(parseInt(e.target.value) || 4)}
                    className="input-base"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    {format === 'FIXED_DOUBLES'
                      ? `Tương ứng ${entitiesPerGroup * 2} VĐV trong mỗi bảng.`
                      : `Mỗi bảng gồm ${entitiesPerGroup} VĐV xoay cặp với nhau.`}
                  </p>
                </div>
              </div>

              {format === 'FIXED_DOUBLES' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Cơ Chế Phân Bổ Bảng Đấu
                  </label>
                  <select
                    value={assignmentMode}
                    onChange={(e) => setAssignmentMode(e.target.value as AssignmentMode)}
                    className="input-base"
                  >
                    <option value="RANDOM">Bốc thăm ngẫu nhiên hoàn toàn (Random)</option>
                    <option value="SEEDED">Phân bổ theo Hạt giống (Seeded Seed A1, B1...)</option>
                  </select>
                </div>
              )}

              {format === 'ROTATING_DOUBLES' && (
                <div className="space-y-4 pt-3 border-t border-white/[0.06]">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Cấu Hình Xoay Cặp & Lượt Đấu
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">
                        Số Lượt Đấu / Trận mỗi VĐV
                      </label>
                      <input
                        type="number"
                        min={2}
                        max={10}
                        value={roundsCount}
                        onChange={(e) => setRoundsCount(parseInt(e.target.value) || 4)}
                        className="input-base"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">
                        Số Bạn Cặp Khác Nhau Tối Thiểu
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={entitiesPerGroup - 1}
                        value={uniquePartnersRequired}
                        onChange={(e) => setUniquePartnersRequired(parseInt(e.target.value) || 3)}
                        className="input-base"
                      />
                    </div>
                  </div>

                  {!rotatingFeasibility.feasible && (
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-300 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertCircle className="w-4 h-4" />
                        <span>Cảnh báo tính khả thi toán học:</span>
                      </div>
                      {rotatingFeasibility.errors.map((err, i) => (
                        <p key={i}>• {err}</p>
                      ))}
                      {rotatingFeasibility.suggestions.map((sug, i) => (
                        <p key={i} className="text-slate-300">
                          💡 Gợi ý: {sug}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── TAB 3: Scoring Rules & Knockout Play-off ──────────────────── */}
          {activeTab === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Số Sân Sử Dụng
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={courts}
                    onChange={(e) => setCourts(parseInt(e.target.value) || 2)}
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Thời Gian Nghỉ Giữa Trận (Phút)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={restBetweenMatches}
                    onChange={(e) => setRestBetweenMatches(parseInt(e.target.value) || 5)}
                    className="input-base"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-white/[0.06]">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Quy Chuẩn Tính Điểm
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Thể Thức Trận</label>
                    <select
                      value={matchFormat}
                      onChange={(e) => setMatchFormat(e.target.value as MatchFormat)}
                      className="input-base text-xs"
                    >
                      <option value="SINGLE_GAME">1 Set (Single Game)</option>
                      <option value="BEST_OF_3">BO3 (Best of 3 Sets)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Điểm Thắng Trận</label>
                    <input
                      type="number"
                      min={7}
                      max={25}
                      value={pointsToWin}
                      onChange={(e) => setPointsToWin(parseInt(e.target.value) || 11)}
                      className="input-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Điểm Trần Tối Đa</label>
                    <input
                      type="number"
                      min={pointsToWin}
                      max={35}
                      value={maxPoints || ''}
                      onChange={(e) => setMaxPoints(e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="Không giới hạn"
                      className="input-base"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Vòng Knockout Play-off (Bán Kết / Chung Kết)
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Tự động chuyển các đội/VĐV có thành tích tốt nhất bảng vào nhánh loại trực tiếp.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={knockoutEnabled}
                      onChange={(e) => setKnockoutEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>

                {knockoutEnabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">
                        Số Đội/VĐV Mỗi Bảng Vào Knockout
                      </label>
                      <select
                        value={qualifiersPerGroup}
                        onChange={(e) => setQualifiersPerGroup(parseInt(e.target.value) || 2)}
                        className="input-base"
                      >
                        <option value={1}>1 Đội (Chỉ lấy Nhất bảng vào Chung kết/Bán kết)</option>
                        <option value={2}>2 Đội (Lấy Nhất và Nhì bảng)</option>
                        <option value={4}>4 Đội (Lấy Top 4 đội)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="flex items-center justify-between pt-5 border-t border-white/[0.08]">
            {activeTab > 1 ? (
              <button
                type="button"
                onClick={() => setActiveTab((prev) => (prev - 1) as 1 | 2 | 3)}
                className="btn-secondary text-xs px-4 py-2.5"
              >
                ← Quay lại
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary text-xs px-4 py-2.5"
              >
                Hủy
              </button>
            )}

            <div className="flex items-center gap-3">
              {activeTab < 3 ? (
                <button
                  type="button"
                  onClick={() => setActiveTab((prev) => (prev + 1) as 1 | 2 | 3)}
                  className="btn-primary text-xs px-5 py-2.5 font-bold"
                >
                  Tiếp Tục →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary text-xs px-6 py-2.5 font-bold flex items-center gap-2 shadow-lg shadow-orange-950/50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang Khởi Tạo...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Hoàn Tất & Tạo Giải</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
