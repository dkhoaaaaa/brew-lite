import { apiClient } from "./api-client";
import { toMinorUnits } from "./money";
import type {
  ProductDetailData,
  ProductSizeOption,
  ProductSummary,
  ToppingOption,
} from "../types/product";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string" && typeof value !== "number") {
    throw new Error(`Dữ liệu sản phẩm thiếu trường ${field}.`);
  }
  return String(value);
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : null;
}

function productBase(record: JsonRecord): ProductSummary {
  const price = requiredString(record.price, "price");
  toMinorUnits(price);
  return {
    id: requiredString(record.id, "id"),
    name: requiredString(record.name, "name"),
    description: optionalString(record.description),
    price,
    imageUrl: optionalString(record.imageUrl),
    categoryId: optionalString(record.categoryId),
    categoryName: optionalString(record.categoryName),
  };
}

function unwrapData(value: unknown): unknown {
  if (isRecord(value) && "data" in value) return value.data;
  return value;
}

function mapSize(value: unknown): ProductSizeOption {
  if (!isRecord(value)) throw new Error("Dữ liệu size sản phẩm không hợp lệ.");
  const extraPrice = requiredString(value.extraPrice, "size.extraPrice");
  toMinorUnits(extraPrice);
  return {
    id: requiredString(value.id, "size.id"),
    sizeCode: requiredString(value.sizeCode, "size.sizeCode"),
    extraPrice,
  };
}

function mapTopping(value: unknown): ToppingOption {
  if (!isRecord(value)) throw new Error("Dữ liệu topping không hợp lệ.");
  const price = requiredString(value.price, "topping.price");
  toMinorUnits(price);
  return {
    id: requiredString(value.id, "topping.id"),
    name: requiredString(value.name, "topping.name"),
    price,
  };
}

function mapProductToppings(value: unknown): ToppingOption[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    if (isRecord(item) && isRecord(item.topping)) return mapTopping(item.topping);
    return mapTopping(item);
  });
}

function mapProductDetail(value: unknown): ProductDetailData {
  const unwrapped = unwrapData(value);
  if (!isRecord(unwrapped)) throw new Error("Không tìm thấy sản phẩm.");

  const sizes = unwrapped.sizes ?? unwrapped.productSizes;
  const toppings = unwrapped.toppings ?? unwrapped.productToppings;

  return {
    ...productBase(unwrapped),
    sizes: Array.isArray(sizes) ? sizes.map(mapSize) : [],
    toppings: mapProductToppings(toppings),
  };
}

export async function getProducts(): Promise<ProductSummary[]> {
  const response = unwrapData(await apiClient<unknown>("/products"));
  if (!Array.isArray(response)) {
    throw new Error("API danh sách sản phẩm trả về dữ liệu không hợp lệ.");
  }
  return response.map((item) => {
    if (!isRecord(item)) throw new Error("Dữ liệu sản phẩm không hợp lệ.");
    return productBase(item);
  });
}

export async function getProductDetail(id: string): Promise<ProductDetailData> {
  return mapProductDetail(
    await apiClient<unknown>(`/products/${encodeURIComponent(id)}`),
  );
}

export function normalizeProductDetail(value: unknown): ProductDetailData {
  return mapProductDetail(value);
}
