import Link from "next/link";
import { EmptyState } from "../components/EmptyState";

export default function GlobalNotFound() {
  const notFoundIcon = (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  );

  return (
    <main className="min-h-[calc(100vh-80px)] bg-[#F7F5F1] py-16 px-4 sm:px-6 flex items-center justify-center font-sans">
      <EmptyState
        icon={notFoundIcon}
        title="404 - Không tìm thấy trang"
        description="Đường dẫn bạn yêu cầu không tồn tại, đã bị đổi tên hoặc tạm thời không khả dụng."
        actionLabel="Khám phá thực đơn"
        actionHref="/menu"
      />
    </main>
  );
}
