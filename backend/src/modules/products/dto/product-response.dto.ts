export class ProductResponseDto {
  /** BigInt không serialize được sang JSON nên trả về dạng string */
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
}
