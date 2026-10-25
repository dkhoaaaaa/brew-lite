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
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 9999,
        maxWidth: "420px",
        width: "calc(100vw - 32px)",
        backgroundColor: "#FFFFFF",
        border: "1px solid #DED6CB",
        borderLeft: "4px solid #B84A39",
        borderRadius: "8px",
        boxShadow: "0 10px 25px -5px rgba(48, 37, 29, 0.12), 0 4px 10px rgba(48, 37, 29, 0.06)",
        padding: "14px 16px",
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        fontFamily: "var(--font-sans, inherit)",
      }}
    >
      <div style={{ flex: 1 }}>
        <h4
          style={{
            margin: 0,
            fontSize: "14px",
            fontWeight: 600,
            color: "#30251D",
            lineHeight: 1.4,
          }}
        >
          {title}
        </h4>
        {message && (
          <p
            style={{
              margin: "4px 0 0",
              fontSize: "12.5px",
              color: "#6B5E55",
              lineHeight: 1.5,
            }}
          >
            {message}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        style={{
          background: "transparent",
          border: "none",
          padding: "2px 6px",
          cursor: "pointer",
          color: "#9C8E84",
          fontSize: "15px",
          lineHeight: 1,
          borderRadius: "4px",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "#30251D";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "#9C8E84";
        }}
        aria-label="Đóng thông báo"
      >
        ✕
      </button>
    </div>
  );
}

