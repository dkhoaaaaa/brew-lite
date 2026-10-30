export type ProductSizeOption = {
  id: string;
  sizeCode: string;
  extraPrice: string;
};

export type ToppingOption = {
  id: string;
  name: string;
  price: string;
};

export type ProductSummary = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
};

export type ProductDetailData = ProductSummary & {
  sizes: ProductSizeOption[];
  toppings: ToppingOption[];
};

export type ConfiguredProduct = {
  productId: string;
  productName: string;
  productImageUrl: string | null;
  size: ProductSizeOption | null;
  toppings: ToppingOption[];
  unitPrice: string;
  quantity: number;
  sugarPercent?: number | null;
  icePercent?: number | null;
};

export type AddToCartHandler = (item: ConfiguredProduct) => void;