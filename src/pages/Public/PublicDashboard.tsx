/**
 * Public Dashboard — SRS V6 §16
 * Landing page for PUBLIC users. Shows tournament list + community info.
 * No auth required.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Users, Calendar, TrendingUp, QrCode, ArrowRight } from 'lucide-react';

export default function PublicDashboard() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-12">
      {/* Hero */}
      <section className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
          Hội Cựu Học Sinh Yên Định 1998–2001
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
          Pickleball Hub<br />
          <span className="text-orange-400">Yên Định</span>
        </h1>
        <p className="text-white/60 max-w-lg mx-auto text-lg">
          Nền tảng quản lý giải đấu, thành viên và tài chính minh bạch cho cộng đồng.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            to="/tournaments"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-400 transition-colors"
          >
            Xem giải đấu <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/20 text-white/70 rounded-lg hover:bg-white/5 transition-colors"
          >
            Đăng nhập
          </Link>
        </div>
      </section>

      {/* Quick stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Trophy, label: 'Giải đấu', value: '—', color: 'text-orange-400' },
          { icon: Users, label: 'Thành viên', value: '—', color: 'text-blue-400' },
          { icon: Calendar, label: 'Trận đã đấu', value: '—', color: 'text-green-400' },
          { icon: TrendingUp, label: 'Năm hoạt động', value: '2026', color: 'text-purple-400' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
            <Icon className={`w-6 h-6 mx-auto mb-2 ${color}`} />
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-white/50 mt-1">{label}</p>
          </div>
        ))}
      </section>

      {/* Recent tournaments placeholder */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Giải đấu gần đây</h2>
          <Link to="/tournaments" className="text-sm text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1">
            Xem tất cả <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
          <QrCode className="w-10 h-10 mx-auto text-white/20 mb-3" />
          <p className="text-white/40 text-sm">Chưa có giải đấu nào được tạo</p>
        </div>
      </section>
    </div>
  );
}
