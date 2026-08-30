import React, { useState } from 'react';
import { QrCode, Copy, Check, ExternalLink, X } from 'lucide-react';

interface QRCodeDisplayProps {
  url: string;
  title?: string;
  onClose?: () => void;
}

export default function QRCodeDisplay({
  url,
  title = 'Quét Mã QR Để Xem Trực Tiếp',
  onClose,
}: QRCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    url
  )}&bgcolor=0B0F19&color=f97316&margin=10`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-orange-400 font-bold text-base">
            <QrCode className="w-5 h-5" />
            <h3>{title}</h3>
          </div>

          {/* QR Code Container */}
          <div className="flex justify-center p-3 bg-slate-950 rounded-xl border border-slate-800 shadow-inner">
            <img
              src={qrImageUrl}
              alt="QR Code"
              className="w-48 h-48 rounded-lg shadow-md"
              loading="lazy"
            />
          </div>

          {/* URL text & copy */}
          <div className="flex items-center gap-2 p-2 bg-slate-950/60 rounded-lg border border-slate-800 text-xs">
            <input
              type="text"
              readOnly
              value={url}
              className="bg-transparent text-slate-300 flex-1 outline-none truncate"
            />
            <button
              onClick={handleCopy}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Sao chép liên kết"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Mở liên kết"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
