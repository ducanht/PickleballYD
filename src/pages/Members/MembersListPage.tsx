/**
 * MembersListPage — SRS V6 §4
 * Table/grid view, search by name/phone, filter by school/gender/status.
 * Avatar upload inline. Archive (not delete) members with history.
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  Users, Search, Plus, Filter, Download,
  UserCheck, UserX, Archive, Edit2, X, ChevronDown,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getMembers } from '../../features/members/membersService';
import { exportMembersToCsv } from '../../features/export/exportService';
import { useIsEditor } from '../../contexts/AuthContext';
import type { Member, MemberStatus, School, Gender } from '../../types';
import MemberFormModal from './MemberFormModal';

const SCHOOL_LABELS: Record<School, string> = {
  YD1: 'Yên Định 1',
  YD2: 'Yên Định 2',
  YD3: 'Yên Định 3',
  OTHER: 'Khác',
};

const STATUS_CONFIG: Record<MemberStatus, { label: string; color: string }> = {
  ACTIVE:   { label: 'Hoạt động', color: 'badge-green' },
  INACTIVE: { label: 'Không HĐ',  color: 'badge-gray' },
  ARCHIVED: { label: 'Lưu trữ',   color: 'badge-yellow' },
};

export default function MembersListPage() {
  const navigate = useNavigate();
  const isEditor = useIsEditor();

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<MemberStatus | ''>('ACTIVE');
  const [filterSchool, setFilterSchool] = useState<School | ''>('');
  const [filterGender, setFilterGender] = useState<Gender | ''>('');
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Member | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMembers({
        status: filterStatus || undefined,
        school: filterSchool || undefined,
        gender: filterGender || undefined,
      });
      setMembers(data);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterSchool, filterGender]);

  useEffect(() => { load(); }, [load]);

  // Client-side search (fast UX without extra Firestore reads)
  const filtered = members.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.fullName.toLowerCase().includes(q) ||
      (m.phone ?? '').includes(q)
    );
  });

  const handleFormClose = (saved: boolean) => {
    setShowForm(false);
    setEditTarget(null);
    if (saved) load();
  };

  const handleEdit = (m: Member) => {
    setEditTarget(m);
    setShowForm(true);
  };

  return (
    <div className="page-container space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Users className="text-orange-400" size={24} />
            Thành viên
          </h1>
          <p className="text-sm text-white/40 mt-1">
            {filtered.length} thành viên {search ? 'tìm thấy' : ''}
          </p>
        </div>
        {isEditor && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary"
            id="add-member-btn"
          >
            <Plus size={16} /> Thêm thành viên
          </button>
        )}
      </div>

      {/* Search & Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            id="member-search"
            type="text"
            placeholder="Tìm theo tên hoặc số điện thoại..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base pl-9 pr-9"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`btn-secondary flex items-center gap-2 ${showFilters ? 'border-orange-500/40 text-orange-300' : ''}`}
        >
          <Filter size={14} />
          Lọc
          <ChevronDown size={13} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>

        {/* Export (EDITOR+) */}
        {isEditor && (
          <button
            onClick={() => exportMembersToCsv(filtered)}
            className="btn-secondary"
            title="Xuất CSV danh sách thành viên"
          >
            <Download size={15} />
            <span className="hidden sm:inline">Xuất CSV</span>
          </button>
        )}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="card p-4 flex flex-wrap gap-4 animate-fade-in-up">
          {/* Status */}
          <div className="space-y-1 min-w-[140px]">
            <label className="text-xs text-white/50 font-medium">Trạng thái</label>
            <select
              id="filter-status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as MemberStatus | '')}
              className="input-base py-1.5 text-sm"
            >
              <option value="">Tất cả</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>

          {/* School */}
          <div className="space-y-1 min-w-[150px]">
            <label className="text-xs text-white/50 font-medium">Trường</label>
            <select
              id="filter-school"
              value={filterSchool}
              onChange={(e) => setFilterSchool(e.target.value as School | '')}
              className="input-base py-1.5 text-sm"
            >
              <option value="">Tất cả</option>
              {Object.entries(SCHOOL_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {/* Gender */}
          <div className="space-y-1 min-w-[130px]">
            <label className="text-xs text-white/50 font-medium">Giới tính</label>
            <select
              id="filter-gender"
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value as Gender | '')}
              className="input-base py-1.5 text-sm"
            >
              <option value="">Tất cả</option>
              <option value="MALE">Nam</option>
              <option value="FEMALE">Nữ</option>
            </select>
          </div>

          <button
            onClick={() => { setFilterStatus(''); setFilterSchool(''); setFilterGender(''); }}
            className="self-end text-xs text-white/40 hover:text-white/70 transition-colors pb-2"
          >
            Xóa bộ lọc
          </button>
        </div>
      )}

      {/* Members Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Users size={36} className="mx-auto text-white/15 mb-3" />
          <p className="text-white/40 text-sm">
            {search ? `Không tìm thấy "${search}"` : 'Chưa có thành viên nào'}
          </p>
          {isEditor && !search && (
            <button onClick={() => setShowForm(true)} className="btn-primary mt-4 text-sm">
              <Plus size={14} /> Thêm thành viên đầu tiên
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              onEdit={isEditor ? handleEdit : undefined}
              onClick={() => navigate(`/members/${member.id}`)}
            />
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <MemberFormModal
          member={editTarget}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}

// ── MemberCard sub-component ──────────────────────────────────────────────────
function MemberCard({
  member,
  onEdit,
  onClick,
}: {
  member: Member;
  onEdit?: (m: Member) => void;
  onClick: () => void;
}) {
  const status = STATUS_CONFIG[member.status];
  const winRate = member.allTimeStats.matchesPlayed > 0
    ? Math.round((member.allTimeStats.matchesWon / member.allTimeStats.matchesPlayed) * 100)
    : 0;

  return (
    <div
      className="card p-4 cursor-pointer hover:border-orange-500/30 transition-all hover:bg-navy-800/60 group animate-fade-in-up"
      onClick={onClick}
    >
      {/* Avatar + Status */}
      <div className="flex items-start justify-between mb-3">
        <div className="relative">
          {member.avatarUrl ? (
            <img
              src={member.avatarUrl}
              alt={member.fullName}
              className="w-12 h-12 rounded-full object-cover border-2 border-white/10"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-navy-700 border-2 border-white/10 flex items-center justify-center text-lg font-bold text-white/30">
              {member.fullName.charAt(0)}
            </div>
          )}
          {/* Gender indicator */}
          <span className="absolute -bottom-0.5 -right-0.5 text-xs">
            {member.gender === 'MALE' ? '👨' : '👩'}
          </span>
        </div>

        {/* Status badge */}
        <span className={`badge ${status.color}`}>{status.label}</span>
      </div>

      {/* Name & School */}
      <h3 className="font-semibold text-white text-sm leading-tight group-hover:text-orange-300 transition-colors">
        {member.fullName}
      </h3>
      <p className="text-xs text-white/40 mt-0.5">
        {SCHOOL_LABELS[member.school]}
        {member.phone && ` • ${member.phone}`}
      </p>

      {/* Stats */}
      {member.allTimeStats.matchesPlayed > 0 && (
        <div className="mt-3 pt-3 border-t border-white/8 flex items-center gap-3 text-xs text-white/50">
          <span>{member.allTimeStats.matchesPlayed} trận</span>
          <span className="text-green-400">{winRate}% thắng</span>
        </div>
      )}

      {/* Edit button */}
      {onEdit && (
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(member); }}
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white/50 hover:text-white"
          title="Chỉnh sửa"
          aria-label={`Chỉnh sửa ${member.fullName}`}
        >
          <Edit2 size={12} />
        </button>
      )}
    </div>
  );
}
