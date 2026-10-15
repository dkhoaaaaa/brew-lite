import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "BrewLite",
  description: "Ứng dụng đặt cà phê không dùng tiền mặt",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}