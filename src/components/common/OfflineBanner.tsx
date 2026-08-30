import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { WifiOff, AlertCircle } from 'lucide-react';

export default function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="bg-amber-600/90 text-white px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 shadow-lg sticky top-0 z-50 animate-fade-in backdrop-blur-sm">
      <WifiOff className="w-4 h-4 animate-pulse shrink-0" />
      <span>
        Bạn đang ngoại tuyến (Offline). Dữ liệu nhập điểm sẽ được lưu cục bộ trên thiết bị và tự động đồng bộ khi có kết nối lại.
      </span>
      <AlertCircle className="w-4 h-4 shrink-0 opacity-80" />
    </div>
  );
}
