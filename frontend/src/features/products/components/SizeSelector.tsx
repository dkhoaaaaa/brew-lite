import { formatPrice } from "../../../lib/money";
import type { ProductSizeOption } from "../../../types/product";

type SizeSelectorProps = {
  sizes: ProductSizeOption[];
  selectedSizeId: string | null;
  onChange: (sizeId: string | null) => void;
};

export function SizeSelector({
  sizes,
  selectedSizeId,
  onChange,
}: SizeSelectorProps) {
  if (sizes.length === 0) {
    return <p className="option-empty">Không có lựa chọn size cho món này.</p>;
  }

  return (
    <fieldset className="option-group">
      <legend>Size <span>Chọn theo tùy chọn có sẵn</span></legend>
      <div className="size-options">
        {sizes.map((size) => (
          <label className="size-option" key={size.id}>
            <input
              type="radio"
              name="product-size"
              value={size.id}
              checked={selectedSizeId === size.id}
              onChange={() => onChange(size.id)}
            />
            <span className="size-option__code">{size.sizeCode}</span>
            <span className="size-option__price">
              {toExtraLabel(size.extraPrice)}
            </span>
          </label>
        ))}
      </div>
      {selectedSizeId && (
        <button
          className="text-button"
          type="button"
          onClick={() => onChange(null)}
        >
          Bỏ chọn size
        </button>
      )}
    </fieldset>
  );
}

function toExtraLabel(extraPrice: string): string {
  const numeric = Number(extraPrice);
  return numeric > 0 ? `+${formatPrice(extraPrice)}` : "Không phụ thu";
}