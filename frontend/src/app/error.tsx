"use client";

import { useEffect } from "react";
import { ErrorState } from "../components/ErrorState";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Ghi log lỗi runtime để kiểm tra (không để lộ trên giao diện)
    console.error("Next.js Route Error:", error);
  }, [error]);

  return (
    <main className="min-h-[calc(100vh-80px)] bg-[#F7F5F1] py-16 px-4 sm:px-6 flex items-center justify-center">
      <ErrorState
        title="Đã xảy ra sự cố ngoài ý muốn"
        message="Hệ thống gặp sự cố khi xử lý trang này. Bạn có thể thử lại hoặc quay về trang chủ."
        onRetry={reset}
        retryLabel="Thử tải lại trang"
        secondaryActionLabel="Về trang chủ"
        secondaryActionHref="/"
      />
    </main>
  );
}
