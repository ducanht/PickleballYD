import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMember } from '../../features/members/membersService';
import { useIsEditor } from '../../contexts/AuthContext';
import MemberFormModal from './MemberFormModal';
import type { Member } from '../../types';
import { ArrowLeft, User, Trophy, Target, TrendingUp, Activity } from 'lucide-react';

const SCHOOL_LABELS: Record<string, string> = {
  YD1: 'Yên Định 1',
  YD2: 'Yên Định 2',
  YD3: 'Yên Định 3',
  OTHER: 'Khác',
};

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  colorClass = 'text-orange-400',
}: {
  icon: React.FC<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  colorClass?: string;
}) {
  return (
    <div className="card flex flex-col gap-2">
      <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
        <Icon className={`w-4 h-4 ${colorClass}`} />
        {label}
      </div>
      <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

import React from 'react';

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditor = useIsEditor();

  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);

  const loadMember = useCallback(() => {
    if (!id) return;
    setLoading(true);
    getMember(id)
      .then((m) => setMember(m))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { loadMember(); }, [loadMember]);

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="page-container text-center py-20">
        <User className="w-12 h-12 text-slate-700 mx-auto mb-4" />
        <p className="text-slate-300 text-lg font-semibold">Không tìm thấy thành viên</p>
        <button onClick={() => navigate('/members')} className="btn-secondary mt-4">
          ← Quay lại danh sách
        </button>
      </div>
    );
  }

  const stats = member.allTimeStats;
  const winRate =
    stats.matchesPlayed > 0
      ? `${Math.round((stats.matchesWon / stats.matchesPlayed) * 100)}%`
      : '—';
  const diff = stats.pointsWon - stats.pointsLost;
  const diffStr = diff > 0 ? `+${diff}` : `${diff}`;
  const diffColor = diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-slate-400';

  const initials = member.fullName
    .split(' ')
    .map((w) => w[0])
    .slice(-2)
    .join('')
    .toUpperCase();

  return (
    <div className="page-container animate-fade-in-up">
      {/* Back */}
      <button
        onClick={() => navigate('/members')}
        className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors mb-6 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Danh sách thành viên
      </button>

      {/* Profile Header */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            {member.avatarUrl ? (
              <img
                src={member.avatarUrl}
                alt={member.fullName}
                className="w-20 h-20 rounded-full object-cover border-2 border-orange-500/40"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-white text-2xl font-bold border-2 border-orange-500/40">
                {initials}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">{member.fullName}</h1>
              <span className={member.status === 'ACTIVE' ? 'badge badge-green' : 'badge badge-gray'}>
                {member.status === 'ACTIVE' ? 'Hoạt động' : member.status === 'ARCHIVED' ? 'Lưu trữ' : 'Không hoạt động'}
              </span>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-slate-400">
              <span>{member.gender === 'MALE' ? '👨' : '👩'} {member.gender === 'MALE' ? 'Nam' : 'Nữ'}</span>
              {member.school && <span>🏫 {SCHOOL_LABELS[member.school] ?? member.school}</span>}
              {member.phone && <span>📱 {member.phone}</span>}
            </div>
            {member.note && (
              <p className="text-slate-500 text-sm mt-2 italic">"{member.note}"</p>
            )}
          </div>

          {/* Edit button */}
          {isEditor && (
            <button
              id="btn-edit-member"
              onClick={() => setShowEdit(true)}
              className="btn-secondary text-sm shrink-0"
            >
              Chỉnh sửa
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <h2 className="section-heading mb-4">Thống kê toàn giải</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Trophy}
          label="Giải đã dự"
          value={String(stats.tournamentsPlayed)}
          colorClass="text-orange-400"
        />
        <StatCard
          icon={Activity}
          label="Trận đã đấu"
          value={String(stats.matchesPlayed)}
          sub={`${stats.matchesWon} thắng · ${stats.matchesPlayed - stats.matchesWon} thua`}
          colorClass="text-sky-400"
        />
        <StatCard
          icon={Target}
          label="Tỉ lệ thắng"
          value={winRate}
          colorClass="text-emerald-400"
        />
        <StatCard
          icon={TrendingUp}
          label="Hiệu số điểm"
          value={stats.matchesPlayed > 0 ? diffStr : '—'}
          sub={`+${stats.pointsWon} / -${stats.pointsLost}`}
          colorClass={diffColor}
        />
      </div>

      {/* Edit Modal */}
      {showEdit && member && (
        <MemberFormModal
          member={member}
          onClose={(saved) => {
            setShowEdit(false);
            if (saved) loadMember(); // reload after edit
          }}
        />
      )}
    </div>
  );
}
