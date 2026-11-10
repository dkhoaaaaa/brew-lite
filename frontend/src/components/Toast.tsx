"use client";

import { useEffect } from "react";

export interface ToastProps {
  title: string;
  message?: string;
  onClose: () => void;
  duration?: number;
}

export function Toast({ title, message, onClose, duration = 4500 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-4 left-4 right-4 mx-auto sm:left-auto sm:right-6 sm:bottom-6 w-auto max-w-sm sm:max-w-[420px] sm:w-[420px] z-[9999] bg-white border border-[#DED6CB] border-l-4 border-l-[#B84A39] rounded-xl shadow-xl p-3.5 sm:p-4 flex items-start gap-3 transition-all font-sans"
    >
      <div className="flex-1 min-w-0">
        <h4 className="m-0 text-sm font-semibold text-[#30251D] leading-snug">
          {title}
        </h4>
        {message && (
          <p className="mt-1 mb-0 text-xs text-[#6B5E55] leading-relaxed break-words">
            {message}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="w-8 h-8 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg text-[#9C8E84] hover:text-[#30251D] hover:bg-[#FAF8F5] transition-colors cursor-pointer text-sm shrink-0"
        aria-label="Đóng thông báo"
      >
        ✕
      </button>
    </div>
  );
}
