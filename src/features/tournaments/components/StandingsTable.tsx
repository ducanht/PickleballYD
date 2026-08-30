import type { StandingEntry } from '../../../types';
import { Trophy } from 'lucide-react';

interface StandingsTableProps {
  title?: string;
  standings: StandingEntry[];
  qualifierCutoff?: number; // Top N qualify for Knockout
}

export default function StandingsTable({
  title,
  standings,
  qualifierCutoff = 2,
}: StandingsTableProps) {
  if (standings.length === 0) {
    return (
      <div className="card text-center py-8">
        <p className="text-slate-400 text-sm">Chưa có dữ liệu bảng xếp hạng</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden p-0 border border-slate-800 rounded-xl">
      {title && (
        <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Trophy className="w-4 h-4 text-orange-400" />
            {title}
          </h3>
          {qualifierCutoff > 0 && (
            <span className="text-xs text-orange-400 font-medium">
              Top {qualifierCutoff} vào vòng Knockout
            </span>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-xs">
              <th className="text-center px-3 py-2.5 w-12">Hạng</th>
              <th className="text-left px-4 py-2.5">Đội / VĐV</th>
              <th className="text-center px-3 py-2.5" title="Số trận đã đấu">Trận</th>
              <th className="text-center px-3 py-2.5" title="Thắng">T</th>
              <th className="text-center px-3 py-2.5" title="Thua">B</th>
              <th className="text-center px-3 py-2.5" title="Điểm thắng / thua">Điểm</th>
              <th className="text-center px-3 py-2.5 font-bold text-orange-400" title="Hiệu số điểm">+/-</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((entry) => {
              const isQualified = qualifierCutoff > 0 && entry.rank <= qualifierCutoff;
              const diffStr =
                entry.pointsDifference > 0
                  ? `+${entry.pointsDifference}`
                  : `${entry.pointsDifference}`;
              const diffColor =
                entry.pointsDifference > 0
                  ? 'text-green-400'
                  : entry.pointsDifference < 0
                  ? 'text-red-400'
                  : 'text-slate-400';

              return (
                <tr
                  key={entry.entityId}
                  className={`border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors ${
                    isQualified ? 'bg-orange-500/5' : ''
                  }`}
                >
                  <td className="text-center px-3 py-3">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        entry.rank === 1
                          ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/50'
                          : entry.rank === 2
                          ? 'bg-slate-300 text-slate-950'
                          : isQualified
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                          : 'text-slate-500'
                      }`}
                    >
                      {entry.rank}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white truncate">{entry.entityName}</span>
                      {entry.isTied && (
                        <span className="badge badge-gray text-[10px] py-0 px-1.5" title="Hòa chỉ số">
                          Hòa
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="text-center px-3 py-3 text-slate-300">{entry.matchesPlayed}</td>
                  <td className="text-center px-3 py-3 font-semibold text-emerald-400">{entry.matchesWon}</td>
                  <td className="text-center px-3 py-3 text-slate-400">{entry.matchesLost}</td>
                  <td className="text-center px-3 py-3 text-xs text-slate-400">
                    {entry.pointsWon} : {entry.pointsLost}
                  </td>
                  <td className={`text-center px-3 py-3 font-bold ${diffColor}`}>
                    {diffStr}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
