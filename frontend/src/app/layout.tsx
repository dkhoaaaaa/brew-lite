import type { Metadata } from "next";
import Link from "next/link";
import { CartIndicator } from "../features/cart/CartIndicator";
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
      <body>
        <CartProvider>
          <nav aria-label="Điều hướng chính" className="site-nav">
            <Link className="site-nav__brand" href="/">BrewLite<span>.</span></Link>
            <div className="site-nav__links">
              <Link href="/menu">Menu</Link>
              <CartIndicator />
            </div>
          </nav>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}