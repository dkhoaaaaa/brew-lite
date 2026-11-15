"use client";

import Link from "next/link";
import React from "react";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className = "",
}: EmptyStateProps) {
  const defaultIcon = (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
      <line x1="6" y1="1" x2="6" y2="4" />
      <line x1="10" y1="1" x2="10" y2="4" />
      <line x1="14" y1="1" x2="14" y2="4" />
    </svg>
  );

  return (
    <section
      className={`w-full max-w-lg mx-auto bg-white border border-[#DED6CB] rounded-2xl p-6 sm:p-10 text-center shadow-xs ${className}`}
      aria-label={title}
    >
      <div
        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#F5EFE6] text-[#76513B] flex items-center justify-center mx-auto mb-4 shrink-0"
        aria-hidden="true"
      >
        {icon ?? defaultIcon}
      </div>

      <h2 className="text-xl sm:text-2xl font-bold text-[#30251D] mb-2 font-heading tracking-tight">
        {title}
      </h2>

      {description && (
        <p className="text-xs sm:text-sm text-[#6F6258] leading-relaxed mb-6 max-w-md mx-auto">
          {description}
        </p>
      )}

      {actionLabel && (
        <div className="flex justify-center pt-1">
          {actionHref ? (
            <Link
              href={actionHref}
              className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 bg-[#38291E] hover:bg-[#251A13] text-[#FFF9F0] text-xs sm:text-sm font-semibold rounded-xl transition shadow-xs flex items-center justify-center text-center"
            >
              {actionLabel}
            </Link>
          ) : onAction ? (
            <button
              type="button"
              onClick={onAction}
              className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 bg-[#38291E] hover:bg-[#251A13] text-[#FFF9F0] text-xs sm:text-sm font-semibold rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center text-center"
            >
              {actionLabel}
            </button>
          ) : null}
        </div>
      )}
    </section>
  );
}
