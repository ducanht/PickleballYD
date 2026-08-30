/**
 * TransactionFormModal — SRS V6 §5
 * Create a new finance transaction. Linked to tournament optionally.
 * amount > 0 always; type (IN/OUT) determines sign.
 */
import React, { useState } from 'react';
import { X, Save, DollarSign } from 'lucide-react';
import { createTransaction, FINANCE_CATEGORIES_IN, FINANCE_CATEGORIES_OUT } from '../../features/finance/financeService';
import type { FinanceType } from '../../types';

interface Props {
  onClose: (saved: boolean) => void;
  /** Pre-fill tournament context */
  tournamentId?: string;
}

export default function TransactionFormModal({ onClose, tournamentId }: Props) {
  const [type, setType] = useState<FinanceType>('IN');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [description, setDescription] = useState('');
  const [personName, setPersonName] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const categories = type === 'IN' ? FINANCE_CATEGORIES_IN : FINANCE_CATEGORIES_OUT;
  const finalCategory = category === '__custom__' ? customCategory : category;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(amountStr.replace(/[,.]/g, ''));
    if (!amount || amount <= 0) { setError('Số tiền phải lớn hơn 0.'); return; }
    if (!finalCategory.trim()) { setError('Vui lòng chọn hoặc nhập danh mục.'); return; }
    if (!description.trim()) { setError('Mô tả không được để trống.'); return; }

    setSaving(true);
    setError('');
    try {
      await createTransaction({
        type,
        category: finalCategory.trim(),
        amount,
        description: description.trim(),
        personId: null,
        personName: personName.trim() || null,
        tournamentId: tournamentId ?? null,
        year,
        receiptUrl: null,
      });
      onClose(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="card w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <DollarSign size={16} className="text-orange-400" />
            Ghi nhận giao dịch
          </h2>
          <button onClick={() => onClose(false)} className="p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/10" aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Type toggle */}
          <div className="flex gap-2 p-1 bg-navy-800 rounded-lg">
            {(['IN', 'OUT'] as FinanceType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setType(t); setCategory(''); }}
                className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${
                  type === t
                    ? t === 'IN' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                {t === 'IN' ? '+ Thu' : '− Chi'}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <label htmlFor="amount" className="text-sm text-white/60 font-medium">Số tiền (VNĐ) <span className="text-orange-500">*</span></label>
            <input
              id="amount"
              type="text"
              inputMode="numeric"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value.replace(/[^\d,.]/g, ''))}
              placeholder="500,000"
              className="input-base font-mono"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label htmlFor="category" className="text-sm text-white/60 font-medium">Danh mục <span className="text-orange-500">*</span></label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input-base"
            >
              <option value="">-- Chọn danh mục --</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              <option value="__custom__">Khác (nhập tay)</option>
            </select>
            {category === '__custom__' && (
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Tên danh mục..."
                className="input-base mt-2"
              />
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label htmlFor="desc" className="text-sm text-white/60 font-medium">Mô tả <span className="text-orange-500">*</span></label>
            <input
              id="desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nội dung giao dịch..."
              className="input-base"
              required
            />
          </div>

          {/* Person name (snapshot) */}
          <div className="space-y-1.5">
            <label htmlFor="personName" className="text-sm text-white/60 font-medium">Người nộp / nhận</label>
            <input
              id="personName"
              type="text"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              placeholder="Tên người liên quan (nếu có)"
              className="input-base"
            />
          </div>

          {/* Year */}
          <div className="space-y-1.5">
            <label htmlFor="year" className="text-sm text-white/60 font-medium">Năm</label>
            <select id="year" value={year} onChange={(e) => setYear(Number(e.target.value))} className="input-base">
              {[2026, 2025, 2024].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {error && (
            <div role="alert" className="text-sm text-red-300 bg-red-900/20 border border-red-500/20 rounded-lg px-3 py-2.5">⚠️ {error}</div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => onClose(false)} className="btn-secondary flex-1" disabled={saving}>Huỷ</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? <><span className="spinner" /> Đang lưu...</> : <><Save size={14} /> Ghi nhận</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
