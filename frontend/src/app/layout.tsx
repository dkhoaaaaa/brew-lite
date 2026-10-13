import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/global.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Brew Lite - Coffee Ordering',
  description: 'Order your favorite coffee easily',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        {/* Có thể bọc thêm QueryClientProvider hoặc ToastProvider ở đây */}
        {children}
      </body>
    </html>
  );
}