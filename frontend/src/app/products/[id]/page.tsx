import { Suspense } from "react";
import { ProductDetail } from "../../../features/products/components/ProductDetail";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export default function ProductPage(props: ProductPageProps) {
  return (
    <Suspense
      fallback={
        <main className="page-shell">
          <p className="state-message" role="status">Đang mở thông tin món...</p>
        </main>
      }
    >
      <ProductRoute {...props} />
    </Suspense>
  );
}

async function ProductRoute({ params }: ProductPageProps) {
  const { id } = await params;
  return <ProductDetail productId={id} />;
}