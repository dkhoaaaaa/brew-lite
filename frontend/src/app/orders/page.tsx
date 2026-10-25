"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth";
import { formatPrice } from "../../lib/money";
import { cancelOrder, getMyOrders, type CreatedOrderResponse } from "../../lib/orders-api";
import styles from "../../styles/orders.module.css";

const TABS = [
  { id: "ALL", label: "Tất cả" },
  { id: "PENDING", label: "Chờ thanh toán" },
  { id: "PAYMENT_FAILED", label: "Thanh toán lỗi" },
  { id: "PAID", label: "Đã thanh toán" },
  { id: "PREPARING", label: "Đang chuẩn bị" },
  { id: "READY", label: "Đã sẵn sàng" },
  { id: "COMPLETED", label: "Hoàn thành" },
  { id: "CANCELLED", label: "Đã hủy" },
];

export default function OrdersPage() {
  const { isAuthenticated, user } = useAuth();
  const [orders, setOrders] = useState<CreatedOrderResponse[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    getMyOrders(statusFilter)
      .then((data) => {
        if (!active) return;
        setOrders(data);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Không thể tải danh sách đơn hàng.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated, statusFilter]);

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) return;
    try {
      await cancelOrder(orderId);
      const updated = await getMyOrders(statusFilter);
      setOrders(updated);
    } catch (err: any) {
      alert(err instanceof Error ? err.message : "Không thể hủy đơn hàng.");
    }
  };

  // Trạng thái chưa đăng nhập
  if (!isAuthenticated) {
    return (
      <main className={styles.pageShell}>
        <div className={styles.container}>
          <section className={styles.statePanel}>
            <p className={styles.eyebrow}>Tài khoản BrewLite</p>
            <h1 className={styles.stateTitle}>Đăng nhập để xem đơn hàng</h1>
            <p className={styles.stateDesc}>
              Vui lòng đăng nhập vào tài khoản BrewLite của bạn để theo dõi danh sách và lịch sử đơn hàng.
            </p>
            <Link className={styles.btnPrimary} href="/login">
              Đăng nhập ngay
            </Link>
          </section>
        </div>
      </main>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <span className={`${styles.statusBadge} ${styles.statusPending}`}>Chờ thanh toán</span>;
      case "PAYMENT_FAILED":
        return <span className={`${styles.statusBadge} ${styles.statusPaymentFailed}`}>Thanh toán lỗi</span>;
      case "PAID":
        return <span className={`${styles.statusBadge} ${styles.statusPaid}`}>Đã thanh toán</span>;
      case "PREPARING":
        return <span className={`${styles.statusBadge} ${styles.statusPreparing}`}>Đang chuẩn bị</span>;
      case "READY":
        return <span className={`${styles.statusBadge} ${styles.statusReady}`}>Đã sẵn sàng</span>;
      case "COMPLETED":
        return <span className={`${styles.statusBadge} ${styles.statusCompleted}`}>Hoàn thành</span>;
      case "CANCELLED":
        return <span className={`${styles.statusBadge} ${styles.statusCancelled}`}>Đã hủy</span>;
      default:
        return <span className={styles.statusBadge}>{status}</span>;
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <main className={styles.pageShell}>
      <div className={styles.container}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Lịch sử mua hàng</p>
          <h1 className={styles.title}>Đơn hàng của tôi</h1>
          <p className={styles.subtitle}>
            Theo dõi tiến độ, xem lại chi tiết và quản lý các đơn hàng đã đặt tại BrewLite.
          </p>
        </header>

        {/* Tabs lọc trạng thái */}
        <nav aria-label="Bộ lọc trạng thái đơn hàng" className={styles.tabsContainer}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tabBtn} ${statusFilter === tab.id ? styles.tabBtnActive : ""}`}
              onClick={() => setStatusFilter(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Nội dung danh sách đơn hàng */}
        {loading ? (
          <div className={styles.statePanel} style={{ padding: "40px" }}>
            <p className={styles.stateDesc}>Đang tải danh sách đơn hàng của bạn...</p>
          </div>
        ) : error ? (
          <div className={styles.statePanel}>
            <h2 className={styles.stateTitle}>Không thể tải dữ liệu</h2>
            <p className={styles.stateDesc}>{error}</p>
            <button
              className={styles.btnSecondary}
              onClick={() => setStatusFilter((prev) => prev)}
              type="button"
            >
              Thử lại
            </button>
          </div>
        ) : orders.length === 0 ? (
          <section className={styles.statePanel}>
            <h2 className={styles.stateTitle}>Bạn chưa có đơn hàng nào</h2>
            <p className={styles.stateDesc}>
              {statusFilter === "ALL"
                ? "Hãy khám phá những thức uống hấp dẫn của BrewLite và bắt đầu đơn hàng đầu tiên của bạn."
                : `Không tìm thấy đơn hàng nào ở trạng thái "${TABS.find((t) => t.id === statusFilter)?.label}".`}
            </p>
            <Link className={styles.btnPrimary} href="/menu">
              Khám phá thực đơn
            </Link>
          </section>
        ) : (
          <div className={styles.orderList}>
            {orders.map((order) => {
              const isPayable = order.status === "PENDING" || order.status === "PAYMENT_FAILED";
              const totalItemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

              return (
                <article className={styles.orderCard} key={order.id}>
                  <div className={styles.cardHeader}>
                    <div className={styles.codeBlock}>
                      <span className={styles.orderCode}>#{order.orderCode}</span>
                      <span className={styles.orderDate}>Ngày đặt: {formatDate(order.createdAt)}</span>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>

                  <div className={styles.cardItems}>
                    {order.items.slice(0, 3).map((item) => (
                      <div className={styles.cardItemRow} key={item.id}>
                        <div>
                          <span className={styles.itemQuantityName}>
                            {item.quantity} × {item.productName}
                          </span>
                          <div className={styles.cardItemMeta}>
                            Size {item.sizeCode}
                            {item.toppings?.length ? ` · ${item.toppings.map((t) => t.name).join(", ")}` : ""}
                          </div>
                        </div>
                        <span style={{ fontWeight: 600 }}>{formatPrice(String(item.lineTotal))}</span>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <p className={styles.cardItemMeta} style={{ fontStyle: "italic", margin: "4px 0 0" }}>
                        + {order.items.length - 3} món khác
                      </p>
                    )}
                  </div>

                  <div className={styles.cardFooter}>
                    <div className={styles.totalBlock}>
                      <span className={styles.totalLabel}>Tổng cộng ({totalItemsCount} món)</span>
                      <span className={styles.totalAmount}>{formatPrice(String(order.total))}</span>
                    </div>

                    <div className={styles.cardActions}>
                      {isPayable && (
                        <>
                          <Link className={styles.btnPrimary} href={`/checkout?orderId=${order.id}`}>
                            {order.status === "PAYMENT_FAILED" ? "Thử lại thanh toán" : "Thanh toán ngay"}
                          </Link>
                          <button
                            type="button"
                            className={styles.btnSecondary}
                            onClick={() => handleCancelOrder(order.id)}
                            style={{ color: "#9B1C1C", borderColor: "#F8B4B4" }}
                          >
                            Hủy đơn
                          </button>
                        </>
                      )}
                      <Link className={styles.btnSecondary} href={`/orders/${order.id}`}>
                        Xem chi tiết
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

