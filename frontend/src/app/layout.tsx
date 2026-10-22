import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import { CartProvider } from "../features/cart/cart-store";
import "../styles/global.css";

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
      <body className="bg-stone-50 min-h-screen flex flex-col">
        <CartProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
        </CartProvider>
      </body>
    </html>
  );
}