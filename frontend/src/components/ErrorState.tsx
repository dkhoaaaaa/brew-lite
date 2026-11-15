"use client";

import Link from "next/link";
import React from "react";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
  className?: string;
}

export function ErrorState({
  title = "Đã xảy ra lỗi",
  message,
  onRetry,
  retryLabel = "Thử lại",
  secondaryActionLabel,
  secondaryActionHref,
  className = "",
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={`w-full max-w-md mx-auto bg-white border border-rose-200 rounded-2xl p-6 sm:p-8 text-center shadow-xs ${className}`}
    >
      <div
        className="w-12 h-12 rounded-full bg-rose-50 text-rose-700 flex items-center justify-center mx-auto mb-4 border border-rose-100 shrink-0"
        aria-hidden="true"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <h2 className="text-lg sm:text-xl font-bold text-[#30251D] mb-2 font-heading tracking-tight">
        {title}
      </h2>

      {message && (
        <p className="text-xs sm:text-sm text-[#6F6258] mb-6 leading-relaxed max-w-xs sm:max-w-sm mx-auto break-words">
          {message}
        </p>
      )}

      {(onRetry || (secondaryActionLabel && secondaryActionHref)) && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 bg-[#38291E] hover:bg-[#251A13] text-[#FFF9F0] text-xs sm:text-sm font-semibold rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center"
            >
              {retryLabel}
            </button>
          )}

          {secondaryActionLabel && secondaryActionHref && (
            <Link
              href={secondaryActionHref}
              className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 bg-white border border-[#DED6CB] hover:bg-[#FAF8F5] text-[#30251D] text-xs sm:text-sm font-semibold rounded-xl transition shadow-xs flex items-center justify-center"
            >
              {secondaryActionLabel}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
