"use client";

import Link from "next/link";
import { useCart } from "./cart-store";

export function CartIndicator() {
  const { itemCount } = useCart();

  return (
    <Link
      aria-label={`Giỏ hàng, ${itemCount} sản phẩm`}
      className="cart-indicator"
      href="/cart"
    >
      <span>Giỏ hàng</span>
      <span aria-hidden="true" className="cart-indicator__count">{itemCount}</span>
    </Link>
  );
}