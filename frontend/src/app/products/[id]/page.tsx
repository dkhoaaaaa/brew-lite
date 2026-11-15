import { Suspense } from "react";
import { ProductDetail } from "../../../features/products/components/ProductDetail";
import { LoadingState } from "../../../components/LoadingState";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export default function ProductPage(props: ProductPageProps) {
  return (
    <Suspense
      fallback={
        <main className="min-h-[calc(100vh-80px)] bg-[#F7F5F1] flex items-center justify-center">
          <LoadingState message="Đang mở thông tin món..." />
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