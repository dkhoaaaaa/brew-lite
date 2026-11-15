"use client";

import React from "react";

export interface LoadingStateProps {
  message?: string;
  variant?: "spinner" | "skeleton";
  size?: "sm" | "md" | "lg";
  fullPage?: boolean;
  className?: string;
}

export function LoadingState({
  message = "Đang tải dữ liệu...",
  variant = "spinner",
  size = "md",
  fullPage = false,
  className = "",
}: LoadingStateProps) {
  const sizeClasses = {
    sm: {
      spinner: "w-5 h-5 border-2",
      text: "text-xs",
      gap: "gap-2",
      padding: "py-4",
    },
    md: {
      spinner: "w-8 h-8 border-3",
      text: "text-sm",
      gap: "gap-3",
      padding: "py-8 sm:py-12",
    },
    lg: {
      spinner: "w-12 h-12 border-4",
      text: "text-base font-medium",
      gap: "gap-4",
      padding: "py-12 sm:py-16",
    },
  }[size];

  if (variant === "skeleton") {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`w-full animate-pulse space-y-3 ${className}`}
      >
        <div className="h-5 bg-[#EAE3D8] rounded-md w-1/3" />
        <div className="h-4 bg-[#F2EDE4] rounded-md w-full" />
        <div className="h-4 bg-[#F2EDE4] rounded-md w-4/5" />
        <span className="sr-only">{message}</span>
      </div>
    );
  }

  const containerClasses = fullPage
    ? "min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-4 bg-[#F7F5F1]"
    : `flex flex-col items-center justify-center ${sizeClasses.padding}`;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`${containerClasses} ${className}`}
    >
      <div
        className={`${sizeClasses.spinner} rounded-full border-[#DED6CB] border-t-[#76513B] animate-spin motion-reduce:animate-none shrink-0`}
        aria-hidden="true"
      />
      {message && (
        <p
          className={`mt-2 ${sizeClasses.text} text-[#6F6258] text-center max-w-sm px-2 select-none`}
        >
          {message}
        </p>
      )}
      <span className="sr-only">{message}</span>
    </div>
  );
}
