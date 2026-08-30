/**
 * FinanceDashboard — SRS V6 §5.1
 * Shows: tổng thu, tổng chi, số dư, pie chart cơ cấu chi,
 * bảng giao dịch có lọc theo type/year/tournament.
 * VOID action for ADMIN. No physical delete.
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  Wallet, TrendingUp, TrendingDown, Scale,
  Plus, Filter, Download, X, Ban, Receipt,
} from 'lucide-react';
import {
  getTransactions,
  getFinanceSummary,
  voidTransaction,
  FINANCE_CATEGORIES_IN,
  FINANCE_CATEGORIES_OUT,
  type FinanceFilter,
} from '../../features/finance/financeService';
import { useIsEditor, useIsAdmin } from '../../contexts/AuthContext';
import { exportFinancesToCsv } from '../../features/export/exportService';
import type { Finance, FinanceType } from '../../types';
import TransactionFormModal from './TransactionFormModal';

const THIS_YEAR = new Date().getFullYear();
const YEARS = [THIS_YEAR, THIS_YEAR - 1, THIS_YEAR - 2];

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

export default function FinanceDashboard() {
  const isEditor = useIsEditor();
  const isAdmin = useIsAdmin();

  const [transactions, setTransactions] = useState<Finance[]>([]);
  const [summary, setSummary] = useState({ totalIn: 0, totalOut: 0, balance: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FinanceFilter>({ status: 'CONFIRMED' });
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [voidTarget, setVoidTarget] = useState<Finance | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [voidLoading, setVoidLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [txs, sum] = await Promise.all([
        getTransactions(filter),
        getFinanceSummary({ year: filter.year, tournamentId: filter.tournamentId }),
      ]);
      setTransactions(txs);
      setSummary(sum);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleVoid = async () => {
    if (!voidTarget || !voidReason.trim()) return;
    setVoidLoading(true);
    try {
      await voidTransaction(voidTarget.id, voidReason);
      setVoidTarget(null);
      setVoidReason('');
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi VOID giao dịch.');
    } finally {
      setVoidLoading(false);
    }
  };

  // Group categories for pie chart display
  const categoryTotals = transactions
    .filter((t) => t.type === 'OUT' && t.status === 'CONFIRMED')
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] ?? 0) + t.amount;
      return acc;
    }, {});

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Wallet className="text-orange-400" size={24} />
            Quản lý Tài chính
          </h1>
          <p className="text-sm text-white/40 mt-1">Sổ quỹ minh bạch — không xóa vật lý</p>
        </div>
        <div className="flex gap-2">
          {isEditor && (
            <button onClick={() => setShowForm(true)} className="btn-primary" id="add-transaction-btn">
              <Plus size={15} /> Ghi nhận
            </button>
          )}
          <button
            onClick={() => exportFinancesToCsv(transactions)}
            className="btn-secondary"
            title="Xuất CSV báo cáo thu chi"
          >
            <Download size={15} />
            <span className="hidden sm:inline">Xuất CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total IN */}
        <div className="card p-5 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-white/50">Tổng Thu</p>
            <TrendingUp size={16} className="text-green-400" />
          </div>
          <p className="text-2xl font-bold text-green-400">{formatVND(summary.totalIn)}</p>
        </div>

        {/* Total OUT */}
        <div className="card p-5 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-white/50">Tổng Chi</p>
            <TrendingDown size={16} className="text-red-400" />
          </div>
          <p className="text-2xl font-bold text-red-400">{formatVND(summary.totalOut)}</p>
        </div>

        {/* Balance */}
        <div className={`card p-5 space-y-2 ${summary.balance >= 0 ? 'border-green-500/20' : 'border-red-500/20'}`}>
          <div className="flex items-center justify-between">
            <p className="text-sm text-white/50">Số Dư Tồn Quỹ</p>
            <Scale size={16} className={summary.balance >= 0 ? 'text-orange-400' : 'text-red-400'} />
          </div>
          <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-orange-400' : 'text-red-400'}`}>
            {formatVND(summary.balance)}
          </p>
        </div>
      </div>

      {/* Category breakdown */}
      {Object.keys(categoryTotals).length > 0 && (
        <div className="card p-5 space-y-3">
          <h2 className="section-heading text-base">Cơ cấu khoản chi</h2>
          <div className="space-y-2">
            {Object.entries(categoryTotals)
              .sort(([, a], [, b]) => b - a)
              .map(([cat, amount]) => {
                const pct = summary.totalOut > 0 ? (amount / summary.totalOut) * 100 : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/70">{cat}</span>
                      <span className="text-white font-medium">{formatVND(amount)}</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          id="filter-type"
          value={filter.type ?? ''}
          onChange={(e) => setFilter({ ...filter, type: (e.target.value as FinanceType) || undefined })}
          className="input-base py-1.5 text-sm flex-1"
        >
          <option value="">Tất cả (Thu & Chi)</option>
          <option value="IN">Chỉ Thu</option>
          <option value="OUT">Chỉ Chi</option>
        </select>

        <select
          id="filter-year"
          value={filter.year ?? ''}
          onChange={(e) => setFilter({ ...filter, year: Number(e.target.value) || undefined })}
          className="input-base py-1.5 text-sm"
        >
          <option value="">Tất cả năm</option>
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>

        <select
          id="filter-status"
          value={filter.status ?? ''}
          onChange={(e) => setFilter({ ...filter, status: (e.target.value as Finance['status']) || undefined })}
          className="input-base py-1.5 text-sm"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="CONFIRMED">Hợp lệ</option>
          <option value="VOID">Đã VOID</option>
        </select>
      </div>

      {/* Transactions table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt size={32} className="mx-auto text-white/15 mb-3" />
            <p className="text-white/40 text-sm">Chưa có giao dịch nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 py-3 text-xs text-white/40 font-medium">Thời gian</th>
                  <th className="text-left px-4 py-3 text-xs text-white/40 font-medium">Loại</th>
                  <th className="text-left px-4 py-3 text-xs text-white/40 font-medium">Danh mục</th>
                  <th className="text-left px-4 py-3 text-xs text-white/40 font-medium">Mô tả</th>
                  <th className="text-right px-4 py-3 text-xs text-white/40 font-medium">Số tiền</th>
                  <th className="text-center px-4 py-3 text-xs text-white/40 font-medium">Trạng thái</th>
                  {isAdmin && <th className="px-4 py-3" />}
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className={`border-b border-white/5 hover:bg-white/3 transition-colors ${t.status === 'VOID' ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 text-white/50 text-xs whitespace-nowrap">
                      {t.timestamp && 'toDate' in t.timestamp
                        ? t.timestamp.toDate().toLocaleDateString('vi-VN')
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${t.type === 'IN' ? 'badge-green' : 'badge-red'}`}>
                        {t.type === 'IN' ? 'Thu' : 'Chi'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/70">{t.category}</td>
                    <td className="px-4 py-3 text-white/80 max-w-[200px] truncate" title={t.description}>
                      {t.description}
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold font-mono ${t.type === 'IN' ? 'text-green-400' : 'text-red-400'}`}>
                      {t.type === 'OUT' ? '–' : '+'}{formatVND(t.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`badge ${t.status === 'CONFIRMED' ? 'badge-blue' : 'badge-gray'}`}>
                        {t.status === 'CONFIRMED' ? 'OK' : 'VOID'}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-center">
                        {t.status === 'CONFIRMED' && (
                          <button
                            onClick={() => setVoidTarget(t)}
                            className="p-1.5 text-white/30 hover:text-red-400 transition-colors rounded hover:bg-red-900/20"
                            title="VOID giao dịch"
                            aria-label="VOID giao dịch"
                          >
                            <Ban size={13} />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form modal */}
      {showForm && (
        <TransactionFormModal
          onClose={(saved) => { setShowForm(false); if (saved) load(); }}
        />
      )}

      {/* VOID confirm modal */}
      {voidTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="card w-full max-w-sm p-6 space-y-4 animate-fade-in-up">
            <div className="flex items-center gap-2 text-red-400">
              <Ban size={18} />
              <h3 className="font-semibold">Xác nhận VOID giao dịch</h3>
            </div>
            <p className="text-sm text-white/60">
              Giao dịch <strong className="text-white">{formatVND(voidTarget.amount)}</strong> — {voidTarget.description}
              <br />
              <span className="text-orange-400 text-xs">Hành động này không thể hoàn tác.</span>
            </p>
            <div className="space-y-1.5">
              <label className="text-xs text-white/50">Lý do VOID <span className="text-red-400">*</span></label>
              <textarea
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                rows={2}
                className="input-base resize-none"
                placeholder="Nhập lý do..."
              />
            </div>
            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => { setVoidTarget(null); setVoidReason(''); }}>
                Huỷ
              </button>
              <button
                className="btn-danger flex-1"
                onClick={handleVoid}
                disabled={!voidReason.trim() || voidLoading}
              >
                {voidLoading ? <span className="spinner" /> : <Ban size={14} />}
                Xác nhận VOID
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
