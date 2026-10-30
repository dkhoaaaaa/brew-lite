"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAuth } from "../../../lib/auth";
import { formatPrice } from "../../../lib/money";
import { cancelOrder, getOrderById, type CreatedOrderResponse } from "../../../lib/orders-api";
import { getDisplayText } from "../../../features/payment/payment-display";
import styles from "../../../styles/orders.module.css";

export default function OrderDetailsPage() {
  return (
    <Suspense
      fallback={
        <main className={styles.pageShell}>
          <div className={styles.container}>
            <div className={styles.statePanel}>
              <p className={styles.stateDesc} role="status">Đang tải chi tiết đơn hàng...</p>
            </div>
          </div>
        </main>
      }
    >
      <OrderDetailsContent />
    </Suspense>
  );
}

function OrderDetailsContent() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";
  const { isAuthenticated } = useAuth();
  const [order, setOrder] = useState<CreatedOrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    if (!order || !window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) return;
    setCancelling(true);
    try {
      const updated = await cancelOrder(order.id);
      setOrder(updated);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Không thể hủy đơn hàng.");
    } finally {
      setCancelling(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      getOrderById(id)
        .then((data) => {
          if (!active) return;
          setOrder(data);
        })
        .catch((err) => {
          if (!active) return;
          setError(err instanceof Error ? err.message : "Không tìm thấy thông tin đơn hàng.");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [id]);

  if (!isAuthenticated) {
    return (
      <main className={styles.pageShell}>
        <div className={styles.container}>
          <section className={styles.statePanel}>
            <h1 className={styles.stateTitle}>Đăng nhập để xem đơn hàng</h1>
            <p className={styles.stateDesc}>Vui lòng đăng nhập để xem thông tin chi tiết đơn hàng này.</p>
            <Link className={styles.btnPrimary} href="/login">
              Đăng nhập ngay
            </Link>
          </section>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className={styles.pageShell}>
        <div className={styles.container}>
          <div className={styles.statePanel}>
            <p className={styles.stateDesc}>Đang tải chi tiết đơn hàng...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className={styles.pageShell}>
        <div className={styles.container}>
          <div className={styles.statePanel}>
            <h1 className={styles.stateTitle}>Không tìm thấy đơn hàng</h1>
            <p className={styles.stateDesc}>{error ?? "Đơn hàng không tồn tại hoặc đã hết hạn."}</p>
            <Link className={styles.btnPrimary} href="/orders">
              Quay lại danh sách đơn hàng
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return "—";
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

  const latestPayment = order.payments && order.payments.length > 0 ? order.payments[0] : null;

  return (
    <main className={styles.pageShell}>
      <div className={styles.container}>
        <Link className={styles.backLink} href="/orders">
          ← Quay lại danh sách đơn hàng
        </Link>

        <header className={styles.header}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <p className={styles.eyebrow}>Chi tiết đơn hàng</p>
              <h1 className={styles.title}>#{order.orderCode}</h1>
              <p className={styles.subtitle}>Đặt lúc: {formatDate(order.createdAt)}</p>
            </div>
            <div>{getStatusBadge(order.status)}</div>
          </div>
        </header>

        <div className={styles.detailsGrid}>
          {/* Cột trái: Chi tiết món & Tổng kết chi phí */}
          <div>
            <section className={styles.detailsCard}>
              <h2 className={styles.detailsCardTitle}>Món đã chọn ({order.items.length})</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      paddingBottom: "14px",
                      borderBottom: "1px dashed #EDE6DC",
                    }}
                  >
                    <div style={{ flex: 1, paddingRight: "16px" }}>
                      <h3 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: 600, color: "#30251D" }}>
                        {item.quantity} × {item.productName}
                      </h3>
                      <p style={{ margin: "0 0 2px", fontSize: "13px", color: "#6F6258" }}>
                        Size: {getDisplayText(item.sizeCode, "Chưa xác định")} · Đơn giá: {formatPrice(String(item.unitPrice))}
                      </p>
                      {(item.sugarPercent != null || item.icePercent != null) && (
                        <p style={{ margin: "0 0 2px", fontSize: "12.5px", color: "#8C7E73" }}>
                          {item.sugarPercent != null ? `Đường ${item.sugarPercent}%` : ""}
                          {item.sugarPercent != null && item.icePercent != null ? " · " : ""}
                          {item.icePercent != null ? `Đá ${item.icePercent}%` : ""}
                        </p>
                      )}
                      {item.toppings && item.toppings.length > 0 && (
                        <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#76513B" }}>
                          Topping: {item.toppings.map((t) => `${t.name} (x${t.quantity})`).join(", ")}
                        </p>
                      )}
                      {item.note && (
                        <p style={{ margin: "4px 0 0", fontSize: "12px", fontStyle: "italic", color: "#8C7E73" }}>
                          Ghi chú: {item.note}
                        </p>
                      )}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: "15px", color: "#38291E", whiteSpace: "nowrap" }}>
                      {formatPrice(String(item.lineTotal))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bảng tổng kết chi phí */}
              <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#6F6258" }}>
                  <span>Tạm tính</span>
                  <span>{formatPrice(String(order.subtotal))}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#6F6258" }}>
                    <span>Giảm giá</span>
                    <span>-{formatPrice(String(order.discountAmount))}</span>
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingTop: "12px",
                    borderTop: "1px solid #E5DFD7",
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#30251D",
                  }}
                >
                  <span>Tổng thanh toán</span>
                  <span>{formatPrice(String(order.total))}</span>
                </div>
              </div>
            </section>

            {/* Dòng thời gian lịch sử trạng thái (nếu có) */}
            {order.statusHistory && order.statusHistory.length > 0 && (
              <section className={styles.detailsCard}>
                <h2 className={styles.detailsCardTitle}>Lịch sử đơn hàng</h2>
                <div className={styles.timelineList}>
                  {order.statusHistory.map((history) => (
                    <div className={styles.timelineItem} key={history.id}>
                      <div className={styles.timelineStatus}>Trạng thái: {history.newStatus}</div>
                      <div className={styles.timelineTime}>{formatDate(history.changedAt)}</div>
                      {history.note && <div className={styles.timelineNote}>{history.note}</div>}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Cột phải: Thông tin giao dịch & nút thanh toán nếu PENDING */}
          <aside>
            <div className={styles.detailsCard}>
              <h2 className={styles.detailsCardTitle}>Thông tin thanh toán</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px" }}>
                <div>
                  <span style={{ fontSize: "12px", textTransform: "uppercase", color: "#8C7E73", display: "block" }}>
                    Mã đơn hàng
                  </span>
                  <strong style={{ color: "#30251D", fontSize: "15px" }}>{order.orderCode}</strong>
                </div>

                <div>
                  <span style={{ fontSize: "12px", textTransform: "uppercase", color: "#8C7E73", display: "block" }}>
                    Trạng thái đơn
                  </span>
                  <div style={{ marginTop: "4px" }}>{getStatusBadge(order.status)}</div>
                </div>

                {latestPayment ? (
                  <>
                    <div>
                      <span style={{ fontSize: "12px", textTransform: "uppercase", color: "#8C7E73", display: "block" }}>
                        Phương thức thanh toán
                      </span>
                      <strong>
                        {latestPayment.method === "VNPAY"
                          ? "VNPay Sandbox"
                          : getDisplayText(latestPayment.method, "Chưa xác định")}
                      </strong>
                    </div>

                    {latestPayment.transactionCode && (
                      <div>
                        <span style={{ fontSize: "12px", textTransform: "uppercase", color: "#8C7E73", display: "block" }}>
                          Mã giao dịch
                        </span>
                        <code style={{ fontSize: "12.5px", background: "#F5EFE6", padding: "2px 6px", borderRadius: "4px" }}>
                          {latestPayment.transactionCode}
                        </code>
                      </div>
                    )}

                    {latestPayment.paidAt && (
                      <div>
                        <span style={{ fontSize: "12px", textTransform: "uppercase", color: "#8C7E73", display: "block" }}>
                          Thời gian thanh toán
                        </span>
                        <span>{formatDate(latestPayment.paidAt)}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    <span style={{ fontSize: "12px", textTransform: "uppercase", color: "#8C7E73", display: "block" }}>
                      Thanh toán
                    </span>
                    <span style={{ color: "#8C7E73" }}>Chưa ghi nhận giao dịch thanh toán.</span>
                  </div>
                )}
              </div>

              {/* Nếu đơn đang PENDING hoặc PAYMENT_FAILED, hiển thị nút Tiếp tục thanh toán và Hủy đơn */}
              {(order.status === "PENDING" || order.status === "PAYMENT_FAILED") && (
                <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #F0EAE1", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <p style={{ fontSize: "12.5px", color: order.status === "PAYMENT_FAILED" ? "#9B1C1C" : "#975A16", margin: "0 0 4px" }}>
                    {order.status === "PAYMENT_FAILED"
                      ? "Lần thanh toán trước thất bại. Bạn có thể thử lại ngay bây giờ hoặc hủy đơn."
                      : "Đơn hàng đang chờ thanh toán. Đơn sẽ tự hủy nếu quá hạn 2 phút."}
                  </p>
                  <Link
                    className={styles.btnPrimary}
                    href={`/checkout?orderId=${order.id}`}
                    style={{ width: "100%", textAlign: "center" }}
                  >
                    {order.status === "PAYMENT_FAILED" ? "Thử lại thanh toán ngay" : "Tiếp tục thanh toán ngay"}
                  </Link>
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={handleCancel}
                    disabled={cancelling}
                    style={{ width: "100%", color: "#9B1C1C", borderColor: "#F8B4B4" }}
                  >
                    {cancelling ? "Đang hủy..." : "Hủy đơn hàng"}
                  </button>
                </div>
              )}

              {/* Nếu đơn đã CANCELLED, hiển thị thông báo và nút khám phá thực đơn */}
              {order.status === "CANCELLED" && (
                <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #F0EAE1" }}>
                  <p style={{ fontSize: "13px", color: "#718096", marginBottom: "12px" }}>
                    Đơn hàng này đã bị hủy.
                  </p>
                  <Link className={styles.btnPrimary} href="/menu" style={{ width: "100%", textAlign: "center" }}>
                    Khám phá thực đơn mới
                  </Link>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
