/**
 * MemberFormModal — SRS V6 §4
 * Create or update a member. Avatar upload via Firebase Storage.
 * Validates required fields. Prevents physical delete.
 */
import React, { useState, useRef } from 'react';
import { X, Save, Upload, User } from 'lucide-react';
import { createMember, updateMember, uploadAvatar } from '../../features/members/membersService';
import type { Member, MemberCreateInput, School, Gender, MemberStatus } from '../../types';

const SCHOOLS: { value: School; label: string }[] = [
  { value: 'YD1', label: 'Yên Định 1' },
  { value: 'YD2', label: 'Yên Định 2' },
  { value: 'YD3', label: 'Yên Định 3' },
  { value: 'OTHER', label: 'Khác' },
];

interface Props {
  member: Member | null; // null = create mode
  onClose: (saved: boolean) => void;
}

export default function MemberFormModal({ member, onClose }: Props) {
  const isEdit = !!member;
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<MemberCreateInput>({
    fullName: member?.fullName ?? '',
    gender: member?.gender ?? 'MALE',
    phone: member?.phone ?? '',
    school: member?.school ?? 'YD1',
    avatarUrl: member?.avatarUrl ?? null,
    status: member?.status ?? 'ACTIVE',
    note: member?.note ?? '',
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(member?.avatarUrl ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Chỉ chấp nhận file ảnh.');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) { setError('Tên thành viên không được để trống.'); return; }
    setSaving(true);
    setError('');

    try {
      let memberId: string;

      if (isEdit) {
        await updateMember(member.id, form);
        memberId = member.id;
      } else {
        memberId = await createMember(form);
      }

      // Upload avatar if selected
      if (avatarFile) {
        await uploadAvatar(memberId, avatarFile);
      }

      onClose(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
    >
      <div className="card w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="font-semibold text-white">
            {isEdit ? 'Chỉnh sửa thành viên' : 'Thêm thành viên mới'}
          </h2>
          <button
            onClick={() => onClose(false)}
            className="p-1.5 text-white/40 hover:text-white transition-colors rounded-lg hover:bg-white/10"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-20 h-20 rounded-full bg-navy-700 border-2 border-white/15 flex items-center justify-center overflow-hidden cursor-pointer hover:border-orange-500/50 transition-colors"
              onClick={() => fileRef.current?.click()}
              title="Chọn ảnh đại diện"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={28} className="text-white/20" />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1 transition-colors"
            >
              <Upload size={12} />
              {avatarPreview ? 'Đổi ảnh' : 'Tải ảnh lên'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Full name */}
          <div className="space-y-1.5">
            <label htmlFor="fullName" className="text-sm text-white/60 font-medium">
              Họ và tên <span className="text-orange-500">*</span>
            </label>
            <input
              id="fullName"
              type="text"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="Nguyễn Văn A"
              className="input-base"
              required
            />
          </div>

          {/* Gender + School (2 columns) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="gender" className="text-sm text-white/60 font-medium">Giới tính</label>
              <select
                id="gender"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value as Gender })}
                className="input-base"
              >
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="school" className="text-sm text-white/60 font-medium">Trường</label>
              <select
                id="school"
                value={form.school}
                onChange={(e) => setForm({ ...form, school: e.target.value as School })}
                className="input-base"
              >
                {SCHOOLS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label htmlFor="phone" className="text-sm text-white/60 font-medium">Số điện thoại</label>
            <input
              id="phone"
              type="tel"
              value={form.phone ?? ''}
              onChange={(e) => setForm({ ...form, phone: e.target.value || null })}
              placeholder="0912 345 678"
              className="input-base"
            />
          </div>

          {/* Status (edit only) */}
          {isEdit && (
            <div className="space-y-1.5">
              <label htmlFor="status" className="text-sm text-white/60 font-medium">Trạng thái</label>
              <select
                id="status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as MemberStatus })}
                className="input-base"
              >
                <option value="ACTIVE">Hoạt động</option>
                <option value="INACTIVE">Không hoạt động</option>
                <option value="ARCHIVED">Lưu trữ</option>
              </select>
            </div>
          )}

          {/* Note */}
          <div className="space-y-1.5">
            <label htmlFor="note" className="text-sm text-white/60 font-medium">Ghi chú</label>
            <textarea
              id="note"
              value={form.note ?? ''}
              onChange={(e) => setForm({ ...form, note: e.target.value || null })}
              rows={2}
              placeholder="Thông tin bổ sung..."
              className="input-base resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div role="alert" className="text-sm text-red-300 bg-red-900/20 border border-red-500/20 rounded-lg px-3 py-2.5">
              ⚠️ {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="btn-secondary flex-1"
              disabled={saving}
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={saving}
            >
              {saving ? (
                <><span className="spinner" /> Đang lưu...</>
              ) : (
                <><Save size={14} /> {isEdit ? 'Cập nhật' : 'Thêm mới'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
