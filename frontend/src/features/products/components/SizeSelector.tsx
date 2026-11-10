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
    return <p className="text-xs text-[#667068] italic">Không có lựa chọn size cho món này.</p>;
  }

  return (
    <fieldset className="option-group border-0 p-0 m-0">
      <legend className="flex items-center justify-between w-full font-heading font-bold text-base sm:text-lg text-[#163326] mb-2.5">
        <span>Kích cỡ (Size)</span>
        <span className="text-xs font-normal text-[#667068] font-sans">Chọn theo khẩu vị</span>
      </legend>
      <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
        {sizes.map((size) => {
          const isSelected = selectedSizeId === size.id;
          return (
            <label
              className={`relative flex flex-col justify-center items-center p-2.5 sm:px-4 sm:py-3 border rounded-xl cursor-pointer transition-all min-h-[48px] sm:min-w-[96px] text-center ${
                isSelected
                  ? "border-[#254a39] bg-[#254a39]/10 shadow-xs ring-1 ring-[#254a39]"
                  : "border-[#d8d8cb] bg-[#fbfaf6] hover:bg-white text-[#17231c]"
              }`}
              key={size.id}
            >
              <input
                type="radio"
                name="product-size"
                value={size.id}
                checked={isSelected}
                onChange={() => onChange(size.id)}
                className="sr-only"
              />
              <span className="font-extrabold text-sm text-[#163326]">{size.sizeCode}</span>
              <span className="text-[11px] text-[#667068] mt-0.5 whitespace-nowrap">
                {toExtraLabel(size.extraPrice)}
              </span>
            </label>
          );
        })}
      </div>
      {selectedSizeId && (
        <button
          className="text-xs font-semibold text-[#254a39] hover:underline mt-2 cursor-pointer"
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
